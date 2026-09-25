# Supabase — Corretor Social

## Estado atual

O Supabase já faz parte do backend real do Corretor Social.

O app usa:
- Auth;
- PostgreSQL com RLS;
- Storage;
- perfis;
- imóveis e mídias;
- campanhas e variantes;
- conexões sociais;
- fila de jobs;
- publicações;
- links rastreáveis;
- créditos/ledger previstos pelo schema.

O projeto do Corretor Social está em uma conta/projeto Supabase separado dos projetos que aparecem no conector Supabase disponível nesta sessão. Não aplicar migrations em outro projeto apenas por ele estar acessível no conector.

## Fonte de verdade do schema

A fonte de verdade é o diretório:

`supabase/migrations/`

Não usar nomes históricos como `001_initial_schema.sql` como referência operacional.

As migrations são versionadas por timestamp. Entre as migrations existentes estão:
- schema inicial;
- fila/claim atômico;
- operações de mídia;
- reforços de segurança;
- incremento atômico de tracking;
- unicidade de link rastreável por campanha/rede.

## Aplicação de migrations

Antes de testar uma feature que dependa de migration nova, aplicar todas as migrations pendentes no projeto Supabase correto.

Fluxo recomendado com Supabase CLI:

```bash
supabase login
supabase link --project-ref SEU_PROJECT_REF
supabase db push
```

Nunca salvar access token, senha do banco ou service role no repositório.

Se a migration for aplicada manualmente pelo SQL Editor, manter o arquivo correspondente em `supabase/migrations/` para que o GitHub continue sendo a fonte de verdade.

## Segurança

- RLS permanece habilitado nas tabelas de dados do usuário.
- `SUPABASE_SERVICE_ROLE_KEY` é server-only/worker.
- Tokens OAuth não vão para o browser.
- Tokens Meta são criptografados antes de serem salvos em `social_connections.token_secret_ref`.
- `SOCIAL_TOKEN_ENCRYPTION_KEY` deve existir somente em ambientes seguros.
- Funções administrativas como incremento atômico de tracking são concedidas somente a `service_role`.

## Types TypeScript

`types/database.ts` deve acompanhar o schema aplicado.

Depois de alterações maiores no banco, regenerar os tipos a partir do projeto correto e comparar o diff antes de substituir o arquivo.

## Verificações recomendadas após migrations

1. Security Advisor;
2. Performance Advisor;
3. confirmar RLS;
4. confirmar índices/constraints novos;
5. validar Auth;
6. validar Storage;
7. validar worker com service role;
8. executar um fluxo E2E representativo.
