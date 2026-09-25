import { createHash } from "node:crypto";
import {
  publishFacebookPhoto,
  publishInstagramCarousel,
  publishInstagramImage,
  publishInstagramStory,
} from "./meta-publisher.js";
import { supabase, type WorkerJob } from "./queue.js";
import { decryptSocialSecret } from "./social-token-crypto.js";

type PublishProvider = "instagram" | "facebook";

type SocialPublishPayload = {
  campaign_id: string;
  scheduled_for: string;
  providers: PublishProvider[];
  mode: "scheduled" | "immediate";
  version?: number;
};

type SocialConnection = {
  id: string;
  provider: PublishProvider;
  external_account_id: string | null;
  token_secret_ref: string | null;
  status: string;
};

type CampaignVariant = {
  id: string;
  provider: PublishProvider;
  format: string;
  caption: string | null;
  rendered_asset_path: string | null;
  render_metadata: unknown;
};

function parsePayload(payload: unknown): SocialPublishPayload {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Invalid social_publish payload");
  }

  const value = payload as Record<string, unknown>;
  const providers = Array.isArray(value.providers)
    ? Array.from(
        new Set(
          value.providers.filter(
            (provider): provider is PublishProvider =>
              provider === "instagram" || provider === "facebook",
          ),
        ),
      )
    : [];

  if (
    typeof value.campaign_id !== "string" ||
    typeof value.scheduled_for !== "string" ||
    providers.length === 0
  ) {
    throw new Error("Incomplete social_publish payload");
  }

  return {
    campaign_id: value.campaign_id,
    scheduled_for: value.scheduled_for,
    providers,
    mode: value.mode === "immediate" ? "immediate" : "scheduled",
    version: typeof value.version === "number" ? value.version : undefined,
  };
}

function metadataObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function renderedPaths(variant: CampaignVariant) {
  const metadata = metadataObject(variant.render_metadata);
  const paths = Array.isArray(metadata.rendered_asset_paths)
    ? metadata.rendered_asset_paths.filter(
        (path): path is string => typeof path === "string",
      )
    : [];

  if (variant.rendered_asset_path) {
    paths.unshift(variant.rendered_asset_path);
  }

  return Array.from(new Set(paths));
}

async function createSignedUrls(paths: string[]) {
  if (paths.length === 0) {
    throw new Error("Campaign variant has no rendered asset");
  }

  const { data, error } = await supabase.storage
    .from("campaign-assets")
    .createSignedUrls(paths, 30 * 60);

  if (error) throw error;

  const urls = (data ?? [])
    .map((item) => item.signedUrl)
    .filter((url): url is string => Boolean(url));

  if (urls.length !== paths.length) {
    throw new Error("Could not create signed URLs for all campaign assets");
  }

  return urls;
}

function idempotencyKey(input: {
  campaignId: string;
  variantId: string;
  connectionId: string;
  scheduledFor: string;
}) {
  return createHash("sha256")
    .update(
      [
        input.campaignId,
        input.variantId,
        input.connectionId,
        input.scheduledFor,
      ].join(":"),
    )
    .digest("hex");
}

async function preparePublication(input: {
  job: WorkerJob;
  payload: SocialPublishPayload;
  variant: CampaignVariant;
  connection: SocialConnection;
}) {
  const key = idempotencyKey({
    campaignId: input.payload.campaign_id,
    variantId: input.variant.id,
    connectionId: input.connection.id,
    scheduledFor: input.payload.scheduled_for,
  });

  const { data: existing, error: readError } = await supabase
    .from("publications")
    .select("id,status,external_post_id")
    .eq("idempotency_key", key)
    .maybeSingle();

  if (readError) throw readError;

  if (existing?.status === "published") {
    return {
      publicationId: existing.id as string,
      alreadyPublished: true,
      externalPostId: existing.external_post_id as string | null,
    };
  }

  if (existing) {
    const { error } = await supabase
      .from("publications")
      .update({
        status: "processing",
        last_error: null,
        retry_count: Math.max(0, input.job.attempts - 1),
        social_connection_id: input.connection.id,
        scheduled_for: input.payload.scheduled_for,
      })
      .eq("id", existing.id);

    if (error) throw error;

    return {
      publicationId: existing.id as string,
      alreadyPublished: false,
      externalPostId: null,
    };
  }

  const { data: created, error } = await supabase
    .from("publications")
    .insert({
      campaign_variant_id: input.variant.id,
      social_connection_id: input.connection.id,
      idempotency_key: key,
      scheduled_for: input.payload.scheduled_for,
      status: "processing",
      retry_count: Math.max(0, input.job.attempts - 1),
    })
    .select("id")
    .single();

  if (error || !created) {
    throw error ?? new Error("Could not create publication record");
  }

  return {
    publicationId: created.id as string,
    alreadyPublished: false,
    externalPostId: null,
  };
}

