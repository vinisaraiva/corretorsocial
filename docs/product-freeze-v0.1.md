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
- Feed 4:5;
- Stories 9:16;
- Carrossel 4:5 quando o imóvel possui pelo menos 3 fotos;
- Reel/slideshow permanece fora desta etapa.

Feed e Carrossel possuem composições próprias. Instagram Stories e TikTok compartilham a família visual vertical 9:16, com adaptações de safe zone por plataforma. Nenhum formato é tratado apenas como redimensionamento automático da mesma arte.

Ações principais: Publicar em todas, Agendar e Ajustar campanha.

Especificação: `docs/instagram-formats-v0.1.md`.

### Ajustar campanha
O estilo visual é global para a campanha e nasce em **Clean Base** por padrão. Ao trocar o estilo, o sistema aplica automaticamente a composição equivalente aos formatos das demais redes.

Ajustes de mídia permanecem independentes: headline/subheadline/CTA/legenda quando aplicável e, nos templates compatíveis, **Posição da chamada**.

Posição da chamada aceita somente:
- Automática;
- Esquerda;
- Direita, quando segura para a plataforma.

A opção move o bloco completo de conteúdo. Não existe alinhamento livre, drag, coordenadas, margens ou reposicionamento manual. No TikTok, a direita permanece reservada para a interface da plataforma.

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

Os seis estilos são suficientes para o MVP e ficam congelados nesta fase. Não adicionar modelos apenas para aumentar variedade. Novos estilos exigem uma necessidade visual não coberta ou evidência de uso real.

Recomendação automática: `docs/creative-intelligence-v0.1.md`.

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
Disponível automaticamente quando existem pelo menos 3 fotos distintas.

Modelos narrativos:
1. Apresentação — padrão para Venda;
2. Venda Direta — alternativa comercial para Venda;
3. Aluguel Prático — padrão para Aluguel.

O modelo narrativo não é um estilo visual independente: ele herda o estilo global da campanha.

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


## Herança visual da campanha

- estilo padrão: `clean-base`;
- Clean Base / Clean Topo → Vertical Clean;
- Comercial / Card Informativo → Vertical Comercial;
- Oportunidade → Vertical Oportunidade;
- Moldura Branding → Vertical Branding.

A posição do bloco não é global. Cada variante salva sua própria posição em `campaign_variants.render_metadata.block_position`.

`auto` usa a composição recomendada pelo template nesta versão do produto e poderá futuramente considerar análise automática da fotografia.


## Override de estilo por mídia

Não faz parte do MVP.

O usuário pode ajustar por mídia:
- headline/subheadline/CTA quando aplicável;
- legenda;
- posição controlada do bloco;
- modelo narrativo do Carrossel.

O estilo visual permanece global para preservar consistência e reduzir decisões.

A estrutura de `campaign_variants.render_metadata.visual_style` continua capaz de armazenar estilos específicos por variante. Portanto, se dados reais de uso mostrarem necessidade, pode-se adicionar futuramente um controle avançado **Seguir estilo da campanha / Personalizar esta versão** sem migração de banco.

Não expor esse controle antes de haver evidência de uso suficiente.
