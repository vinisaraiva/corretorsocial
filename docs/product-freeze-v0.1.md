# Product Freeze v0.1 — Corretor Social

## Fluxo principal

1. Configuração inicial do corretor.
2. Colar URL do imóvel, enviar fotos ou cadastrar manualmente.
3. Revisar informações extraídas.
4. Gerar automaticamente as variantes recomendadas para todas as redes suportadas.
5. Revisar previews por rede apenas se desejar.
6. Publicar, agendar ou ajustar.

## Navegação

- Início
- Imóveis
- Campanhas
- Calendário
- Resultados
- Configurações
- ação global: + Novo imóvel

## Telas

### Onboarding
Nome profissional, CRECI, WhatsApp, site, cidade/região, logo, cor principal e conexão simulada das redes.

### Início
Ação dominante: “Divulgue um imóvel”.
Campo para URL + botão “Criar campanha”.

### Novo imóvel
Três entradas: URL, fotos ou manual.

### Revisão
Preço, localização, características, descrição, diferenciais e galeria editáveis antes de gerar.

### Campanha pronta
Tabs Instagram, Facebook, TikTok e Google.

Instagram possui formatos independentes:
- Feed 4:5 — MVP atual;
- Stories 9:16 — próxima fase;
- Carrossel 4:5 — fase posterior;
- Reel/slideshow permanece fora desta etapa.

Cada formato possui templates próprios. Feed, Stories e Carrossel não reutilizam a mesma arte apenas redimensionada.

Ações principais: Publicar em todas, Agendar e Ajustar campanha.

Especificação: `docs/instagram-formats-v0.1.md`.

### Ajustar campanha
Escolha entre seis artes profissionais de estrutura fixa. O usuário edita headline, subheadline quando suportada, CTA e legenda por rede. Não há editor livre, arraste ou reposicionamento manual.

### Imóveis
Grid/lista com status, campanhas e ações.

### Campanhas
Status: rascunho, agendada, publicada ou erro.

### Calendário
Visual editorial simples.

### Resultados
Publicações, cliques no WhatsApp, melhor campanha e melhor rede.

### Configurações
Perfil, contato, marca, área de atuação, redes e preferências.

## Artes visuais do MVP — Instagram Feed

1. Clean Base
2. Clean Topo
3. Comercial
4. Oportunidade
5. Card Informativo
6. Moldura Branding

Especificação detalhada em `docs/creative-templates-v0.1.md`.

## Instagram — roadmap de formatos

### Feed 4:5
6 artes fixas. Formato atual.

### Stories 9:16
4 artes próprias:
1. Story Clean
2. Story Comercial
3. Story Oportunidade
4. Story Branding

### Carrossel 4:5
3 modelos narrativos:
1. Apresentação
2. Venda Direta
3. Aluguel Prático

Stories e Carrossel não usam editor livre. Estrutura detalhada em `docs/instagram-formats-v0.1.md`.

## Premium

Virtual staging:
- Mobiliar com IA
- estilos Moderno, Minimalista, Clássico e Praiano
- créditos
- sempre rotular “Ambientação virtual gerada por IA”

## Fora do MVP

- CRM
- contratos
- gestão financeira
- comissões
- portal imobiliário
- site imobiliário
- chatbot
- tráfego pago
- equipes/multiusuário
- integrações com CRMs

## Regra de UX

O usuário não deve precisar configurar tudo antes de gerar. Defaults inteligentes primeiro; ajustes ficam atrás de “Ajustar campanha”.

Ao confirmar um imóvel e escolher “Salvar e criar campanha”, o sistema prepara automaticamente as variantes suportadas para Instagram, Facebook, TikTok e Google. O corretor não monta cada rede separadamente. A edição por canal é opcional.

Especificação: `docs/campaign-generation-v0.1.md`.

A família visual 9:16 é compartilhada entre Instagram Stories e TikTok, com safe zones e comportamento específicos de cada plataforma.
