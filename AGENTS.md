# AGENTS.md — Corretor Social

Este arquivo contém regras obrigatórias para qualquer agente de IA ou desenvolvedor que trabalhe neste repositório.

## Fonte de verdade

- O repositório `vinisaraiva/corretorsocial` é a fonte de verdade.
- Não substituir a aplicação por código gerado em outro runtime sem autorização explícita.
- O projeto visual do Lovable é apenas referência de UX/UI.

## Stack oficial

- Next.js com App Router
- React
- TypeScript estrito
- Tailwind CSS
- shadcn/ui quando componentes reutilizáveis forem necessários
- Supabase será usado para Auth, PostgreSQL e Storage quando o backend for iniciado.

### Não usar

- TanStack Start como framework da aplicação
- React Router
- Firebase como backend principal
- Hermes no caminho crítico do produto

## Arquitetura

O Next.js cuida de:
- interface;
- autenticação e sessão;
- CRUD leve;
- callbacks OAuth;
- endpoints leves;
- painel e previews.

Processamento pesado deve sair do request web e ir para workers/filas:
- scraping complexo;
- download/processamento de muitas imagens;
- análise de lote;
- FFmpeg;
- geração de Reel;
- publicação/agendamento em redes;
- retries;
- tarefas demoradas de IA.

Integrações críticas serão feitas por API direta:
- OpenAI;
- Meta;
- TikTok;
- Google Business Profile;
- pagamentos.

Hermes pode ser usado futuramente apenas para operação interna, suporte e observabilidade.

## Produto

Promessa central:

> Cole o link do imóvel. O Corretor Social cria, adapta, agenda e publica a campanha nas suas redes.

Público inicial:
- corretor autônomo brasileiro;
- inclusive usuários mais velhos ou pouco familiarizados com tecnologia.

### Regra de UX

Defaults inteligentes primeiro. Configuração avançada só aparece quando o usuário pede.

O fluxo principal deve continuar curto:

1. colar URL;
2. revisar imóvel;
3. gerar campanha;
4. revisar previews;
5. publicar ou agendar.

## Escopo do MVP

- onboarding;
- perfil profissional, CRECI, WhatsApp e marca;
- imóveis por URL, fotos ou manual;
- revisão dos dados;
- análise de argumentos e fotos;
- criativos para Instagram, Facebook, TikTok e Google Business;
- Feed, Carrossel, Story e Reel/slideshow;
- textos adaptados;
- preview;
- publicar/agendar;
- histórico;
- links rastreáveis para WhatsApp;
- métricas simples.

## Premium

Virtual staging é recurso Premium/créditos.

Qualquer fotografia alterada generativamente deve ser identificada ao usuário como:

> Ambientação virtual gerada por IA

Nunca gerar fotografia falsa do imóvel como se fosse documental.

## Fora do MVP

Não implementar sem nova decisão de produto:
- CRM imobiliário completo;
- contratos;
- financeiro;
- comissões;
- portal/site imobiliário;
- chatbot completo;
- Meta Ads;
- TikTok Ads;
- Google Ads;
- multiusuário/equipes;
- integrações com CRMs imobiliários.

## Design

Direção:
- profissional;
- clara;
- amigável;
- baixa densidade;
- sem estética neon/futurista de IA.

Tokens principais:
- background: #F7F8FA
- surface: #FFFFFF
- text: #18202A
- muted: #667085
- primary: #176B5B

Botões importantes devem ter aproximadamente 44–48px de altura.

## Segurança

- Nunca expor tokens OAuth no client.
- Nunca persistir secrets no repositório.
- Aplicar RLS em todas as tabelas de dados do usuário quando Supabase for criado.
- Tokens de redes sociais devem ser criptografados/protegidos no backend.
- Publicação e cobrança são operações idempotentes e auditáveis.

## Antes de alterar arquitetura

Documentar a decisão em `docs/` e explicar:
- problema;
- alternativas;
- trade-offs;
- impacto na portabilidade;
- impacto no custo.
