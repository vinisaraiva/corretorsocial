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
