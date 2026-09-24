# Instagram Formats v0.1 — Corretor Social

## Decisão de produto

Instagram não será tratado como uma única arte redimensionada.

Existem três produtos visuais independentes:

1. Feed 4:5
2. Stories 9:16
3. Carrossel 4:5

Cada formato possui templates próprios e composição própria.

O Corretor Social continua sem editor livre. O usuário escolhe uma composição profissional pronta e edita apenas o conteúdo permitido.

## Ordem oficial de implementação

### Fase 1 — Feed
Status: em implementação/consolidação.

### Fase 2 — Stories
Implementado com família vertical compartilhada.

### Fase 3 — Carrossel
Implementado como preview/persistência estruturados, condicionado a pelo menos 3 fotos distintas.

Essa ordem evita transformar o MVP em um editor complexo antes de validar o fluxo principal.

---

# 1. Feed

## Canvas interno
1080 × 1350 px (4:5).

## Templates
Os seis templates já congelados em `docs/creative-templates-v0.1.md`:

1. Clean Base
2. Clean Topo
3. Comercial
4. Oportunidade
5. Card Informativo
6. Moldura Branding

## Campos editáveis
- headline: até 60 caracteres;
- subheadline: até 80 quando suportada;
- CTA: até 36;
- legenda do Instagram.

## Persistência
`campaign_variants`:
- provider: `instagram`
- format: `feed_4x5`
- template/layout no `render_metadata`

---

# 2. Stories

## Objetivo

Stories não reutiliza o layout do Feed.

A composição deve privilegiar:
- leitura em poucos segundos;
- texto curto;
- foto dominante;
- CTA evidente;
- marca discreta;
- respeito às áreas ocupadas pela interface do Instagram.

## Canvas interno
1080 × 1920 px (9:16).

## Regra interna de área segura

Para reduzir risco de colisão com elementos da interface:
- reservar aproximadamente 220 px no topo;
- reservar aproximadamente 300 px na base;
- CTA e textos críticos devem permanecer dentro da zona central segura.

Esses valores são regras internas de composição e podem ser ajustados quando o renderer real for validado.

## Templates de Stories

### 2.1 Vertical Clean / Story Clean
**Objetivo:** valorizar fotografia forte.

**Estrutura fixa:**
- foto em tela cheia;
- logo/nome profissional pequeno dentro da zona segura superior;
- headline curta no terço inferior;
- subheadline curta;
- CTA discreto acima da zona segura inferior.

**Mostra:**
- logo/nome;
- headline;
- subheadline;
- CTA.

**Não mostra:**
- lista de características;
- preço grande.

**Limites:**
- headline: 46 caracteres;
- subheadline: 64;
- CTA: 28.

### 2.2 Vertical Comercial / Story Comercial
**Objetivo:** leitura rápida de venda/aluguel.

**Estrutura fixa:**
- foto cheia;
- selo Venda/Aluguel;
- headline;
- preço;
- até 3 características;
- CTA.

**Mostra automaticamente:**
- finalidade;
- preço;
- quartos/suítes/área/vagas, limitados a 3;
- marca em tamanho reduzido.

**Limites:**
- headline: 42 caracteres;
- CTA: 28.

### 2.3 Vertical Oportunidade / Story Oportunidade
**Objetivo:** preço ou condição comercial como protagonista.

**Estrutura fixa:**
- foto;
- selo Oportunidade;
- headline muito curta;
- preço dominante;
- até 2 características;
- CTA destacado.

**Limites:**
- headline: 36 caracteres;
- CTA: 24.

**Regra visual:**
não usar excesso de selo, ícones ou múltiplas cores de chamada.

### 2.4 Vertical Branding / Story Branding
**Objetivo:** feed/story com identidade visual consistente.

**Estrutura fixa:**
- foto;
- moldura/faixa usando a cor principal do corretor;
- logo/nome;
- headline;
- subheadline;
- CTA.

**Mostra:**
- marca;
- headline;
- subheadline;
- CTA.

**Preço:**
pode aparecer de forma secundária, nunca como elemento dominante.

**Limites:**
- headline: 44 caracteres;
- subheadline: 60;
- CTA: 28.

## O que o usuário NÃO controla em Stories
- posição dos elementos;
- tamanho de fonte;
- margens;
- moldura;
- alinhamento;
- área segura;
- quantidade de características;
- posição do CTA.

## Persistência de Stories
Usar `campaign_variants` sem nova tabela:

- provider: `instagram`
- format: `story_9x16`
- headline
- caption quando necessário
- cta
- `render_metadata.template_id`
- `render_metadata.subheadline`
- `render_metadata.version`

Não criar tabela específica para Stories.

---

# 3. Carrossel

## Objetivo

Carrossel não será tratado como galeria de fotos.

Cada modelo deve contar uma pequena história de venda com começo, desenvolvimento e CTA final.

## Canvas
Cada slide: 1080 × 1350 px (4:5).

## Quantidade inicial
Somente três modelos no primeiro lançamento.

Não criar oito ou dez modelos antes de dados reais de uso.

## Modelo 3.1 — Apresentação
**Objetivo:** apresentar o imóvel de forma completa.

**6 slides fixos:**

### Slide 1 — Capa
- melhor foto;
- headline;
- preço discreto;
- localização;
- marca.

### Slide 2 — Destaques
- foto diferente da capa quando disponível;
- até 4 diferenciais/atributos;
- texto curto.

### Slide 3 — Ambiente principal
- foto;
- pequena chamada contextual;
- sem bloco pesado de dados.

### Slide 4 — Segundo ambiente
- foto;
- pequena chamada contextual.

### Slide 5 — Localização/diferenciais
- foto externa ou contexto;
- bairro/região;
- até 3 diferenciais relevantes.

