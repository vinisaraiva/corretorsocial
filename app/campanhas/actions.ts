"use server";

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
  instagramStory?: {
    templateId: string;
    headline: string;
    subheadline: string;
    cta: string;
  };
};

const variants = [
  { key: "instagram", provider: "instagram", format: "feed_4x5" },
  { key: "facebook", provider: "facebook", format: "feed" },
  { key: "tiktok", provider: "tiktok", format: "vertical_video" },
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

  const variantRows = variants.map((variant) => ({
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
    },
  }));

  if (input.instagramStory) {
    variantRows.push({
      campaign_id: campaignId!,
      provider: "instagram",
      format: "story_9x16",
      headline: input.instagramStory.headline.trim() || null,
      caption: input.captions.instagram.trim() || null,
      cta: input.instagramStory.cta.trim() || null,
      render_metadata: {
        visual_style: input.instagramStory.templateId,
        source: "deterministic_story_v0_1",
        subheadline: input.instagramStory.subheadline.trim(),
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
