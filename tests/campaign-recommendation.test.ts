import test from "node:test";
import assert from "node:assert/strict";
import {
  recommendCampaignStyle,
} from "../lib/campaign-recommendation";
import type { Property } from "../types";

function propertyFixture(
  overrides: Partial<Property> = {},
): Property {
  return {
    id: "property-1",
    title: "Apartamento em Buraquinho",
    purpose: "Venda",
    price: 450000,
    location: "Buraquinho",
    city: "Lauro de Freitas",
    bedrooms: 2,
    suites: 1,
    bathrooms: 2,
    parking: 1,
    area: 78,
    description: "Apartamento bem localizado.",
    highlights: [],
    image: "https://example.com/cover.jpg",
    images: ["https://example.com/cover.jpg"],
    media: [],
    status: "ativo",
    campaigns: 0,
    ...overrides,
  };
}

test("recomenda Geometric Direct quando o cadastro enfatiza oportunidade", () => {
  const result = recommendCampaignStyle(
    propertyFixture({
      highlights: ["Oportunidade abaixo do valor"],
    }),
  );

  assert.equal(result.style, "geometric-direct");
});

test("recomenda Dark Premium quando o cadastro sinaliza alto padrão", () => {
  const result = recommendCampaignStyle(
    propertyFixture({
      description: "Cobertura de alto padrão com vista para o mar.",
    }),
  );

  assert.equal(result.style, "dark-premium");
});

test("recomenda Minimal Contemporary para aluguel sem sinal premium/comercial", () => {
  const result = recommendCampaignStyle(
    propertyFixture({
      purpose: "Aluguel",
    }),
  );

  assert.equal(result.style, "minimal-contemporary");
});

test("recomenda Photo Grid quando há quatro ou mais imagens", () => {
  const result = recommendCampaignStyle(
    propertyFixture({
      images: [
        "https://example.com/1.jpg",
        "https://example.com/2.jpg",
        "https://example.com/3.jpg",
        "https://example.com/4.jpg",
      ],
    }),
  );

  assert.equal(result.style, "photo-grid");
});

test("recomenda Property Editorial com múltiplas fotos e diferenciais", () => {
  const result = recommendCampaignStyle(
    propertyFixture({
      images: [
        "https://example.com/1.jpg",
        "https://example.com/2.jpg",
      ],
      highlights: ["Perto da praia", "Varanda ampla"],
    }),
  );

  assert.equal(result.style, "property-editorial");
});

test("mantém Editorial Clean como recomendação universal de fallback", () => {
  const result = recommendCampaignStyle(propertyFixture());

  assert.equal(result.style, "editorial-clean");
});
