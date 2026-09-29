import test from "node:test";
import assert from "node:assert/strict";
import {
  carouselFinalCardCtaFromSeed,
  carouselFinalCardDecorationFromSeed,
  carouselFinalCardDecorations,
} from "../lib/carousel-templates";

test("grafismo do card final é estável para a mesma campanha", () => {
  const seed = "campaign-123:presentation";

  assert.equal(
    carouselFinalCardDecorationFromSeed(seed),
    carouselFinalCardDecorationFromSeed(seed),
  );
});

test("offset de estilo percorre as quatro famílias de grafismo", () => {
  const seed = "campaign-123:presentation";
  const variants = new Set(
    [0, 1, 2, 3].map((offset) =>
      carouselFinalCardDecorationFromSeed(seed, offset),
    ),
  );

  assert.equal(variants.size, carouselFinalCardDecorations.length);
  assert.deepEqual(
    new Set(carouselFinalCardDecorations),
    variants,
  );
});


test("texto do card final varia entre os seis estilos de venda", () => {
  const seed = "campaign-123:presentation:cta";
  const variants = new Set(
    [0, 1, 2, 3, 4, 5].map((offset) =>
      carouselFinalCardCtaFromSeed("Venda", seed, offset),
    ),
  );

  assert.equal(variants.size, 6);
});

test("texto do card final permanece estável para a mesma campanha e estilo", () => {
  const seed = "campaign-abc:presentation:cta";

  assert.equal(
    carouselFinalCardCtaFromSeed("Aluguel", seed, 3),
    carouselFinalCardCtaFromSeed("Aluguel", seed, 3),
  );
});
