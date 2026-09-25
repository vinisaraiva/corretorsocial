export type PublishProvider =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "google_business";

export type InstagramPublishFormat =
  | "feed_4x5"
  | "story_9x16"
  | "carousel_4x5";

export const SOCIAL_PUBLISH_SUPPORTED_PROVIDERS = [
  "instagram",
  "facebook",
] as const satisfies readonly PublishProvider[];

export const INSTAGRAM_PUBLISH_SUPPORTED_FORMATS = [
  "feed_4x5",
  "story_9x16",
  "carousel_4x5",
] as const satisfies readonly InstagramPublishFormat[];

export function normalizePublishProviders(value: unknown): PublishProvider[] {
  if (!Array.isArray(value)) return [];

  const allowed = new Set<PublishProvider>([
    "instagram",
    "facebook",
    "tiktok",
    "google_business",
  ]);

  return Array.from(
    new Set(
      value.filter(
        (item): item is PublishProvider =>
          typeof item === "string" && allowed.has(item as PublishProvider),
      ),
    ),
  );
}

export function supportedPublishProviders(value: unknown): PublishProvider[] {
  const supported = new Set<PublishProvider>(
    SOCIAL_PUBLISH_SUPPORTED_PROVIDERS,
  );

  return normalizePublishProviders(value).filter((provider) =>
    supported.has(provider),
  );
}

export function supportedInstagramPublishFormats(
  value: unknown,
): InstagramPublishFormat[] {
  if (!Array.isArray(value)) return [];

  const supported = new Set<InstagramPublishFormat>(
    INSTAGRAM_PUBLISH_SUPPORTED_FORMATS,
  );

  return Array.from(
    new Set(
      value.filter(
        (format): format is InstagramPublishFormat =>
          typeof format === "string" &&
          supported.has(format as InstagramPublishFormat),
      ),
    ),
  );
}

export function buildSocialPublishJobPayload(input: {
  campaignId: string;
  scheduledFor: string;
  providers: PublishProvider[];
  instagramFormats?: InstagramPublishFormat[];
  mode?: "scheduled" | "immediate";
}) {
  return {
    campaign_id: input.campaignId,
    scheduled_for: input.scheduledFor,
    providers: supportedPublishProviders(input.providers),
    instagram_formats: supportedInstagramPublishFormats(
      input.instagramFormats ?? [],
    ),
    mode: input.mode ?? "scheduled",
    version: 2,
  };
}