async function completePublication(
  publicationId: string,
  externalPostId: string,
) {
  const { error } = await supabase
    .from("publications")
    .update({
      status: "published",
      external_post_id: externalPostId,
      published_at: new Date().toISOString(),
      last_error: null,
    })
    .eq("id", publicationId);

  if (error) throw error;
}

async function failPublication(
  publicationId: string,
  job: WorkerJob,
  errorValue: unknown,
) {
  const message =
    errorValue instanceof Error ? errorValue.message : String(errorValue);

  const { error } = await supabase
    .from("publications")
    .update({
      status: "failed",
      last_error: message.slice(0, 4000),
      retry_count: Math.max(0, job.attempts - 1),
    })
    .eq("id", publicationId);

  if (error) {
    console.error(
      `Could not mark publication ${publicationId} as failed`,
      error.message,
    );
  }
}

function variantPriority(variant: CampaignVariant) {
  const order: Record<string, number> = {
    "facebook:feed": 10,
    "instagram:feed_4x5": 20,
    "instagram:story_9x16": 30,
    "instagram:carousel_4x5": 40,
  };

  return order[`${variant.provider}:${variant.format}`] ?? 999;
}

function publicAppUrl() {
  const value =
    process.env.APP_PUBLIC_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!value) {
    throw new Error("Missing required environment variable: APP_PUBLIC_URL");
  }

  const url = new URL(value);

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("APP_PUBLIC_URL must use http or https");
  }

  return url.toString().replace(/\/$/, "");
}

function normalizeWhatsappNumber(value: string) {
  let digits = value.replace(/\D/g, "");

  if (digits.length === 10 || digits.length === 11) {
    digits = `55${digits}`;
  }

  if (digits.length < 12 || digits.length > 15) {
    throw new Error("Profile WhatsApp number is not valid for wa.me");
  }

  return digits;
}

function providerDisplayName(provider: PublishProvider) {
  return provider === "instagram" ? "Instagram" : "Facebook";
}

async function ensureTrackingLink(input: {
  userId: string;
  campaignId: string;
  propertyId: string;
  propertyTitle: string;
  provider: PublishProvider;
  whatsapp: string;
}) {
  const phone = normalizeWhatsappNumber(input.whatsapp);
  const message =
    `Olá! Tenho interesse em ${input.propertyTitle}. ` +
    `Vi a campanha no ${providerDisplayName(input.provider)}.`;
  const destination = new URL(`https://wa.me/${phone}`);
  destination.searchParams.set("text", message);

  const { data: existingRows, error: existingError } = await supabase
    .from("tracking_links")
    .select("id,short_code,destination_url")
    .eq("user_id", input.userId)
    .eq("campaign_id", input.campaignId)
    .eq("provider", input.provider)
    .limit(1);

  if (existingError) throw existingError;

  const existing = existingRows?.[0];

  if (existing) {
    if (existing.destination_url !== destination.toString()) {
      const { error: updateError } = await supabase
        .from("tracking_links")
        .update({ destination_url: destination.toString() })
        .eq("id", existing.id);

      if (updateError) throw updateError;
    }

    return `${publicAppUrl()}/r/${existing.short_code}`;
  }

  const shortCode = createHash("sha256")
    .update(
      [
        input.userId,
        input.campaignId,
        input.propertyId,
        input.provider,
      ].join(":"),
    )
    .digest("base64url")
    .slice(0, 16);

  const { error: insertError } = await supabase
    .from("tracking_links")
    .insert({
      user_id: input.userId,
      property_id: input.propertyId,
      campaign_id: input.campaignId,
      provider: input.provider,
      short_code: shortCode,
      destination_url: destination.toString(),
    });

  if (insertError) {
    const { data: racedRows, error: racedError } = await supabase
      .from("tracking_links")
      .select("short_code")
      .eq("user_id", input.userId)
      .eq("campaign_id", input.campaignId)
      .eq("provider", input.provider)
      .limit(1);

    if (racedError || !racedRows?.[0]) {
      throw insertError;
    }

    return `${publicAppUrl()}/r/${racedRows[0].short_code}`;
  }

  return `${publicAppUrl()}/r/${shortCode}`;
}

