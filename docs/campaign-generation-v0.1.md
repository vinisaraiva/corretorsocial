# Campaign Generation v0.1 — Corretor Social

## Princípio

O corretor não monta campanhas rede por rede.

Depois de confirmar os dados do imóvel, o Corretor Social cria automaticamente uma campanha-base e as variantes recomendadas para os canais suportados.

Fluxo:

```
Link / fotos / manual
  ↓
Extração e cadastro
  ↓
Revisão obrigatória do imóvel
  ↓
Salvar e criar campanha
  ↓
Geração automática das variantes
  ↓
Instagram / Facebook / TikTok / Google
  ↓
Usuário revisa ou ajusta apenas se quiser
```

## Momento da geração

Não gerar peças finais no instante em que o link é colado ou as fotos são enviadas.

Primeiro:
1. extrair ou receber os dados;
2. mostrar a revisão;
3. o usuário confirmar o imóvel;
4. somente então preparar a campanha.

Motivo:
- evita gerar peças sobre preço/localização errados;
- evita custo de IA/renderização desnecessário;
- mantém o fluxo simples.

## O que é criado automaticamente

Para cada campanha, o sistema prepara uma configuração inicial para:

### Instagram
- Feed 4:5;
- Story 9:16;
- Carrossel 4:5 quando essa fase estiver disponível.

### Facebook
- Feed/post recomendado.

### TikTok
- Vertical 9:16;
- inicialmente pode compartilhar a família visual vertical;
- posteriormente evolui para slideshow/vídeo.

### Google Business
- Post adequado ao canal.

## O usuário precisa editar?

Não.

O sistema entrega uma recomendação pronta por padrão.

O usuário pode:
- trocar o estilo global da campanha;
- editar headline/subheadline/CTA;
- alterar legenda;
- mover o bloco completo para Automática/Esquerda/Direita quando o template e a plataforma permitirem;
- substituir uma foto específica quando o formato permitir;
- desativar um canal antes de publicar.

O estilo global propaga para os formatos equivalentes. A posição do bloco é específica de cada mídia e nunca é propagada globalmente.

A edição é opcional.

## Fotos

Todas as variantes partem do mesmo conjunto de fotos reais do imóvel.

### Regra inicial determinística
- capa: primeira foto marcada como capa;
- demais fotos: ordem salva;
- formatos com uma foto usam a capa;
- carrossel usa capa + fotos seguintes sem repetição desnecessária;
- vertical 9:16 aplica crop/composição própria.

### Evolução com IA
A futura visão computacional poderá:
- escolher melhor capa;
- identificar exterior/sala/cozinha/quarto/lazer;
- escolher ordem por formato;
- encontrar safe crop.

Nunca:
- inventar cômodo;
- usar foto de outro imóvel;
- alterar atributos físicos sem rotulação explícita de ambientação virtual.

## Conteúdo textual

O mesmo fato do imóvel pode gerar textos diferentes por rede.

Não reutilizar mecanicamente uma única legenda.

Exemplo:
- Instagram Feed: texto editorial/comercial;
- Story: headline e CTA curtos;
- TikTok: gancho curto e linguagem de vídeo;
- Google Business: descrição objetiva.

## Performance e custo

"Geração automática para todas as redes" não significa executar operações caras imediatamente para tudo.

Separar:

### Configuração/rascunho
Criar imediatamente após confirmação do imóvel.

Inclui:
- templates recomendados;
- textos determinísticos/IA;
- seleção de mídia;
- metadados.

### Renderização pesada
Executar sob demanda ou em fila:
- imagem final em alta resolução;
- slideshow/vídeo;
- ambientação virtual;
- outros recursos pagos.

Isso mantém a UX automática sem desperdiçar processamento.

## Persistência

Uma campanha principal em `campaigns`.

Cada saída de rede/formato em `campaign_variants`.

Exemplos:

```
campaign
├── instagram / feed_4x5
├── instagram / story_9x16
├── instagram / carousel_4x5
├── facebook / feed
├── tiktok / vertical_video
└── google_business / post
```

Nem todo formato precisa existir no MVP. A estrutura permite adicioná-los progressivamente.

## Regra de UX

A interface deve transmitir:

> "Sua campanha já está pronta. Revise se quiser."

e não:

> "Agora monte quatro campanhas diferentes."
