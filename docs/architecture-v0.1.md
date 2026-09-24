# Arquitetura v0.1 — Corretor Social

Status: proposta aprovada para orientar o desenvolvimento. Backend ainda não conectado.

## 1. Visão geral

```text
Navegador
   |
   v
Next.js App Router
   |
   +---- Supabase Auth
   +---- PostgreSQL / RLS
   +---- Supabase Storage
   |
   +---- API / serviços leves
   |
   v
Fila de jobs
   |
   v
Workers
   +---- extrator de imóvel
   +---- análise IA
   +---- renderização de criativos
   +---- FFmpeg / Reel
   +---- publicação social
   +---- retries / agendamento
   |
   +---- OpenAI API
   +---- Meta APIs
   +---- TikTok APIs
   +---- Google Business Profile APIs
```

## 2. Fronteiras

### Next.js

Responsável por:
- páginas;
- onboarding;
- sessão;
- CRUD;
- previews;
- iniciar jobs;
- consultar status;
- receber callbacks OAuth leves;
- painel.

Não deve bloquear requests esperando:
- renderização de vídeo;
- scraping demorado;
- processamento em lote;
- publicação em quatro redes.

### Supabase

Planejado para:
- Auth;
- PostgreSQL;
- Row Level Security;
- Storage de logos, imagens importadas e assets processados.

### Worker

Planejado para tarefas assíncronas e idempotentes.

Estados básicos de job:
- queued
- processing
- completed
- failed
- retrying

## 3. Domínios de dados previstos

### profiles
Perfil profissional do usuário.

Campos conceituais:
- user_id
- professional_name
- creci
- whatsapp
- phone
- website
- city
- service_regions
- logo_path
- primary_color
- secondary_color
- communication_tone

### social_connections
Uma conexão por rede/conta.

- user_id
- provider
- external_account_id
- display_name
- status
- token reference/secret reference
- expires_at

Tokens não devem ser expostos ao browser.

### properties
- id
- user_id
- source_url
- purpose
- title
- price
- location
- bedrooms
- suites
- bathrooms
- parking
- area
- description
- highlights
- status

### property_media
- property_id
- original_url
- storage_path
- media_type
- width
- height
- sort_order
- ai_score
- ai_tags
- is_cover

### campaigns
- property_id
- user_id
- visual_style
- marketing_angle
- status
- created_at

### campaign_variants
Uma variante por rede/formato.

- campaign_id
- provider
- format
- headline
- caption
- hashtags
- cta
- rendered_asset_path

### publications
Registro auditável por tentativa de publicação.

- campaign_variant_id
- social_connection_id
- scheduled_for
- status
- external_post_id
- published_at
- last_error
- retry_count

### tracking_links
- property_id
- campaign_id
- provider
- destination
- short_code
- clicks

### ai_credits
Para funções Premium como virtual staging.

## 4. Fluxo: URL para campanha

1. usuário envia URL;
2. Next cria property_import job;
3. worker faz fetch/extrai dados e imagens;
4. dados estruturados são persistidos;
5. usuário revisa;
6. Next cria campaign_generation job;
7. worker analisa fotos e argumentos;
8. modelo de texto cria copies;
9. motor programático monta artes;
10. worker gera Reel/slideshow;
11. usuário recebe previews;
12. publica ou agenda.

## 5. Criativos

Fluxo normal:
- fotografia real;
- crop/enquadramento;
- tratamento leve;
- composição;
- logo;
- CRECI;
- preço;
- CTA.

Não usar geração de imagem completa no fluxo normal do imóvel.

### Premium

GPT Image / modelo de edição de imagem pode ser usado para:
- virtual staging;
- expansão de imagem;
- conteúdo institucional.

Sempre marcar staging de forma explícita.

## 6. Publicação social

Primeira ordem de implementação:

1. Meta / Instagram + Facebook
2. Google Business Profile
3. TikTok

Motivo: validar o motor de publicação primeiro em Meta, enquanto permissões/auditorias das demais plataformas são tratadas.

Cada publicação precisa de:
- idempotency key;
- status persistido;
- external id;
- retry com limite;
- log de erro legível.

## 7. WhatsApp

No MVP não implementar CRM completo.

Gerar links rastreáveis por campanha/imóvel e redirecionar para o WhatsApp do corretor com mensagem pré-preenchida.

Exemplo conceitual:
- origem: Instagram
- campaign_id: X
- property_id: Y
- destino: WhatsApp do corretor

## 8. Custos

Regra de arquitetura:
- texto com modelo econômico;
- imagem real como matéria-prima;
- renderização normal programática;
- Reel com fotos/FFmpeg;
- IA generativa de imagem cobrada por crédito.

Isso protege a margem do plano Corretor de R$ 89,90.

## 9. Próximas etapas técnicas

Após aprovação final do frontend:

1. criar projeto Supabase;
2. migrations e RLS;
3. Auth;
4. persistência do perfil;
5. persistência de imóveis;
6. Storage;
7. extrator URL;
8. OpenAI texto;
9. motor de criativos;
10. OAuth Meta;
11. publicação Meta;
12. Google;
13. TikTok;
14. cobrança.