function captionWithTracking(caption: string, trackingUrl?: string) {
  if (!trackingUrl) return caption;
  if (!caption) return trackingUrl;
  return `${caption}\n\n${trackingUrl}`;
}

async function publishVariant(
  variant: CampaignVariant,
  connection: SocialConnection,
  trackingUrl?: string,
) {
  if (!connection.external_account_id || !connection.token_secret_ref) {
    throw new Error(`${connection.provider} connection is incomplete`);
  }

  const accessToken = decryptSocialSecret(connection.token_secret_ref);
  const paths = renderedPaths(variant);

  if (paths.some((path) => !path.toLowerCase().endsWith(".jpg"))) {
    throw new Error(
      `${variant.provider} ${variant.format} still uses a legacy non-JPEG asset`,
    );
  }

  const urls = await createSignedUrls(paths);
  const caption = captionWithTracking(
    variant.caption?.trim() ?? "",
    trackingUrl,
  );

  if (variant.provider === "facebook" && variant.format === "feed") {
    const result = await publishFacebookPhoto({
      pageId: connection.external_account_id,
      accessToken,
      imageUrl: urls[0],
      caption,
    });

    return result.externalId;
  }

  if (variant.provider === "instagram") {
    if (variant.format === "feed_4x5") {
      const result = await publishInstagramImage({
        instagramAccountId: connection.external_account_id,
        accessToken,
        imageUrl: urls[0],
        caption,
      });

      return result.externalId;
    }

    if (variant.format === "story_9x16") {
      const result = await publishInstagramStory({
        instagramAccountId: connection.external_account_id,
        accessToken,
        imageUrl: urls[0],
      });

      return result.externalId;
    }

    if (variant.format === "carousel_4x5") {
      const result = await publishInstagramCarousel({
        instagramAccountId: connection.external_account_id,
        accessToken,
        imageUrls: urls,
        caption,
      });

      return result.externalId;
    }
  }

  throw new Error(
    `Unsupported social publication format: ${variant.provider}/${variant.format}`,
  );
}

async function markCampaignFailedIfFinalAttempt(
  job: WorkerJob,
  campaignId: string,
) {
  if (job.attempts < job.max_attempts) return;

  const { error } = await supabase
    .from("campaigns")
    .update({ status: "failed" })
    .eq("id", campaignId)
    .eq("user_id", job.user_id);

  if (error) {
    console.error("Could not mark campaign as failed", error.message);
  }
}

