export const campaignTemplates = [
  {
    id: "clean-base",
    name: "Clean Base",
    description: "Foto protagonista com chamada curta na base.",
    useCase: "Imóveis com boa fotografia e comunicação mais elegante.",
    supportsSubheadline: false,
    showsLogo: false,
    showsPrice: true,
    showsFeatures: false,
    showsCtaOnArt: false,
  },
  {
    id: "clean-top",
    name: "Clean Topo",
    description: "Logo, headline e apoio no topo da imagem.",
    useCase: "Quando a parte superior da foto tem espaço visual disponível.",
    supportsSubheadline: true,
    showsLogo: true,
    showsPrice: true,
    showsFeatures: false,
    showsCtaOnArt: false,
  },
  {
    id: "commercial",
    name: "Comercial",
    description: "Preço e características com leitura rápida.",
    useCase: "Venda e aluguel com apelo racional.",
    supportsSubheadline: false,
    showsLogo: false,
    showsPrice: true,
    showsFeatures: true,
    showsCtaOnArt: false,
  },
  {
    id: "opportunity",
    name: "Oportunidade",
    description: "Preço dominante e mensagem comercial direta.",
    useCase: "Preço competitivo, condição especial ou giro rápido.",
    supportsSubheadline: false,
    showsLogo: false,
    showsPrice: true,
    showsFeatures: true,
    showsCtaOnArt: false,
  },
  {
    id: "info-card",
    name: "Card Informativo",
    description: "Foto com bloco organizado de informações.",
    useCase: "Quando o imóvel precisa explicar mais sem poluir a fotografia.",
    supportsSubheadline: true,
    showsLogo: true,
    showsPrice: true,
    showsFeatures: true,
    showsCtaOnArt: true,
  },
  {
    id: "brand-frame",
    name: "Moldura Branding",
    description: "Moldura e assinatura visual usando a cor do corretor.",
    useCase: "Feed padronizado e fortalecimento de marca pessoal.",
    supportsSubheadline: true,
    showsLogo: true,
    showsPrice: true,
    showsFeatures: false,
    showsCtaOnArt: true,
  },
] as const;

export type CampaignTemplateId = (typeof campaignTemplates)[number]["id"];

const legacyTemplateMap: Record<string, CampaignTemplateId> = {
  Essencial: "clean-base",
  Destaque: "clean-base",
  Oportunidade: "opportunity",
  "Alto padrão": "clean-top",
};

export function normalizeCampaignTemplate(
  value?: string | null,
): CampaignTemplateId {
  if (!value) return "clean-base";

  const direct = campaignTemplates.find((template) => template.id === value);
  if (direct) return direct.id;

  return legacyTemplateMap[value] ?? "clean-base";
}

export function getCampaignTemplate(id: CampaignTemplateId) {
  return campaignTemplates.find((template) => template.id === id)!;
}
