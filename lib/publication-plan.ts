export type PublishProvider =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "google_business";

export const SOCIAL_PUBLISH_SUPPORTED_PROVIDERS = [
  "instagram",
  "facebook",
] as const satisfies readonly PublishProvider[];

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

export function buildSocialPublishJobPayload(input: {
  campaignId: string;
  scheduledFor: string;
  providers: PublishProvider[];
}) {
  return {
    campaign_id: input.campaignId,
    scheduled_for: input.scheduledFor,
    providers: supportedPublishProviders(input.providers),
    version: 1,
  };
}