export async function handleSocialPublish(job: WorkerJob) {
  const payload = parsePayload(job.payload);

  try {
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("id,user_id,property_id,status,scheduled_for")
      .eq("id", payload.campaign_id)
      .eq("user_id", job.user_id)
      .maybeSingle();

    if (campaignError) throw campaignError;

    if (!campaign) {
      return { skipped: true, reason: "campaign_missing" };
    }

    const scheduledAt = campaign.scheduled_for
      ? new Date(campaign.scheduled_for).getTime()
      : Number.NaN;
    const expectedAt = new Date(payload.scheduled_for).getTime();

    if (payload.mode === "immediate") {
      if (campaign.status !== "publishing") {
        return { skipped: true, reason: "stale_immediate_publish" };
      }
    } else if (
      campaign.status !== "scheduled" ||
      !Number.isFinite(scheduledAt) ||
      !Number.isFinite(expectedAt) ||
      scheduledAt !== expectedAt
    ) {
      return { skipped: true, reason: "stale_schedule" };
    }

    const [{ data: profile, error: profileError }, { data: property, error: propertyError }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("whatsapp")
          .eq("user_id", job.user_id)
          .maybeSingle(),
        supabase
          .from("properties")
          .select("id,title")
          .eq("id", campaign.property_id)
          .eq("user_id", job.user_id)
          .maybeSingle(),
      ]);

    if (profileError || !profile?.whatsapp) {
      throw new Error("Profile WhatsApp is required before social publishing");
    }

    if (propertyError || !property) {
      throw new Error("Campaign property was not found");
    }

    const trackingUrlByProvider = new Map<PublishProvider, string>();

    for (const provider of payload.providers) {
      trackingUrlByProvider.set(
        provider,
        await ensureTrackingLink({
          userId: job.user_id,
          campaignId: campaign.id,
          propertyId: property.id,
          propertyTitle: property.title,
          provider,
          whatsapp: profile.whatsapp,
        }),
      );
    }

    const { data: connectionRows, error: connectionError } = await supabase
      .from("social_connections")
      .select(
        "id,provider,external_account_id,token_secret_ref,status",
      )
      .eq("user_id", job.user_id)
      .eq("status", "connected")
      .in("provider", payload.providers);

    if (connectionError) throw connectionError;

    const connections = (connectionRows ?? []) as SocialConnection[];
    const connectionByProvider = new Map(
      connections.map((connection) => [connection.provider, connection]),
    );

    for (const provider of payload.providers) {
      const connection = connectionByProvider.get(provider);

      if (
        !connection ||
        !connection.external_account_id ||
        !connection.token_secret_ref
      ) {
        throw new Error(
          `${provider} is no longer connected for this campaign`,
        );
      }
    }

    const { data: variantRows, error: variantsError } = await supabase
      .from("campaign_variants")
      .select(
        "id,provider,format,caption,rendered_asset_path,render_metadata",
      )
      .eq("campaign_id", campaign.id)
      .in("provider", payload.providers);

    if (variantsError) throw variantsError;

    const variants = ((variantRows ?? []) as CampaignVariant[])
      .filter(
        (variant) =>
          (variant.provider === "facebook" && variant.format === "feed") ||
          (variant.provider === "instagram" &&
            ["feed_4x5", "story_9x16", "carousel_4x5"].includes(
              variant.format,
            )),
      )
      .sort((a, b) => variantPriority(a) - variantPriority(b));

    if (variants.length === 0) {
      throw new Error("No publishable campaign variants were found");
    }

    const published: Array<{
      provider: PublishProvider;
      format: string;
      externalPostId: string | null;
      reused: boolean;
    }> = [];

    for (const variant of variants) {
      const connection = connectionByProvider.get(variant.provider);

      if (!connection) {
        throw new Error(`Missing connection for ${variant.provider}`);
      }

      const publication = await preparePublication({
        job,
        payload,
        variant,
        connection,
      });

      if (publication.alreadyPublished) {
        published.push({
          provider: variant.provider,
          format: variant.format,
          externalPostId: publication.externalPostId,
          reused: true,
        });
        continue;
      }

      try {
        const externalPostId = await publishVariant(
          variant,
          connection,
          trackingUrlByProvider.get(variant.provider),
        );
        await completePublication(publication.publicationId, externalPostId);

        published.push({
          provider: variant.provider,
          format: variant.format,
          externalPostId,
          reused: false,
        });
      } catch (error) {
        await failPublication(publication.publicationId, job, error);
        throw error;
      }
    }

    const publishedAt = new Date().toISOString();
    const { error: updateCampaignError } = await supabase
      .from("campaigns")
      .update({
        status: "published",
        published_at: publishedAt,
      })
      .eq("id", campaign.id)
      .eq("user_id", job.user_id);

    if (updateCampaignError) throw updateCampaignError;

    return {
      campaignId: campaign.id,
      publishedAt,
      publications: published,
    };
  } catch (error) {
    await markCampaignFailedIfFinalAttempt(job, payload.campaign_id);
    throw error;
  }
}
