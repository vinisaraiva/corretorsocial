# Frontend QA — Corretor Social

Última revisão funcional antes de conectar backend.

## Rotas

- [x] /
- [x] /onboarding
- [x] /onboarding?mode=review
- [x] /imoveis
- [x] /imoveis/novo
- [x] /imoveis/[id]
- [x] /campanhas
- [x] /campanhas/nova?imovel=[id]
- [x] /campanhas/[id]
- [x] /calendario
- [x] /resultados
- [x] /configuracoes
- [x] /mais
- [x] /api/health

## Fluxos

### Configuração

- Primeiro onboarding permanece limpo, fora do dashboard.
- Revisão do onboarding pelo dashboard usa AppShell.
- No modo revisão, o botão final é "Salvar alterações".
- Mobile possui hub "Mais" para Calendário, Resultados e Configurações.

### Imóveis

- URL inicia fluxo de leitura simulado.
- Upload de fotos possui feedback visual.
- Cadastro manual possui validação mínima.
- Revisão permite editar os dados.
- Filtros Todos / Ativos / Arquivados funcionam.

### Campanhas

- Campanha existente usa campaign ID na URL.
- Nova campanha nasce de property ID via /campanhas/nova.
- Preview muda por rede.
- Headline e CTA podem ser ajustados.
- Estilo visual pode ser trocado.
- Agendamento simulado funciona.
- Publicação simulada funciona.
- Virtual staging permite escolher estilo e gerar prévia simulada.
- A indicação "Ambientação virtual gerada por IA" permanece no resultado.

## Pendências que dependem de backend

- autenticação real;
- persistência;
- upload real;
- extração real de URL;
- OpenAI;
- renderização real;
- publicação social;
- tracking real de WhatsApp;
- cobrança;
- créditos reais.

## Deploy

A hospedagem principal de desenvolvimento é Hostinger Business via GitHub.

Segundo a documentação atual da Hostinger, aplicações Node.js conectadas ao GitHub podem receber build/deploy automático a cada push para a branch configurada.

## Critério para ligar banco real

1. versão atual fazer deploy sem erro;
2. usuário validar visualmente desktop/mobile;
3. schema Supabase já está preparado;
4. criar projeto Supabase dedicado somente quando houver slot gratuito ou orçamento explícito.
