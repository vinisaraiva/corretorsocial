# Integração Meta — Facebook + Instagram

## Estado

A integração do Corretor Social usa a Graph API v26.0.

Fluxo implementado:

1. usuário inicia OAuth em Configurações;
2. callback valida `state` anti-CSRF;
3. token de usuário é trocado por token de longa duração;
4. o sistema lista as Páginas administradas;
5. o usuário escolhe explicitamente a Página;
6. Facebook Page e Instagram profissional vinculado são persistidos em `social_connections`;
7. tokens são armazenados criptografados com AES-256-GCM;
8. campanhas podem ser publicadas imediatamente ou agendadas;
9. o worker cria registros em `publications`, publica e aplica retry/idempotência.

## Permissões solicitadas

- `pages_show_list`
- `pages_read_engagement`
- `pages_manage_posts`
- `instagram_basic`
- `instagram_content_publish`

A Página precisa expor a tarefa `CREATE_CONTENT` para ser selecionada.

## Redirect OAuth

Configure na Meta exatamente o callback público:

```text
https://SEU-DOMINIO/api/oauth/meta/callback
```

O mesmo valor deve ser usado em:

```env
NEXT_PUBLIC_APP_URL=https://SEU-DOMINIO
META_REDIRECT_URI=https://SEU-DOMINIO/api/oauth/meta/callback
```

Em hospedagens atrás de proxy reverso, como a Hostinger, o processo Next.js pode enxergar internamente algo como `0.0.0.0:3000`. Rotas OAuth não devem usar esse endereço como origem pública. O Corretor Social resolve redirects pela URL pública configurada, usando `NEXT_PUBLIC_APP_URL` como primeira fonte e `META_REDIRECT_URI` como fallback.

Depois de alterar essas variáveis em produção, faça redeploy/restart da aplicação antes de testar novamente.

## Variáveis do Next.js

```env
NEXT_PUBLIC_APP_URL=https://SEU-DOMINIO
META_APP_ID=
META_APP_SECRET=
META_REDIRECT_URI=https://SEU-DOMINIO/api/oauth/meta/callback
META_GRAPH_VERSION=v26.0
META_LOGIN_CONFIG_ID=
SOCIAL_TOKEN_ENCRYPTION_KEY=
```

`META_LOGIN_CONFIG_ID` é opcional e deve ser preenchido somente se o app usar uma configuração do Facebook Login for Business.

## Chave de criptografia

A mesma chave precisa existir no frontend/server Next.js e no worker.

Gere uma chave de 32 bytes em Base64, por exemplo com Node:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Depois salve o valor como:

```env
SOCIAL_TOKEN_ENCRYPTION_KEY=...
```

Não rotacione essa chave sem antes recriptografar os tokens existentes.

## Variáveis do worker

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
APP_PUBLIC_URL=https://SEU-DOMINIO
SOCIAL_TOKEN_ENCRYPTION_KEY=
META_GRAPH_VERSION=v26.0
```

O worker também mantém as variáveis já usadas pela análise de mídia.

## Formatos Meta publicados no MVP

### Facebook

- Feed/post com uma imagem final.

### Instagram

- Feed 4:5;
- Story 9:16;
- Carrossel 4:5 quando disponível.

As artes finais são JPEG. Campanhas antigas com PNG são consideradas desatualizadas e serão renderizadas novamente antes de publicação/agendamento.

## Fila e idempotência

O Next.js nunca publica diretamente na Meta.

Ele cria um job `social_publish`.

O worker:

1. confirma que o job ainda corresponde ao agendamento/status atual;
2. confirma que a conexão continua ativa;
3. cria/reutiliza um registro em `publications` para cada variante;
4. ignora variantes já marcadas como `published`;
5. publica na Meta;
6. salva `external_post_id`;
7. atualiza a campanha para `published`;
8. em falha, usa retry exponencial da fila;
9. ao esgotar tentativas, marca a campanha como `failed`.

Isso evita duplicar variantes que já foram confirmadas em uma tentativa anterior.

## Checklist de teste

1. configurar as variáveis no Next.js e no worker;
2. conectar Meta em Configurações;
3. selecionar uma Página com `CREATE_CONTENT`;
4. confirmar que Facebook aparece conectado;
5. se houver Instagram profissional vinculado, confirmar que ele também aparece;
6. criar campanha;
7. marcar Instagram e/ou Facebook;
8. testar `Publicar agora`;
9. conferir `publications` no Supabase;
10. testar um agendamento futuro;
11. confirmar que um reagendamento torna o job antigo obsoleto;
12. desconectar Meta e confirmar que novas publicações são bloqueadas.


## Tracking de WhatsApp

Para Facebook e para legendas do Instagram Feed/Carrossel, o worker cria um link curto por campanha/rede:

```text
https://SEU-DOMINIO/r/<codigo>
```

Ao abrir esse endereço, o Next.js:
1. procura o código usando um client server-only com `service_role`;
2. incrementa `tracking_links.clicks`;
3. redireciona para `wa.me` com uma mensagem pré-preenchida.

O Instagram não transforma URLs da legenda em links clicáveis. Portanto o tracking de Instagram via legenda tende a ter conversão menor e não deve ser interpretado como cobertura completa de todos os contatos vindos da rede.

Story não recebe link na publicação automática porque a API usada aqui não cria sticker interativo de link.