### Slide 6 — Conversão
- foto ou fundo de marca;
- logo/nome profissional;
- CTA;
- WhatsApp ou instrução de contato;
- preço opcional discreto.

## Modelo 3.2 — Venda Direta
**Objetivo:** comunicar rapidamente valor e benefício.

**5 slides fixos:**

### Slide 1
- capa;
- headline;
- preço.

### Slide 2
- 3 benefícios principais;
- foto.

### Slide 3
- ambiente forte;
- texto curto.

### Slide 4
- segundo ambiente;
- características resumidas.

### Slide 5
- CTA final;
- marca;
- contato.

**Observação:** campanhas de oportunidade usam este modelo com linguagem visual mais comercial. Não criar um quarto modelo "Oportunidade" no MVP sem necessidade real.

## Modelo 3.3 — Aluguel Prático
**Objetivo:** facilitar decisão de aluguel.

**5 slides fixos:**

### Slide 1
- capa;
- valor do aluguel;
- localização.

### Slide 2
- principais características;
- foto.

### Slide 3
- ambiente;
- texto curto.

### Slide 4
- condições/diferenciais disponíveis no cadastro;
- foto.

### Slide 5
- CTA;
- marca;
- contato.

## Seleção de fotos do carrossel

### Agora, sem IA
Usar ordem determinística:
1. foto de capa;
2. demais fotos pela ordem salva;
3. evitar repetir imagem enquanto houver fotos diferentes.

### Depois, com visão/IA
A IA poderá classificar:
- melhor capa;
- exterior;
- sala;
- cozinha;
- quarto;
- banheiro;
- lazer;
- vista/localização.

A IA escolhe entre fotos reais do imóvel. Nunca cria ou substitui características do imóvel nessa etapa.

## Caso haja poucas fotos
Com menos de 3 fotos distintas, o Carrossel não é gerado no MVP. A interface informa que são necessárias mais fotos.

A decisão é deliberada: não criar um carrossel visualmente fraco apenas para manter paridade de formatos.

Nunca:
- usar foto de outro imóvel;
- usar stock;
- gerar cômodos inexistentes;
- repetir a mesma foto várias vezes sem necessidade.

## Edição pelo usuário

No primeiro carrossel, o usuário pode:
- escolher o modelo narrativo compatível com Venda/Aluguel;
- editar headline principal;
- editar CTA;
- editar legenda do post.

A troca manual de foto por slide fica para uma fase posterior. No MVP a seleção segue a ordem real da galeria.

O usuário não pode:
- criar slide arbitrário;
- mudar posição livre;
- alterar layout slide a slide;
- escolher fontes/tamanhos;
- arrastar elementos.

## Persistência do carrossel

Na primeira versão, NÃO criar `campaign_slides`.

Usar uma única linha em `campaign_variants`:

- provider: `instagram`
- format: `carousel_4x5`
- headline
- caption
- cta
- `render_metadata.carousel_type`
- `render_metadata.version`
- `render_metadata.slides`
- `render_metadata.selected_media`

`slides` guarda somente a estrutura necessária para reproduzir a composição.

Criar uma tabela `campaign_slides` apenas se no futuro houver edição independente, reordenação avançada ou analytics por slide.

---

# 4. Interface da campanha

## Instagram
Mostrar seletor de formato:

- Feed
- Stories
- Carrossel

### Feed
Mostra as 6 artes atuais.

### Stories
Mostra 4 miniaturas próprias 9:16.

### Carrossel
Mostra 3 modelos e uma faixa horizontal com miniaturas dos slides.

## Princípio de UX
Nunca mostrar todas as opções de todos os formatos ao mesmo tempo.

Fluxo:

```
Instagram
  ↓
Formato
  ↓
Template/modelo
  ↓
Conteúdo editável
  ↓
Preview
  ↓
Salvar / Agendar / Publicar
```

---

# 5. Geração de conteúdo

## Feed
Headline, subheadline, CTA e legenda.

## Stories
Texto mais curto do que Feed.

A futura IA deve gerar conteúdo específico para Story, não recortar mecanicamente o texto do Feed.

## Carrossel
A futura IA deve gerar a narrativa por slide usando apenas fatos presentes no imóvel.

O texto precisa ser:
- curto;
- factual;
- sem inventar atributos;
- sem afirmar proximidades ou vantagens não presentes nos dados;
- adaptado à função de cada slide.

---

# 6. Priorização

## MVP atual
Feed 4:5.

## Próxima implementação
Stories 9:16 com 4 templates.

## Depois de Stories estabilizado
Carrossel 4:5 com 3 modelos.

## Fora desta etapa
- Reels/slideshow;
- música;
- stickers interativos;
- editor livre;
- animações complexas;
- template marketplace.

---

# 7. Critério para avançar

Stories só deve ser considerado concluído quando:
- os 4 templates funcionarem;
- a área segura for respeitada;
- salvar e reabrir mantiver o template e textos;
- previews forem consistentes com a futura imagem renderizada.

Carrossel só deve entrar depois disso.

O produto deve ampliar a biblioteca de composições profissionais, não evoluir para um editor estilo Canva.


---

# 8. Família vertical compartilhada

Instagram Stories e TikTok usam a mesma biblioteca estrutural 9:16:

- Vertical Clean
- Vertical Comercial
- Vertical Oportunidade
- Vertical Branding

Na interface, os nomes podem ser adaptados ao canal (por exemplo, Story Clean ou TikTok Clean).

A renderização final não é idêntica:
- Instagram Stories usa safe zones próprias;
- TikTok reserva também a coluna de ações à direita e uma área inferior maior;
- TikTok poderá evoluir para vídeo/slideshow mantendo a mesma família visual.

Os IDs internos usam `vertical-*`, evitando duplicação de templates.
