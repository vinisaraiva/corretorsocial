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

  const [{ data: row }, mediaResult, campaignsResult, variantsResult] =
    await Promise.all([
      supabase
        .from("properties")
        .select("*")
        .eq("id", campaign.property_id)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("property_media")
        .select("property_id,original_url,storage_path,is_cover,sort_order")
        .eq("property_id", campaign.property_id),
      supabase
        .from("campaigns")
        .select("property_id,published_at")
        .eq("property_id", campaign.property_id),
      supabase
        .from("campaign_variants")
        .select("provider,headline,caption,cta")
        .eq("campaign_id", campaign.id),
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

  for (const variant of variantsResult.data ?? []) {
    const channel = providerToChannel[variant.provider];
    if (channel && variant.caption) captions[channel] = variant.caption;
    if (variant.headline) headline = variant.headline;
    if (variant.cta) cta = variant.cta;
  }

  return (
    <AppShell
      title="Campanha"
      description="Edite, salve ou altere o agendamento."
    >
      <CampaignBuilder
        propertyData={property}
        campaignData={{
          id: campaign.id,
          visualStyle: campaign.visual_style,
          headline,
          cta,
          status: campaign.status,
          scheduledFor: campaign.scheduled_for,
          captions,
        }}
      />
    </AppShell>
  );
}
