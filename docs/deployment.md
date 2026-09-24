# Deploy — Corretor Social

## Plataforma recomendada para o frontend

Vercel.

Motivos:
- integração nativa com Next.js;
- previews automáticos por commit/PR;
- logs de build e runtime;
- rollback;
- domínio customizado;
- não exige adaptar a aplicação para um runtime diferente.

O Lovable é usado somente como referência visual porque o runtime disponível no workspace utilizado força TanStack Start.

## Repositório oficial

`vinisaraiva/corretorsocial`

Branch principal: `main`.

## Build esperado

```bash
npm install
npm run typecheck
npm run build
```

## Rota de saúde

Após o deploy:

```text
GET /api/health
```

Resposta esperada:

```json
{
  "ok": true,
  "service": "corretor-social",
  "framework": "nextjs",
  "timestamp": "..."
}
```

## Variáveis

Na fase atual de frontend mockado nenhuma variável externa é obrigatória.

Quando Supabase e integrações forem ligadas, usar `.env.example` como referência e cadastrar valores reais apenas no ambiente seguro da plataforma.

## Critério de aprovação do frontend

Antes de iniciar Supabase:

1. build de produção concluído;
2. preview acessível;
3. verificar desktop e mobile;
4. percorrer:
   - onboarding;
   - URL → revisão;
   - revisão → campanha;
   - previews por rede;
   - virtual staging simulado;
   - imóveis;
   - campanhas;
   - calendário;
   - resultados;
   - configurações;
5. corrigir UX aprovada pelo usuário;
6. só então iniciar persistência/autenticação real.

## GitHub Actions

Foi adicionado um workflow de CI. As primeiras execuções não chegaram a receber runner (`runner_id: 0` e nenhum step executado), portanto essas falhas não são consideradas falhas de TypeScript ou de build da aplicação.

O build do deploy será usado também como segunda validação enquanto essa condição do Actions é investigada.
