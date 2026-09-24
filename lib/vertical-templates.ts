export const verticalTemplates = [
  {
    id: "vertical-clean",
    storyName: "Story Clean",
    tiktokName: "TikTok Clean",
    description: "Foto dominante, marca discreta e chamada curta.",
    supportsSubheadline: true,
    headlineLimit: 46,
    subheadlineLimit: 64,
    ctaLimit: 28,
  },
  {
    id: "vertical-commercial",
    storyName: "Story Comercial",
    tiktokName: "TikTok Comercial",
    description: "Preço, finalidade e características em leitura rápida.",
    supportsSubheadline: false,
    headlineLimit: 42,
    subheadlineLimit: 0,
    ctaLimit: 28,
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
  },
  {
    id: "vertical-branding",
    storyName: "Story Branding",
    tiktokName: "TikTok Branding",
    description: "Moldura de marca, logo e CTA bem visível.",
    supportsSubheadline: true,
    headlineLimit: 44,
    subheadlineLimit: 60,
    ctaLimit: 28,
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
