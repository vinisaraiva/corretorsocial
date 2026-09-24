# Corretor Social Worker

Background worker independente do Next.js/Hostinger.

## Responsabilidades futuras

- análise visual das fotos;
- renderização pesada;
- slideshow/vídeo;
- publicação em redes;
- retries e jobs agendados.

## Execução local

1. Entre em `worker/`.
2. Copie `.env.example` para `.env`.
3. Configure `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.
4. Execute `npm install`.
5. Execute `npm start`.

O service role nunca deve ir para o frontend ou para variáveis `NEXT_PUBLIC_*`.

## Estado atual

A fila, claim atômico, retry e recuperação de locks estão implementados.

Nenhum job de IA é enfileirado ainda. O primeiro handler real será a análise de mídia.
