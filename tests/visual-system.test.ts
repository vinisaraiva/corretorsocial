import test from "node:test";
import assert from "node:assert/strict";
import {
  campaignTemplates,
  VISUAL_SYSTEM_STATUS,
  VISUAL_SYSTEM_VERSION,
} from "../lib/campaign-templates";
import {
  assertRenderAspectRatio,
  assertRenderedCanvasDimensions,
} from "../lib/render-validation";

test("sistema visual v1 está congelado com seis estilos oficiais", () => {
  assert.equal(VISUAL_SYSTEM_VERSION, "1.0.0");
  assert.equal(VISUAL_SYSTEM_STATUS, "frozen");
  assert.deepEqual(
    campaignTemplates.map((template) => template.id),
    [
      "editorial-clean",
      "geometric-direct",
      "dark-premium",
      "photo-grid",
      "property-editorial",
      "minimal-contemporary",
    ],
  );
});

test("aceita proporção 4:5 para feed", () => {
  assert.doesNotThrow(() =>
    assertRenderAspectRatio({
      sourceWidth: 430,
      sourceHeight: 537.5,
      targetWidth: 1080,
      targetHeight: 1350,
    }),
  );
});

test("aceita proporção 9:16 para story", () => {
  assert.doesNotThrow(() =>
    assertRenderAspectRatio({
      sourceWidth: 330,
      sourceHeight: 586.6666667,
      targetWidth: 1080,
      targetHeight: 1920,
    }),
  );
});

test("rejeita proporção incorreta antes da exportação", () => {
  assert.throws(
    () =>
      assertRenderAspectRatio({
        sourceWidth: 430,
        sourceHeight: 430,
        targetWidth: 1080,
        targetHeight: 1350,
      }),
    /proporção/,
  );
});

test("exige dimensões finais exatas do JPEG", () => {
  assert.doesNotThrow(() =>
    assertRenderedCanvasDimensions({
      width: 1080,
      height: 1350,
      targetWidth: 1080,
      targetHeight: 1350,
    }),
  );

  assert.throws(
    () =>
      assertRenderedCanvasDimensions({
        width: 1079,
        height: 1350,
        targetWidth: 1080,
        targetHeight: 1350,
      }),
    /1080×1350/,
  );
});
