export const DEFAULT_CAMPAIGN_TEMPLATE_ID = "editorial-clean" as const;

export type SecondaryPhotoUsage =
  | "frequent"
  | "optional"
  | "selective"
  | "signature"
  | "rare";

export type VisualEmphasis = "discreet" | "medium" | "strong" | "editorial";
export type OrnamentationLevel = "minimal" | "restrained" | "rich";

export const campaignTemplates = [
  {
    id: "editorial-clean",
    name: "Editorial Clean",
    description: "Foto protagonista, tipografia forte e informação mínima.",
    useCase: "Padrão elegante para imóveis com boa fotografia.",
    supportsSubheadline: true,
    showsLogo: true,
    showsPrice: true,
    showsFeatures: false,
    showsCtaOnArt: false,
    supportsBlockPosition: true,
    secondaryPhotoUsage: "optional",
    priceEmphasis: "medium",
    ctaEmphasis: "discreet",
    ornamentationLevel: "restrained",
    idealFeatureCount: 3,
    photoGuidance: "Uma foto hero deve dominar a peça; foto secundária entra apenas quando agrega.",
    recommendedFor: "Uso geral, boas fotografias e comunicação elegante sem excesso.",
  },
  {
    id: "geometric-direct",
    name: "Geometric Direct",
    description: "Geometria controlada, contraste alto e leitura comercial rápida.",
    useCase: "Venda direta, oportunidade e anúncios com apelo comercial.",
    supportsSubheadline: false,
    showsLogo: true,
    showsPrice: true,
    showsFeatures: true,
    showsCtaOnArt: false,
    supportsBlockPosition: false,
    secondaryPhotoUsage: "selective",
    priceEmphasis: "strong",
    ctaEmphasis: "strong",
    ornamentationLevel: "rich",
    idealFeatureCount: 3,
    photoGuidance: "Shapes e blocos nunca podem competir com a fotografia principal.",
    recommendedFor: "Oportunidades, venda direta e imóveis com mensagem comercial forte.",
  },
  {
    id: "dark-premium",
    name: "Dark Premium",
    description: "Tratamento escuro editorial, detalhes finos e alto valor percebido.",
    useCase: "Imóveis premium, lançamentos e posicionamento mais sofisticado.",
    supportsSubheadline: true,
    showsLogo: true,
    showsPrice: true,
    showsFeatures: false,
    showsCtaOnArt: false,
    supportsBlockPosition: true,
    secondaryPhotoUsage: "selective",
    priceEmphasis: "medium",
    ctaEmphasis: "discreet",
    ornamentationLevel: "rich",
    idealFeatureCount: 3,
    photoGuidance: "Foto secundária só entra quando sustenta a linguagem premium e não quebra a imponência da hero.",
    recommendedFor: "Alto padrão, coberturas, vista privilegiada e fotografias de maior qualidade.",
  },
  {
    id: "photo-grid",
    name: "Photo Grid",
    description: "Narrativa fotográfica com uma imagem hero e ambientes secundários.",
    useCase: "Imóveis com várias fotos fortes e ambientes variados.",
    supportsSubheadline: true,
    showsLogo: true,
    showsPrice: true,
    showsFeatures: true,
    showsCtaOnArt: false,
    supportsBlockPosition: false,
    secondaryPhotoUsage: "signature",
    priceEmphasis: "medium",
    ctaEmphasis: "discreet",
    ornamentationLevel: "restrained",
    idealFeatureCount: 2,
    photoGuidance: "Uma foto deve ser claramente dominante; as demais são apoio narrativo.",
    recommendedFor: "Imóveis com 3 ou mais boas fotos de ambientes diferentes.",
  },
  {
    id: "property-editorial",
    name: "Property Editorial",
    description: "Foto, localização e dados tratados como uma página editorial.",
    useCase: "Apresentação equilibrada entre imagem, preço e diferenciais.",
    supportsSubheadline: true,
    showsLogo: true,
    showsPrice: true,
    showsFeatures: true,
    showsCtaOnArt: true,
    supportsBlockPosition: true,
    secondaryPhotoUsage: "frequent",
    priceEmphasis: "editorial",
    ctaEmphasis: "medium",
    ornamentationLevel: "rich",
    idealFeatureCount: 4,
    photoGuidance: "Foto secundária é bem-vinda como recurso editorial, sem roubar protagonismo da hero.",
    recommendedFor: "Branding imobiliário sofisticado, imóveis elegantes e apresentações completas.",
  },
  {
    id: "minimal-contemporary",
    name: "Minimal Contemporary",
    description: "Poucos elementos, assinatura linear e máxima valorização da fotografia.",
    useCase: "Uso recorrente, locação e imóveis que pedem comunicação limpa e contemporânea.",
    supportsSubheadline: true,
    showsLogo: true,
    showsPrice: true,
    showsFeatures: true,
    showsCtaOnArt: true,
    supportsBlockPosition: true,
    secondaryPhotoUsage: "rare",
    priceEmphasis: "medium",
    ctaEmphasis: "discreet",
    ornamentationLevel: "minimal",
    idealFeatureCount: 2,
    photoGuidance: "A hero deve respirar; foto secundária é exceção, não regra.",
    recommendedFor: "Locação, uso recorrente e imóveis de médio padrão com comunicação limpa.",
  },
] as const;

export type CampaignTemplateId = (typeof campaignTemplates)[number]["id"];

const legacyTemplateMap: Record<string, CampaignTemplateId> = {
  Essencial: "editorial-clean",
  Destaque: "editorial-clean",
  Oportunidade: "geometric-direct",
  "Alto padrão": "dark-premium",
  "clean-base": "editorial-clean",
  "clean-top": "editorial-clean",
  commercial: "geometric-direct",
  opportunity: "geometric-direct",
  "info-card": "property-editorial",
  "brand-frame": "dark-premium",
  Minimalista: "minimal-contemporary",
};

export function normalizeCampaignTemplate(
  value?: string | null,
): CampaignTemplateId {
  if (!value) return DEFAULT_CAMPAIGN_TEMPLATE_ID;

  const direct = campaignTemplates.find((template) => template.id === value);
  if (direct) return direct.id;

  return legacyTemplateMap[value] ?? DEFAULT_CAMPAIGN_TEMPLATE_ID;
}

export function getCampaignTemplate(id: CampaignTemplateId) {
  return campaignTemplates.find((template) => template.id === id)!;
}

export function secondaryPhotoLabel(value: SecondaryPhotoUsage) {
  switch (value) {
    case "frequent":
      return "Foto extra frequente";
    case "optional":
      return "Foto extra opcional";
    case "selective":
      return "Foto extra seletiva";
    case "signature":
      return "Múltiplas fotos";
    case "rare":
      return "Foto extra rara";
  }
}

export function emphasisLabel(value: VisualEmphasis) {
  switch (value) {
    case "discreet":
      return "Discreto";
    case "medium":
      return "Moderado";
    case "strong":
      return "Forte";
    case "editorial":
      return "Editorial";
  }
}

export function ornamentationLabel(value: OrnamentationLevel) {
  switch (value) {
    case "minimal":
      return "Ornamentos mínimos";
    case "restrained":
      return "Ornamentos controlados";
    case "rich":
      return "Acabamento rico";
  }
}
