import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CampaignBuilder } from "@/components/campaign-builder";
import { createClient } from "@/lib/supabase/server";
import { propertyToView, resolvePrivateMedia } from "@/lib/property-ui";
import type { SocialChannel } from "@/types";

export const dynamic = "force-dynamic";

const providerToChannel: Record<string, SocialChannel> = {
  instagram: "instagram",
  facebook: "facebook",
  tiktok: "tiktok",
  google_business: "google",
};

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!campaign) {
    notFound();
  }

  const [
    { data: row },
    mediaResult,
    campaignsResult,
    variantsResult,
    profileResult,
  ] = await Promise.all([
      supabase
        .from("properties")
        .select("*")
        .eq("id", campaign.property_id)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("property_media")
        .select("property_id,original_url,storage_path,is_cover,sort_order,width,height,ai_score,ai_tags")
        .eq("property_id", campaign.property_id),
      supabase
        .from("campaigns")
        .select("property_id,published_at")
        .eq("property_id", campaign.property_id),
      supabase
        .from("campaign_variants")
        .select("provider,format,headline,caption,cta,render_metadata")
        .eq("campaign_id", campaign.id),
      supabase
        .from("profiles")
        .select("professional_name,logo_path,primary_color")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  if (!row) {
    notFound();
  }

  const media = await resolvePrivateMedia(
    supabase,
    mediaResult.data ?? [],
  );

  const property = propertyToView(
    row,
    media,
    campaignsResult.data ?? [],
  );

  const captions: Partial<Record<SocialChannel, string>> = {};
  let headline = campaign.marketing_angle ?? property.title;
  let cta = "Fale comigo no WhatsApp";
  let subheadline = [property.location, property.city]
    .filter(Boolean)
    .join(" · ");
  let instagramStory:
    | {
        templateId: string;
        headline: string;
        subheadline: string;
        cta: string;
      }
    | undefined;
  let tiktokVertical:
    | {
        templateId: string;
        headline: string;
        subheadline: string;
        cta: string;
      }
    | undefined;
  let instagramCarousel:
    | {
        modelId: string;
        headline: string;
        cta: string;
      }
    | undefined;

  const blockPositions = {
    instagramFeed: "auto" as "auto" | "left" | "right",
    instagramStory: "auto" as "auto" | "left" | "right",
    facebook: "auto" as "auto" | "left" | "right",
    tiktok: "auto" as "auto" | "left" | "right",
    google: "auto" as "auto" | "left" | "right",
  };

  const metadata =
    campaign.generation_metadata &&
    typeof campaign.generation_metadata === "object" &&
    !Array.isArray(campaign.generation_metadata)
      ? (campaign.generation_metadata as Record<string, unknown>)
      : null;

  if (typeof metadata?.subheadline === "string") {
    subheadline = metadata.subheadline;
  }

  for (const variant of variantsResult.data ?? []) {
    const variantMetadata =
      variant.render_metadata &&
      typeof variant.render_metadata === "object" &&
      !Array.isArray(variant.render_metadata)
        ? (variant.render_metadata as Record<string, unknown>)
        : null;

    if (variant.provider === "instagram" && variant.format === "story_9x16") {
      if (
        variantMetadata?.block_position === "left" ||
        variantMetadata?.block_position === "right"
      ) {
        blockPositions.instagramStory = variantMetadata.block_position;
      }

      instagramStory = {
        templateId:
          typeof variantMetadata?.visual_style === "string"
            ? variantMetadata.visual_style
            : "vertical-clean",
        headline: variant.headline ?? headline,
        subheadline:
          typeof variantMetadata?.subheadline === "string"
            ? variantMetadata.subheadline
            : subheadline,
        cta: variant.cta ?? cta,
      };
      continue;
    }

    if (variant.provider === "tiktok" && variant.format === "vertical_video") {
      if (variant.caption) captions.tiktok = variant.caption;
      if (
        variantMetadata?.block_position === "left" ||
        variantMetadata?.block_position === "right"
      ) {
        blockPositions.tiktok = variantMetadata.block_position;
      }

      tiktokVertical = {
        templateId:
          typeof variantMetadata?.visual_style === "string"
            ? variantMetadata.visual_style
            : "vertical-clean",
        headline: variant.headline ?? headline,
        subheadline:
          typeof variantMetadata?.subheadline === "string"
            ? variantMetadata.subheadline
            : subheadline,
        cta: variant.cta ?? "Veja mais detalhes",
      };
      continue;
    }

    if (variant.provider === "instagram" && variant.format === "carousel_4x5") {
      instagramCarousel = {
        modelId:
          typeof variantMetadata?.carousel_type === "string"
            ? variantMetadata.carousel_type
            : property.purpose === "Aluguel"
              ? "rent-practical"
              : "presentation",
        headline: variant.headline ?? headline,
        cta: variant.cta ?? cta,
      };
      continue;
    }

    const channel = providerToChannel[variant.provider];
    if (channel && variant.caption) captions[channel] = variant.caption;

    if (
      variantMetadata?.block_position === "left" ||
      variantMetadata?.block_position === "right"
    ) {
      if (variant.provider === "instagram" && variant.format === "feed_4x5") {
        blockPositions.instagramFeed = variantMetadata.block_position;
      } else if (variant.provider === "facebook") {
        blockPositions.facebook = variantMetadata.block_position;
      } else if (variant.provider === "google_business") {
        blockPositions.google = variantMetadata.block_position;
      }
    }

    if (variant.provider === "instagram" && variant.format === "feed_4x5") {
      if (variant.headline) headline = variant.headline;
      if (variant.cta) cta = variant.cta;
    }
  }

  let logoUrl: string | null = null;

  if (profileResult.data?.logo_path) {
    const { data } = await supabase.storage
      .from("profile-assets")
      .createSignedUrl(profileResult.data.logo_path, 60 * 60);

    logoUrl = data?.signedUrl ?? null;
  }

  const brand = {
    professionalName:
      profileResult.data?.professional_name ?? "Corretor Social",
    logoUrl,
    primaryColor: profileResult.data?.primary_color ?? "#176B5B",
  };

  return (
    <AppShell
      title="Campanha"
      description="Edite, salve ou altere o agendamento."
    >
      <CampaignBuilder
        propertyData={property}
        brand={brand}
        campaignData={{
          id: campaign.id,
          visualStyle: campaign.visual_style,
          headline,
          subheadline,
          cta,
          status: campaign.status,
          scheduledFor: campaign.scheduled_for,
          captions,
          instagramStory,
          tiktokVertical,
          instagramCarousel,
          blockPositions,
        }}
      />
    </AppShell>
  );
}
