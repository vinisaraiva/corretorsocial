export const verticalTemplates = [
  {
    id: "vertical-clean",
    storyName: "Story Editorial",
    tiktokName: "TikTok Editorial",
    description: "Foto dominante, tipografia forte e composição editorial limpa.",
    supportsSubheadline: true,
    headlineLimit: 46,
    subheadlineLimit: 64,
    ctaLimit: 28,
    supportsBlockPosition: true,
  },
  {
    id: "vertical-commercial",
    storyName: "Story Geométrico",
    tiktokName: "TikTok Geométrico",
    description: "Blocos geométricos, preço e características em leitura comercial rápida.",
    supportsSubheadline: false,
    headlineLimit: 42,
    subheadlineLimit: 0,
    ctaLimit: 28,
    supportsBlockPosition: true,
  },
  {
    id: "vertical-opportunity",
    storyName: "Story Oportunidade",
    tiktokName: "TikTok Oportunidade",
    description: "Preço dominante com comunicação comercial direta.",
    supportsSubheadline: false,
    headlineLimit: 36,
    subheadlineLimit: 0,
    ctaLimit: 24,
    supportsBlockPosition: false,
  },
  {
    id: "vertical-branding",
    storyName: "Story Dark Premium",
    tiktokName: "TikTok Dark Premium",
    description: "Tratamento escuro premium, logo discreto e CTA de alto contraste.",
    supportsSubheadline: true,
    headlineLimit: 44,
    subheadlineLimit: 60,
    ctaLimit: 28,
    supportsBlockPosition: true,
  },
  {
    id: "vertical-photo-grid",
    storyName: "Story Photo Grid",
    tiktokName: "TikTok Photo Grid",
    description: "Foto principal dominante com duas imagens de apoio e informações enxutas.",
    supportsSubheadline: true,
    headlineLimit: 44,
    subheadlineLimit: 56,
    ctaLimit: 28,
    supportsBlockPosition: false,
  },
  {
    id: "vertical-editorial",
    storyName: "Story Property Editorial",
    tiktokName: "TikTok Property Editorial",
    description: "Composição clara, tipografia editorial e CTA comercial discreto.",
    supportsSubheadline: true,
    headlineLimit: 48,
    subheadlineLimit: 64,
    ctaLimit: 28,
    supportsBlockPosition: true,
  },
  {
    id: "vertical-minimal",
    storyName: "Story Minimal Contemporary",
    tiktokName: "TikTok Minimal Contemporary",
    description: "Fotografia dominante, assinatura linear e poucos elementos de alto contraste.",
    supportsSubheadline: true,
    headlineLimit: 46,
    subheadlineLimit: 60,
    ctaLimit: 28,
    supportsBlockPosition: true,
  },
] as const;

export type VerticalTemplateId = (typeof verticalTemplates)[number]["id"];
export type VerticalPlatform = "instagram_story" | "tiktok";

const legacyMap: Record<string, VerticalTemplateId> = {
  "story-clean": "vertical-clean",
  "story-commercial": "vertical-commercial",
  "story-opportunity": "vertical-opportunity",
  "story-branding": "vertical-branding",
};

export function normalizeVerticalTemplate(
  value?: string | null,
): VerticalTemplateId {
  if (!value) return "vertical-clean";

  const direct = verticalTemplates.find((template) => template.id === value);
  if (direct) return direct.id;

  return legacyMap[value] ?? "vertical-clean";
}

export function getVerticalTemplate(id: VerticalTemplateId) {
  return verticalTemplates.find((template) => template.id === id)!;
}

export function getVerticalTemplateName(
  id: VerticalTemplateId,
  platform: VerticalPlatform,
) {
  const template = getVerticalTemplate(id);

  return platform === "instagram_story"
    ? template.storyName
    : template.tiktokName;
}

export const verticalSafeZones: Record<
  VerticalPlatform,
  {
    topPercent: number;
    bottomPercent: number;
    rightPercent: number;
    label: string;
  }
> = {
  instagram_story: {
    topPercent: 11,
    bottomPercent: 15,
    rightPercent: 0,
    label: "Instagram Stories",
  },
  tiktok: {
    topPercent: 8,
    bottomPercent: 20,
    rightPercent: 18,
    label: "TikTok",
  },
};
