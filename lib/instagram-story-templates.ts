export const instagramStoryTemplates = [
  {
    id: "story-clean",
    name: "Story Clean",
    description: "Foto dominante, marca discreta e chamada curta.",
    supportsSubheadline: true,
    headlineLimit: 46,
    subheadlineLimit: 64,
    ctaLimit: 28,
  },
  {
    id: "story-commercial",
    name: "Story Comercial",
    description: "Preço, finalidade e características em leitura rápida.",
    supportsSubheadline: false,
    headlineLimit: 42,
    subheadlineLimit: 0,
    ctaLimit: 28,
  },
  {
    id: "story-opportunity",
    name: "Story Oportunidade",
    description: "Preço dominante com comunicação comercial direta.",
    supportsSubheadline: false,
    headlineLimit: 36,
    subheadlineLimit: 0,
    ctaLimit: 24,
  },
  {
    id: "story-branding",
    name: "Story Branding",
    description: "Moldura de marca, logo e CTA bem visível.",
    supportsSubheadline: true,
    headlineLimit: 44,
    subheadlineLimit: 60,
    ctaLimit: 28,
  },
] as const;

export type InstagramStoryTemplateId =
  (typeof instagramStoryTemplates)[number]["id"];

export function normalizeInstagramStoryTemplate(
  value?: string | null,
): InstagramStoryTemplateId {
  const found = instagramStoryTemplates.find(
    (template) => template.id === value,
  );

  return found?.id ?? "story-clean";
}

export function getInstagramStoryTemplate(id: InstagramStoryTemplateId) {
  return instagramStoryTemplates.find((template) => template.id === id)!;
}
