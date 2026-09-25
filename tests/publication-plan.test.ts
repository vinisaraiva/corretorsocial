import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSocialPublishJobPayload,
  normalizePublishProviders,
  supportedPublishProviders,
} from "../lib/publication-plan";

test("normalizePublishProviders remove duplicatas e valores inválidos", () => {
  assert.deepEqual(
    normalizePublishProviders([
      "instagram",
      "facebook",
      "instagram",
      "invalid",
      null,
    ]),
    ["instagram", "facebook"],
  );
});

test("supportedPublishProviders limita publicação ao estágio Meta do MVP", () => {
  assert.deepEqual(
    supportedPublishProviders([
      "instagram",
      "facebook",
      "tiktok",
      "google_business",
    ]),
    ["instagram", "facebook"],
  );
});

test("buildSocialPublishJobPayload produz payload determinístico da fila", () => {
  assert.deepEqual(
    buildSocialPublishJobPayload({
      campaignId: "campaign-1",
      scheduledFor: "2026-09-25T15:00:00.000Z",
      providers: ["facebook", "instagram", "facebook"],
    }),
    {
      campaign_id: "campaign-1",
      scheduled_for: "2026-09-25T15:00:00.000Z",
      providers: ["facebook", "instagram"],
      mode: "scheduled",
      version: 1,
    },
  );
});
