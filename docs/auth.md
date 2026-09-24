# Autenticação

O Corretor Social usa Supabase Auth com cookies via `@supabase/ssr`.

## Variáveis obrigatórias na hospedagem

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Ambas são credenciais públicas destinadas ao cliente e devem ser configuradas no ambiente da Hostinger, não hardcoded no repositório.

## Fluxo

- `/login`: login e criação de conta por e-mail/senha.
- cadastro cria automaticamente uma linha em `public.profiles` através do trigger `handle_new_user`.
- RLS garante que cada usuário acesse apenas os próprios dados.
- `proxy.ts` mantém a sessão atualizada.
- o dashboard ainda não está bloqueado nesta etapa para não interromper o deploy antes da configuração das variáveis.

## Próxima etapa

Depois de confirmar login/cadastro em produção:
1. proteger rotas do app;
2. redirecionar não autenticados para `/login`;
3. redirecionar novos usuários com onboarding incompleto para `/onboarding`;
4. carregar perfil real no shell;
5. substituir mocks gradualmente.
