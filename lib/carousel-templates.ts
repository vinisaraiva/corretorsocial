export const carouselModels = [
  {
    id: "presentation",
    name: "Apresentação",
    description: "Apresenta o imóvel com contexto, ambientes e fechamento.",
    slideCount: 6,
    purposes: ["Venda", "Aluguel"] as const,
  },
  {
    id: "direct-sale",
    name: "Venda Direta",
    description: "Mais comercial, com benefícios e preço logo no início.",
    slideCount: 5,
    purposes: ["Venda"] as const,
  },
  {
    id: "rent-practical",
    name: "Aluguel Prático",
    description: "Valor, características e decisão rápida para locação.",
    slideCount: 5,
    purposes: ["Aluguel"] as const,
  },
] as const;

export type CarouselModelId = (typeof carouselModels)[number]["id"];

export function normalizeCarouselModel(
  value?: string | null,
  purpose: "Venda" | "Aluguel" = "Venda",
): CarouselModelId {
  const found = carouselModels.find((model) => model.id === value);

  if (found && (found.purposes as readonly string[]).includes(purpose)) {
    return found.id;
  }

  return purpose === "Aluguel" ? "rent-practical" : "presentation";
}

export function getCarouselModel(id: CarouselModelId) {
  return carouselModels.find((model) => model.id === id)!;
}

export function getAvailableCarouselModels(purpose: "Venda" | "Aluguel") {
  return carouselModels.filter((model) =>
    (model.purposes as readonly string[]).includes(purpose),
  );
}

export function defaultCarouselModel(
  purpose: "Venda" | "Aluguel",
): CarouselModelId {
  return purpose === "Aluguel" ? "rent-practical" : "presentation";
}


export const carouselFinalCardDecorations = [
  "curves",
  "lines",
  "frame",
  "blocks",
] as const;

export type CarouselFinalCardDecoration =
  (typeof carouselFinalCardDecorations)[number];

function mixedHash(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x7feb352d);
  hash ^= hash >>> 15;
  hash = Math.imul(hash, 0x846ca68b);
  hash ^= hash >>> 16;

  return hash >>> 0;
}

export function carouselFinalCardDecorationFromSeed(
  seed: string,
  offset = 0,
): CarouselFinalCardDecoration {
  const index =
    (mixedHash(seed) + Math.abs(offset)) %
    carouselFinalCardDecorations.length;

  return carouselFinalCardDecorations[index];
}

export const carouselFinalCardThemes = [
  "brand",
  "dark",
  "light",
] as const;

export type CarouselFinalCardTheme =
  (typeof carouselFinalCardThemes)[number];

export function normalizeCarouselFinalCardDecoration(
  value?: string | null,
): CarouselFinalCardDecoration {
  return carouselFinalCardDecorations.includes(
    value as CarouselFinalCardDecoration,
  )
    ? (value as CarouselFinalCardDecoration)
    : "curves";
}

export function normalizeCarouselFinalCardTheme(
  value?: string | null,
): CarouselFinalCardTheme {
  return carouselFinalCardThemes.includes(value as CarouselFinalCardTheme)
    ? (value as CarouselFinalCardTheme)
    : "brand";
}
