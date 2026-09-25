import { createHash } from "node:crypto";
import type { PublishProvider } from "@/lib/publication-plan";

export type CampaignDraftInput = {
  campaignId?: string;
  propertyId: string;
  visualStyle: string;
  headline: string;
  subheadline: string;
  cta: string;
  publishProviders?: PublishProvider[];
  captions: {
    instagram: string;
    facebook: string;
    tiktok: string;
    google: string;
  };
  instagramStory: {
    templateId: string;
    headline: string;
    subheadline: string;
    cta: string;
  };
  tiktokVertical: {
    templateId: string;
    headline: string;
    subheadline: string;
    cta: string;
  };
  instagramCarousel?: {
    modelId: string;
    headline: string;
    cta: string;
    slideCount: number;
  };
  mediaSelection: {
    instagramFeed?: string;
    instagramStory?: string;
    facebook?: string;
    tiktok?: string;
    google?: string;
    carousel: string[];
  };
  blockPositions: {
    instagramFeed: "auto" | "left" | "right";
    instagramStory: "auto" | "left" | "right";
    facebook: "auto" | "left" | "right";
    tiktok: "auto" | "left" | "right";
    google: "auto" | "left" | "right";
  };
};

type RenderMetadata = {
  visual_style: string;
  source: string;
  subheadline: string;
  block_position: "auto" | "left" | "right";
  carousel_type?: string;
  slide_count?: number;
  media_ids?: string[];
  render_signature?: string;
  rendered_asset_paths?: string[];
  rendered_at?: string;
  render_source?: string;
};

export type CampaignVariantRow = {
  campaign_id: string;
  provider: "instagram" | "facebook" | "tiktok" | "google_business";
  format: string;
  headline: string | null;
  caption: string | null;
  cta: string | null;
  rendered_asset_path?: string | null;
  render_metadata: RenderMetadata;
};

type ExistingVariant = {
  provider: string;
  format: string;
  render_metadata: unknown;
  rendered_asset_path: string | null;
};

const variants = [
  { key: "instagram", provider: "instagram", format: "feed_4x5" },
  { key: "facebook", provider: "facebook", format: "feed" },
  { key: "google", provider: "google_business", format: "post" },
] as const;

