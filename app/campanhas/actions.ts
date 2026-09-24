"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CampaignDraftInput = {
  campaignId?: string;
  propertyId: string;
  visualStyle: string;
  headline: string;
  subheadline: string;
  cta: string;
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

const variants = [
  { key: "instagram", provider: "instagram", format: "feed_4x5" },
  { key: "facebook", provider: "facebook", format: "feed" },
  { key: "google", provider: "google_business", format: "post" },
] as const;

async function persistCampaign(input: CampaignDraftInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: property } = await supabase
    .from("properties")
    .select("id")
    .eq("id", input.propertyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!property) {
    throw new Error("O imóvel não pertence a esta conta.");
  }

  const requestedMediaIds = Array.from(
    new Set(
      [
        input.mediaSelection.instagramFeed,
        input.mediaSelection.instagramStory,
        input.mediaSelection.facebook,
        input.mediaSelection.tiktok,
        input.mediaSelection.google,
        ...input.mediaSelection.carousel,
      ].filter((id): id is string => Boolean(id)),
    ),
  );

  const validMediaIds = new Set<string>();

  if (requestedMediaIds.length > 0) {
    const { data: mediaRows, error: mediaError } = await supabase
      .from("property_media")
      .select("id")
      .eq("property_id", property.id)
      .in("id", requestedMediaIds);

    if (mediaError) {
      throw new Error("Não foi possível validar as fotos da campanha.");
    }

    mediaRows?.forEach((row) => validMediaIds.add(row.id));
  }

  const validSingleMedia = (id?: string) =>
    id && validMediaIds.has(id) ? [id] : [];

  const validCarouselMedia = input.mediaSelection.carousel.filter((id) =>
    validMediaIds.has(id),
  );

  let campaignId = input.campaignId;

  if (campaignId) {
    const { data: existing } = await supabase
      .from("campaigns")
      .select("id")
      .eq("id", campaignId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing) {
      throw new Error("Campanha não encontrada.");
    }

    const { error } = await supabase
      .from("campaigns")
      .update({
        visual_style: input.visualStyle,
        marketing_angle: input.headline,
        generation_metadata: {
          source: "deterministic_preview_v0_2",
          template_id: input.visualStyle,
          subheadline: input.subheadline.trim(),
        },
      })
      .eq("id", campaignId)
      .eq("user_id", user.id);

    if (error) {
      throw new Error("Não foi possível atualizar a campanha.");
    }
  } else {
    const { data, error } = await supabase
      .from("campaigns")
      .insert({
        user_id: user.id,
        property_id: input.propertyId,
        visual_style: input.visualStyle,
        marketing_angle: input.headline,
        status: "ready",
        generation_metadata: {
          source: "deterministic_preview_v0_2",
          template_id: input.visualStyle,
          subheadline: input.subheadline.trim(),
        },
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error("Não foi possível salvar a campanha.");
    }

    campaignId = data.id;
  }

  const variantRows: Array<{
    campaign_id: string;
    provider: "instagram" | "facebook" | "tiktok" | "google_business";
    format: string;
    headline: string | null;
    caption: string | null;
    cta: string | null;
    render_metadata: {
      visual_style: string;
      source: string;
      subheadline: string;
      block_position: "auto" | "left" | "right";
      carousel_type?: string;
      slide_count?: number;
      media_ids?: string[];
    };
  }> = variants.map((variant) => ({
    campaign_id: campaignId!,
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
    campaign_id: campaignId!,
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
    campaign_id: campaignId!,
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
      campaign_id: campaignId!,
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

  const { error: variantsError } = await supabase
    .from("campaign_variants")
    .upsert(variantRows, {
      onConflict: "campaign_id,provider,format",
    });

  if (variantsError) {
    throw new Error("A campanha foi criada, mas não conseguimos salvar suas versões.");
  }

  return campaignId;
}

export async function saveCampaignDraft(input: CampaignDraftInput) {
  return persistCampaign(input);
}

export async function scheduleCampaignDraft(
  input: CampaignDraftInput,
  scheduledFor: string,
) {
  const campaignId = await persistCampaign(input);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const date = new Date(scheduledFor);

  if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
    throw new Error("Escolha uma data futura para o agendamento.");
  }

  const { error } = await supabase
    .from("campaigns")
    .update({
      status: "scheduled",
      scheduled_for: date.toISOString(),
    })
    .eq("id", campaignId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error("Não foi possível agendar a campanha.");
  }

  return campaignId;
}


export async function deleteCampaign(campaignId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: campaign, error: readError } = await supabase
    .from("campaigns")
    .select("id,status")
    .eq("id", campaignId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (readError || !campaign) {
    throw new Error("Campanha não encontrada.");
  }

  if (campaign.status === "publishing") {
    throw new Error(
      "A campanha está sendo publicada. Aguarde a conclusão antes de excluí-la.",
    );
  }

  const { error } = await supabase
    .from("campaigns")
    .delete()
    .eq("id", campaign.id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error("Não foi possível excluir a campanha.");
  }

  revalidatePath("/campanhas");
  revalidatePath("/imoveis");

  return { deleted: true };
}
