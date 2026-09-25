# Integrações Meta — Facebook + Instagram

## Arquitetura

Facebook e Instagram são conexões independentes no Corretor Social.

Para o usuário isso é simples:

- **Conectar Facebook** autoriza uma Página do Facebook;
- **Conectar Instagram** autoriza diretamente uma conta profissional Business ou Creator;
- na criação/publicação de campanhas, o Corretor Social usa automaticamente a credencial correspondente a cada rede selecionada.

Uma conexão não depende da outra. Conectar, reconectar ou desconectar Facebook não altera Instagram, e vice-versa.

A aplicação usa Graph API v26.0 por padrão.

## Facebook

### Fluxo

1. usuário clica em **Conectar Facebook**;
2. OAuth valida `state` anti-CSRF;
3. o token de usuário é trocado por token de longa duração;
4. o sistema consulta `/me/accounts`;
5. se houver uma única Página apta a publicar, ela é conectada automaticamente;
6. se houver mais de uma, o Corretor Social pergunta qual Página usar;
7. o Page Access Token é armazenado criptografado em `social_connections`;
8. nenhuma conta Instagram é criada/alterada por esse fluxo.

### Permissões

Somente permissões de Facebook Pages:

- `pages_show_list`
- `pages_read_engagement`
- `pages_manage_posts`

A Página precisa expor a tarefa `CREATE_CONTENT`.

### Callback

```text
https://SEU-DOMINIO/api/oauth/meta/callback
```

### Variáveis

```env
NEXT_PUBLIC_APP_URL=https://SEU-DOMINIO
META_APP_ID=
META_APP_SECRET=
META_REDIRECT_URI=https://SEU-DOMINIO/api/oauth/meta/callback
META_GRAPH_VERSION=v26.0
META_LOGIN_CONFIG_ID=
META_USE_LOGIN_CONFIG=false
```

`META_LOGIN_CONFIG_ID` pode permanecer salvo, mas o fluxo simplificado ignora o seletor de ativos do Facebook Login for Business enquanto `META_USE_LOGIN_CONFIG` estiver ausente ou `false`.

## Instagram

O Instagram usa **Instagram API with Instagram Login**, sem depender de uma Página do Facebook.

A Meta mantém credenciais específicas do produto Instagram. O **Instagram App ID** e o **Instagram App Secret** exibidos em:

`Instagram → API setup with Instagram login`

não devem ser confundidos com `META_APP_ID` e `META_APP_SECRET`.

### Fluxo

1. usuário clica em **Conectar Instagram**;
2. é levado ao Business Login for Instagram;
3. autoriza a conta profissional;
4. o callback valida `state`;
5. o código é trocado por token curto;
6. o servidor troca imediatamente pelo token de longa duração;
7. consulta `graph.instagram.com/.../me` para obter `user_id`, username e tipo da conta;
8. armazena o token criptografado em `social_connections`;
9. o worker usa `graph.instagram.com` para publicar;
10. quando o token estiver a menos de 7 dias do vencimento, o worker tenta renová-lo automaticamente.

Somente contas profissionais Business ou Creator são suportadas pela API oficial.

### Permissões

- `instagram_business_basic`
- `instagram_business_content_publish`

Não solicitar permissões de mensagens/comentários enquanto o produto não usar essas funções.

### Callback

```text
https://SEU-DOMINIO/api/oauth/instagram/callback
```

Esse callback deve ser cadastrado em **Instagram → API setup with Instagram login → Business login settings**.

### Variáveis

```env
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
INSTAGRAM_REDIRECT_URI=https://SEU-DOMINIO/api/oauth/instagram/callback
INSTAGRAM_GRAPH_VERSION=v26.0
```

## Criptografia dos tokens

Facebook e Instagram usam a mesma chave interna de criptografia do Corretor Social:

```env
SOCIAL_TOKEN_ENCRYPTION_KEY=
```

Ela deve conter exatamente 32 bytes em Base64 e deve ser a mesma no Next.js e no worker.

Geração local:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Nunca commitar ou expor a chave.

## Publicação

### Facebook

- Feed/post com imagem final.

### Instagram

- Feed 4:5;
- Carrossel 4:5;
- Story 9:16 apenas quando a conta/conjunto de permissões suportar Story.

Para conexões diretas, o worker armazena o tipo da conta. Em conta Creator, o Story não deve derrubar toda a campanha; os formatos compatíveis continuam sendo publicados.

As artes finais são JPEG.

## Worker

O Next.js não publica diretamente nas redes. Ele cria um job `social_publish`.

O worker:

1. valida o job e o estado atual da campanha;
2. carrega a conexão independente de cada provider;
3. descriptografa o token correspondente;
4. para Facebook, usa `graph.facebook.com`;
5. para Instagram Login, usa `graph.instagram.com`;
6. renova token Instagram próximo do vencimento quando possível;
7. usa idempotência por campanha/variante/conexão;
8. não republica variantes já confirmadas;
9. grava `external_post_id`;
10. aplica retry em falhas.

## Checklist de teste

### Facebook

1. clicar em **Conectar Facebook**;
2. autorizar;
3. com uma Página, confirmar conexão automática;
4. com várias, confirmar que a escolha ocorre só no Corretor Social;
5. confirmar a linha `facebook` em `social_connections`.

### Instagram

1. cadastrar `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET` e callback;
2. adicionar a conta de teste ao app enquanto ele estiver em desenvolvimento;
3. clicar em **Conectar Instagram**;
4. autorizar pelo Instagram;
5. confirmar username e provider `instagram` em `social_connections`.

### Publicação

1. criar campanha;
2. marcar somente Facebook e publicar;
3. marcar somente Instagram e publicar;
4. marcar ambos e publicar;
5. confirmar que cada rede usa sua própria conexão;
6. conferir `publications`, IDs externos e tracking;
7. testar agendamento futuro;
8. testar reconexão de uma rede sem afetar a outra.

## Tracking de WhatsApp

O worker mantém um link rastreável separado por campanha e provider:

```text
https://SEU-DOMINIO/r/<codigo>
```

Facebook pode receber esse link na publicação. No Instagram, URLs em legendas não são clicáveis, portanto o tracking via legenda é incompleto e não deve ser tratado como atribuição total.