export function renderSignature(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function metadataObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function renderedPathsFromVariant(variant: {
  rendered_asset_path: string | null;
  render_metadata: unknown;
}) {
  const metadata = metadataObject(variant.render_metadata);
  const paths = Array.isArray(metadata.rendered_asset_paths)
    ? metadata.rendered_asset_paths.filter(
        (path): path is string => typeof path === "string",
      )
    : [];

  if (variant.rendered_asset_path) paths.push(variant.rendered_asset_path);
  return Array.from(new Set(paths));
}

export function buildCampaignVariantRows(
  input: CampaignDraftInput,
  campaignId: string,
  validMediaIds: ReadonlySet<string>,
) {
  const validSingleMedia = (id?: string) =>
    id && validMediaIds.has(id) ? [id] : [];

  const validCarouselMedia = input.mediaSelection.carousel.filter((id) =>
    validMediaIds.has(id),
  );

  const variantRows: CampaignVariantRow[] = variants.map((variant) => ({
    campaign_id: campaignId,
    provider: variant.provider,
    format: variant.format,
    headline: input.headline.trim() || null,
    caption: input.captions[variant.key].trim() || null,
    cta: input.cta.trim() || null,
    render_metadata: {
      visual_style: input.visualStyle,
      source: "deterministic_preview_v0_2",
      subheadline: input.subheadline.trim(),
      block_position:
        variant.key === "instagram"
          ? input.blockPositions.instagramFeed
          : variant.key === "facebook"
            ? input.blockPositions.facebook
            : input.blockPositions.google,
      media_ids:
        variant.key === "instagram"
          ? validSingleMedia(input.mediaSelection.instagramFeed)
          : variant.key === "facebook"
            ? validSingleMedia(input.mediaSelection.facebook)
            : validSingleMedia(input.mediaSelection.google),
    },
  }));

  variantRows.push({
    campaign_id: campaignId,
    provider: "instagram",
    format: "story_9x16",
    headline: input.instagramStory.headline.trim() || null,
    caption: input.captions.instagram.trim() || null,
    cta: input.instagramStory.cta.trim() || null,
    render_metadata: {
      visual_style: input.instagramStory.templateId,
      source: "deterministic_vertical_v0_1",
      subheadline: input.instagramStory.subheadline.trim(),
      block_position: input.blockPositions.instagramStory,
      media_ids: validSingleMedia(input.mediaSelection.instagramStory),
    },
  });

  variantRows.push({
    campaign_id: campaignId,
    provider: "tiktok",
    format: "vertical_video",
    headline: input.tiktokVertical.headline.trim() || null,
    caption: input.captions.tiktok.trim() || null,
    cta: input.tiktokVertical.cta.trim() || null,
    render_metadata: {
      visual_style: input.tiktokVertical.templateId,
      source: "deterministic_vertical_v0_1",
      subheadline: input.tiktokVertical.subheadline.trim(),
      block_position: input.blockPositions.tiktok,
      media_ids: validSingleMedia(input.mediaSelection.tiktok),
    },
  });

  if (input.instagramCarousel) {
    variantRows.push({
      campaign_id: campaignId,
      provider: "instagram",
      format: "carousel_4x5",
      headline: input.instagramCarousel.headline.trim() || null,
      caption: input.captions.instagram.trim() || null,
      cta: input.instagramCarousel.cta.trim() || null,
      render_metadata: {
        visual_style: input.visualStyle,
        source: "deterministic_carousel_v0_1",
        subheadline: "",
        block_position: "auto",
        carousel_type: input.instagramCarousel.modelId,
        slide_count: input.instagramCarousel.slideCount,
        media_ids: validCarouselMedia,
      },
    });
  }

  return variantRows;
}

export function applyCampaignRenderState(input: {
  variantRows: CampaignVariantRow[];
  existingVariants: ExistingVariant[];
  renderContext: unknown;
  userId: string;
}) {
  const existingByKey = new Map(
    input.existingVariants.map((variant) => [
      `${variant.provider}:${variant.format}`,
      variant,
    ]),
  );

  const stalePaths = new Set<string>();

  const rowsWithRenderState = input.variantRows.map((row) => {
    const key = `${row.provider}:${row.format}`;
    const existing = existingByKey.get(key);
    const existingMetadata = metadataObject(existing?.render_metadata);

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
      render_context: input.renderContext,
    });

    const sameRender =
      existingMetadata.render_signature === signature &&
      Boolean(existing?.rendered_asset_path);

    if (!sameRender && existing) {
      renderedPathsFromVariant(existing).forEach((path) => {
        if (path.startsWith(`${input.userId}/`)) stalePaths.add(path);
      });
    }

    const preservedPaths =
      sameRender && Array.isArray(existingMetadata.rendered_asset_paths)
        ? existingMetadata.rendered_asset_paths.filter(
            (path): path is string => typeof path === "string",
          )
        : undefined;

    return {
      ...row,
      rendered_asset_path: sameRender
        ? existing?.rendered_asset_path ?? null
        : null,
      render_metadata: {
        ...row.render_metadata,
        render_signature: signature,
        ...(sameRender && preservedPaths
          ? { rendered_asset_paths: preservedPaths }
          : {}),
        ...(sameRender && typeof existingMetadata.rendered_at === "string"
          ? { rendered_at: existingMetadata.rendered_at }
          : {}),
        ...(sameRender && typeof existingMetadata.render_source === "string"
          ? { render_source: existingMetadata.render_source }
          : {}),
      },
    };
  });

  return { rowsWithRenderState, stalePaths };
}
