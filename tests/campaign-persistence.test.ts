import test from "node:test";
import assert from "node:assert/strict";
import {
  applyCampaignRenderState,
  buildCampaignVariantRows,
  renderSignature,
  renderedPathsFromVariant,
  type CampaignDraftInput,
} from "../lib/campaign-persistence";

function draft(overrides: Partial<CampaignDraftInput> = {}): CampaignDraftInput {
  return {
    propertyId: "property-1",
    visualStyle: "clean-base",
    headline: "  Apartamento com vista  ",
    subheadline: "  Perto da praia  ",
    cta: "  Fale comigo  ",
    captions: {
      instagram: "  Instagram  ",
      facebook: "  Facebook  ",
      tiktok: "  TikTok  ",
      google: "  Google  ",
    },
    instagramStory: {
      templateId: "story-clean",
      headline: "  Story headline  ",
      subheadline: "  Story subheadline  ",
      cta: "  Story CTA  ",
    },
    tiktokVertical: {
      templateId: "tiktok-clean",
      headline: "  TikTok headline  ",
      subheadline: "  TikTok subheadline  ",
      cta: "  TikTok CTA  ",
    },
    instagramCarousel: {
      modelId: "carousel-details",
      headline: "  Carousel headline  ",
      cta: "  Carousel CTA  ",
      slideCount: 5,
    },
    mediaSelection: {
      instagramFeed: "media-feed",
      instagramStory: "media-story",
      facebook: "media-facebook-invalid",
      tiktok: "media-tiktok",
      google: "media-google",
      carousel: ["media-feed", "media-carousel-2", "media-invalid"],
    },
    blockPositions: {
      instagramFeed: "left",
      instagramStory: "right",
      facebook: "auto",
      tiktok: "left",
      google: "right",
    },
    ...overrides,
  };
}

test("buildCampaignVariantRows monta os formatos e filtra mídias não validadas", () => {
  const rows = buildCampaignVariantRows(
    draft(),
    "campaign-1",
    new Set([
      "media-feed",
      "media-story",
      "media-tiktok",
      "media-google",
      "media-carousel-2",
    ]),
  );

  assert.deepEqual(
    rows.map((row) => `${row.provider}:${row.format}`),
    [
      "instagram:feed_4x5",
      "facebook:feed",
      "google_business:post",
      "instagram:story_9x16",
      "tiktok:vertical_video",
      "instagram:carousel_4x5",
    ],
  );

  const feed = rows[0];
  assert.equal(feed.headline, "Apartamento com vista");
  assert.equal(feed.cta, "Fale comigo");
  assert.deepEqual(feed.render_metadata.media_ids, ["media-feed"]);

  const facebook = rows[1];
  assert.deepEqual(facebook.render_metadata.media_ids, []);

  const carousel = rows.at(-1);
  assert.ok(carousel);
  assert.equal(carousel.render_metadata.slide_count, 5);
  assert.deepEqual(carousel.render_metadata.media_ids, [
    "media-feed",
    "media-carousel-2",
  ]);
});

test("applyCampaignRenderState preserva render compatível e seus metadados", () => {
  const [row] = buildCampaignVariantRows(
    {
      ...draft({ instagramCarousel: undefined }),
      mediaSelection: {
        instagramFeed: "media-feed",
        instagramStory: undefined,
        facebook: undefined,
        tiktok: undefined,
        google: undefined,
        carousel: [],
      },
    },
    "campaign-1",
    new Set(["media-feed"]),
  );

  const renderContext = {
    property: { title: "Apartamento" },
    brand: { professional_name: "JP Saraiva" },
  };

  const signature = renderSignature({
    provider: row.provider,
    format: row.format,
    headline: row.headline,
    cta: row.cta,
    visual_style: row.render_metadata.visual_style,
    subheadline: row.render_metadata.subheadline,
    block_position: row.render_metadata.block_position,
    carousel_type: row.render_metadata.carousel_type ?? null,
    slide_count: row.render_metadata.slide_count ?? null,
    media_ids: row.render_metadata.media_ids ?? [],
    render_context: renderContext,
  });

  const { rowsWithRenderState, stalePaths } = applyCampaignRenderState({
    variantRows: [row],
    existingVariants: [
      {
        provider: row.provider,
        format: row.format,
        rendered_asset_path: "user-1/campaign-1/instagram-feed/old.png",
        render_metadata: {
          render_signature: signature,
          rendered_asset_paths: [
            "user-1/campaign-1/instagram-feed/old.png",
          ],
          rendered_at: "2026-09-25T00:00:00.000Z",
          render_source: "client_dom_v0_1",
        },
      },
    ],
    renderContext,
    userId: "user-1",
  });

  assert.equal(
    rowsWithRenderState[0].rendered_asset_path,
    "user-1/campaign-1/instagram-feed/old.png",
  );
  assert.deepEqual(
    rowsWithRenderState[0].render_metadata.rendered_asset_paths,
    ["user-1/campaign-1/instagram-feed/old.png"],
  );
  assert.equal(
    rowsWithRenderState[0].render_metadata.rendered_at,
    "2026-09-25T00:00:00.000Z",
  );
  assert.equal(stalePaths.size, 0);
});

test("applyCampaignRenderState invalida render antigo quando conteúdo visual muda", () => {
  const [row] = buildCampaignVariantRows(
    {
      ...draft({ instagramCarousel: undefined }),
      headline: "Novo headline",
      mediaSelection: {
        instagramFeed: "media-feed",
        instagramStory: undefined,
        facebook: undefined,
        tiktok: undefined,
        google: undefined,
        carousel: [],
      },
    },
    "campaign-1",
    new Set(["media-feed"]),
  );

  const { rowsWithRenderState, stalePaths } = applyCampaignRenderState({
    variantRows: [row],
    existingVariants: [
      {
        provider: row.provider,
        format: row.format,
        rendered_asset_path: "user-1/campaign-1/feed/old.png",
        render_metadata: {
          render_signature: "assinatura-antiga",
          rendered_asset_paths: [
            "user-1/campaign-1/feed/old.png",
            "other-user/campaign-1/feed/foreign.png",
          ],
        },
      },
    ],
    renderContext: { property: { title: "Apartamento" } },
    userId: "user-1",
  });

  assert.equal(rowsWithRenderState[0].rendered_asset_path, null);
  assert.deepEqual(Array.from(stalePaths), [
    "user-1/campaign-1/feed/old.png",
  ]);
});

test("renderedPathsFromVariant remove caminhos duplicados", () => {
  assert.deepEqual(
    renderedPathsFromVariant({
      rendered_asset_path: "user-1/a.png",
      render_metadata: {
        rendered_asset_paths: [
          "user-1/a.png",
          "user-1/b.png",
          "user-1/b.png",
        ],
      },
    }),
    ["user-1/a.png", "user-1/b.png"],
  );
});
