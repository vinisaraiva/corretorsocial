import test from "node:test";
import assert from "node:assert/strict";
import {
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
