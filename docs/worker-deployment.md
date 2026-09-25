# Worker — deploy na Hostinger Business

## Estratégia inicial recomendada

Para o MVP, usar o worker em modo **cron one-shot** na mesma hospedagem Hostinger Business.

A Hostinger permite Cron Jobs customizados em hospedagem web/cloud. O worker foi preparado para:
- reivindicar jobs de forma atômica;
- processar um job;
- aplicar retry/idempotência;
- encerrar o processo.

Isso evita depender de um processo infinito em hospedagem web gerenciada.

Quando o volume justificar, o mesmo código também pode rodar em modo daemon 24/7 em VPS/Render/Railway ou infraestrutura equivalente.

## Build

O build principal da aplicação agora executa:

```bash
next build && tsc -p worker/tsconfig.build.json
```

Ao final deve existir:

```text
worker/dist/run-once.js
worker/dist/index.js
```

- `run-once.js`: execução por cron;
- `index.js`: daemon contínuo.

## Arquivo seguro de ambiente do cron

Não presumir que o Cron Job herda automaticamente as variáveis configuradas no painel da aplicação Node.

Crie no servidor, fora do Git, um arquivo:

```text
.env.worker.local
```

Conteúdo mínimo:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
WORKER_ID=corretor-social-worker
STALE_JOB_MINUTES=15
CRON_MAX_JOBS=1

OPENAI_API_KEY=
OPENAI_VISION_MODEL=gpt-5.6-luna

APP_PUBLIC_URL=https://SEU-DOMINIO
SOCIAL_TOKEN_ENCRYPTION_KEY=
META_GRAPH_VERSION=v26.0
```

A mesma `SOCIAL_TOKEN_ENCRYPTION_KEY` usada no Next.js deve ser usada no worker.

Nunca adicionar esse arquivo ao Git. O padrão `.env.*.local` já é ignorado pelo repositório.

## Comando do Cron Job

No hPanel, crie um Cron Job do tipo **Custom**.

Use o diretório real onde a aplicação GitHub foi implantada:

```bash
cd CAMINHO_DA_APLICACAO && node --env-file=.env.worker.local worker/dist/run-once.js
```

Para o MVP, a intenção é executar a cada minuto:

```cron
* * * * *
```

Como a Hostinger informa que o agendamento do cron usa UTC, horários fixos devem ser convertidos para UTC. Para uma recorrência a cada minuto isso não altera o comportamento.

## Concorrência

`CRON_MAX_JOBS=1` é deliberado no início.

Um post do Instagram, especialmente carrossel, pode aguardar processamento da Meta. Processar vários jobs na mesma execução poderia aumentar duração, CPU e chance de sobreposição.

Se duas execuções de cron se sobrepuserem:
- `claim_jobs` usa lock/claim atômico;
- o mesmo job não deve ser reivindicado duas vezes;
- jobs diferentes podem ser processados simultaneamente.

Aumentar `CRON_MAX_JOBS` somente após observar tempo médio e consumo de recursos.

## Teste operacional

Antes de habilitar publicação real:

1. confirmar que o deploy gerou `worker/dist/run-once.js`;
2. criar `.env.worker.local`;
3. executar manualmente o comando do cron;
4. confirmar no output que o worker inicia e encerra;
5. criar um job de análise/publicação de teste;
6. executar manualmente novamente;
7. verificar `jobs.status`;
8. só então ativar a recorrência.

## Daemon

Em ambiente com processo persistente confiável:

```bash
node --env-file=.env.worker.local worker/dist/index.js
```

O daemon consulta a fila continuamente usando `POLL_INTERVAL_MS`.

Não executar daemon e cron em paralelo sem necessidade. A fila é segura contra claim duplicado, mas isso aumenta concorrência e consumo sem benefício no MVP.
