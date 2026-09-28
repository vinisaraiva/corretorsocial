export const DEFAULT_CAMPAIGN_TEMPLATE_ID = "editorial-clean" as const;

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
  },
  {
    id: "geometric-direct",
    name: "Geometric Direct",
    description: "Blocos geométricos, contraste alto e leitura comercial rápida.",
    useCase: "Venda direta, oportunidade e anúncios com apelo comercial.",
    supportsSubheadline: false,
    showsLogo: true,
    showsPrice: true,
    showsFeatures: true,
    showsCtaOnArt: false,
    supportsBlockPosition: false,
  },
  {
    id: "dark-premium",
    name: "Dark Premium",
    description: "Tratamento escuro editorial com poucos elementos e alto contraste.",
    useCase: "Imóveis premium, lançamentos e posicionamento mais sofisticado.",
    supportsSubheadline: true,
    showsLogo: true,
    showsPrice: true,
    showsFeatures: false,
    showsCtaOnArt: false,
    supportsBlockPosition: true,
  },
  {
    id: "photo-grid",
    name: "Photo Grid",
    description: "Composição fotográfica em grade com informações enxutas.",
    useCase: "Imóveis com várias fotos fortes e ambientes variados.",
    supportsSubheadline: true,
    showsLogo: true,
    showsPrice: true,
    showsFeatures: true,
    showsCtaOnArt: false,
    supportsBlockPosition: false,
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
