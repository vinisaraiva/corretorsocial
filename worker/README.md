# Corretor Social Worker

Background worker independente do Next.js/Hostinger.

## Responsabilidades atuais

- análise visual das fotos;
- consumo atômico da fila de `jobs`;
- retry exponencial e recuperação de locks;
- publicação Meta:
  - Facebook Page Feed;
  - Instagram Feed;
  - Instagram Story;
  - Instagram Carrossel.

## Responsabilidades futuras

- slideshow/vídeo TikTok;
- Google Business Profile;
- renderização pesada fora do navegador;
- outras tarefas assíncronas do produto.

## Execução local

1. Entre em `worker/`.
2. Copie `.env.example` para `.env`.
3. Configure `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.
4. Para análise de mídia, configure `OPENAI_API_KEY`.
5. Para publicação Meta, configure a mesma `SOCIAL_TOKEN_ENCRYPTION_KEY` usada pelo Next.js.
6. Execute `npm install`.
7. Execute `npm run typecheck`.
8. Execute `npm start`.

O service role nunca deve ir para o frontend ou para variáveis `NEXT_PUBLIC_*`.

## Publicação social

Jobs do tipo `social_publish` são criados pelo Next.js.

O worker:

- rejeita jobs antigos depois de reagendamento;
- confirma que a conexão social continua ativa;
- usa `publications.idempotency_key` para não repetir variantes já confirmadas;
- cria URLs temporárias para os assets privados;
- publica usando a Graph API da Meta;
- registra `external_post_id`;
- marca a campanha como `published` após concluir todas as variantes;
- marca a campanha como `failed` quando o último retry falha.

Veja `docs/meta-integration.md`.
