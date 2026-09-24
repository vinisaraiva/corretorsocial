# Supabase — preparação do Corretor Social

## Situação atual

Nenhum projeto Supabase do Corretor Social foi criado ainda.

Na conta atualmente conectada aparecem:
- cataloguei
- profidb

Não reutilizar esses bancos para o Corretor Social.

## Quando criar o projeto

Criar um projeto separado chamado `corretorsocial`, preferencialmente na região `sa-east-1` para o público brasileiro, caso o plano/custo disponível seja aceitável.

Antes de criar via automação, confirmar:
1. organização Supabase;
2. custo informado pelo Supabase;
3. que há vaga gratuita disponível ou que qualquer cobrança foi aceita explicitamente.

## Migration

Arquivo:

`supabase/migrations/001_initial_schema.sql`

Ele cria:
- perfis;
- conexões sociais;
- imóveis;
- mídia dos imóveis;
- campanhas;
- variantes por rede/formato;
- publicações;
- tracking links;
- fila de jobs;
- ledger de créditos de IA;
- índices;
- triggers de updated_at;
- criação automática do perfil após cadastro;
- RLS.

## Segurança

A service role:
- nunca vai para o browser;
- não deve ser usada em componentes client;
- será utilizada apenas por server-side/worker quando necessário.

Tokens OAuth não serão salvos em texto aberto em tabelas acessíveis ao cliente. A tabela guarda apenas referência/metadata de segredo; a estratégia final de cofre será definida junto com as integrações.

## Próxima etapa após criar o projeto

1. aplicar migration;
2. executar Security Advisor;
3. executar Performance Advisor;
4. gerar types TypeScript do banco;
5. adicionar `@supabase/supabase-js` e `@supabase/ssr`;
6. configurar cookies/sessão no Next.js;
7. criar login/cadastro;
8. substituir mocks de profile/properties por dados reais;
9. Storage para logo e fotos;
10. só depois ligar extrator/IA.
