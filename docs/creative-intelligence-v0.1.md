# Creative Intelligence v0.1 — Corretor Social

## Objetivo

Transformar o cadastro de um imóvel em uma campanha inicial pronta sem exigir montagem manual.

A primeira versão é determinística e usa somente dados reais do imóvel. A arquitetura permite substituir partes por modelos de IA posteriormente sem alterar a experiência principal.

## Templates de Feed

A biblioteca do MVP permanece congelada em seis estilos:

1. Clean Base — padrão;
2. Clean Topo;
3. Comercial;
4. Oportunidade;
5. Card Informativo;
6. Moldura Branding.

Não adicionar novos estilos apenas para aumentar catálogo.

Novos estilos só entram quando houver:
- necessidade visual não coberta pelos seis atuais;
- demanda recorrente observada em usuários;
- ou um segmento claro que exija linguagem própria.

Candidatos futuros, não aprovados:
- Editorial/Luxo;
- Lançamento/Empreendimento.

## Recomendação inicial

Para uma campanha nova, o sistema define automaticamente:

- estilo: Clean Base;
- headline;
- subheadline;
- CTA;
- legenda específica por rede;
- versão vertical para Story;
- versão vertical para TikTok;
- modelo de Carrossel conforme Venda/Aluguel;
- ordenação inicial de mídia.

Campanhas já salvas nunca são sobrescritas pela recomendação automática.

## Conteúdo

A recomendação só usa:
- título;
- descrição;
- diferenciais;
- localização;
- preço;
- quartos;
- suítes;
- área;
- vagas;
- finalidade;
- fotos reais cadastradas.

Não inferir:
- proximidade de pontos de interesse;
- vista;
- segurança;
- valorização;
- urgência;
- desconto;
- oportunidade;
- características que não estão cadastradas.

## Cópia por canal

Instagram, Facebook, TikTok e Google recebem textos próprios.

Não copiar literalmente uma única legenda para todas as redes.

## Fotos — estágio atual

Sem visão computacional:
- respeitar foto de capa;
- manter ordem cadastrada;
- remover duplicatas;
- Carrossel exige pelo menos 3 fotos distintas.

## Próximo estágio — visão

Quando a integração de IA estiver ativa, analisar fotos para:
- qualidade técnica;
- orientação;
- foco principal;
- área livre para texto;
- possível categoria do ambiente;
- melhor foto de capa;
- safe crop por formato.

A visão deve classificar e selecionar fotos reais, nunca reconstruir o imóvel.

## Arquitetura

A UI consome uma recomendação central.

Implementação atual: `lib/campaign-recommendation.ts`

A interface não deve conter regras de recomendação duplicadas.

## Critério para IA

Não conectar um modelo caro apenas para reescrever textos que regras determinísticas já resolvem.

Usar IA onde o ganho é material:
1. análise visual e seleção de imagens;
2. geração de copy contextual;
3. classificação de ambientes;
4. safe crop;
5. futuramente staging e vídeo.

O resultado precisa continuar editável e baseado em fatos do imóvel.

## Seleção de mídia determinística

Implementação atual:
- `lib/media-intelligence.ts`;
- upload local grava `width` e `height`;
- ranking considera capa, ordem, resolução, proporção do formato e `ai_score` quando existir;
- `ai_tags` podem aumentar diversidade do Carrossel quando estiverem preenchidas.

O ranking é conservador. Sem metadados suficientes, mantém a preferência pela capa e pela ordem cadastrada.

Fotos importadas apenas por URL podem não possuir dimensões nesta fase. Não atribuir qualidade presumida nesses casos.

## Reprodutibilidade da campanha

Ao salvar a campanha, cada variante persiste os IDs das mídias escolhidas em `render_metadata.media_ids`.

Não persistir URLs assinadas de Storage, pois expiram.

Ao reabrir:
1. resolver os IDs contra a galeria atual do imóvel;
2. gerar URLs assinadas atuais para exibição;
3. usar recomendação nova somente se a mídia salva deixou de existir.

Isso impede que uma campanha agendada mude silenciosamente apenas porque a galeria do imóvel foi reordenada.

## UX de geração

Não simular análise de IA com atraso artificial.

Enquanto a recomendação for determinística, abrir a campanha assim que o imóvel e suas fotos forem persistidos.

Quando houver visão real/worker, mostrar progresso somente para jobs efetivamente executados.


## Execução da análise visual

Estratégia do MVP:

1. `jobs` continua sendo a fila persistente e observável;
2. a aplicação cria um job `media_analysis`;
3. a Supabase Edge Function `media-analysis` tenta assumir o job por ID de forma atômica;
4. a função responde rápido e processa a análise em `EdgeRuntime.waitUntil()`;
5. o frontend acompanha o status em `jobs`;
6. se o job permanecer `queued` ou `retrying`, a interface pode disparar novamente a função;
7. o claim atômico impede processamento concorrente do mesmo job.

A Edge Function é a estratégia inicial para evitar custo fixo de infraestrutura no MVP.

O diretório `worker/` permanece como fallback de escala para:
- processamento que exceda os limites de duração/CPU da Edge Function;
- renderização pesada;
- vídeo/FFmpeg;
- publicação em lote;
- volume sustentado que justifique processo residente.

Não remover o worker apenas porque a primeira fase usa Edge Functions.

### Feature flag

`MEDIA_ANALYSIS_ENABLED=false` por padrão.

Só ativar quando:
- a Edge Function estiver deployed;
- `OPENAI_API_KEY` estiver configurada nos secrets das Edge Functions;
- pelo menos um teste de análise real tiver sido concluído com sucesso.

### Modelo inicial

Default: `gpt-5.6-luna`.

Motivo:
- aceita imagem;
- suporta Responses API;
- suporta Structured Outputs;
- é adequado a workloads sensíveis a custo.

Manter `OPENAI_VISION_MODEL` configurável para A/B com modelos superiores caso a qualidade visual seja insuficiente.
