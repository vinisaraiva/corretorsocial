import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CampaignBuilder } from "@/components/campaign-builder";
import { createClient } from "@/lib/supabase/server";
import { propertyToView, resolvePrivateMedia } from "@/lib/property-ui";

export const dynamic = "force-dynamic";

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ imovel?: string; analise?: string }>;
}) {
  const params = await searchParams;

  if (!params.imovel) {
    redirect("/imoveis");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: row } = await supabase
    .from("properties")
    .select("*")
    .eq("id", params.imovel)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!row) {
    notFound();
  }

  const [mediaResult, campaignsResult, profileResult] = await Promise.all([
    supabase
      .from("property_media")
      .select("id,property_id,original_url,storage_path,is_cover,sort_order,width,height,ai_score,ai_tags")
      .eq("property_id", row.id),
    supabase
      .from("campaigns")
      .select("property_id,published_at")
      .eq("property_id", row.id),
    supabase
      .from("profiles")
      .select("professional_name,logo_path,primary_color")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const media = await resolvePrivateMedia(
    supabase,
    mediaResult.data ?? [],
  );

  const property = propertyToView(
    row,
    media,
    campaignsResult.data ?? [],
  );

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
      title="Nova campanha"
      description="Revise a versão recomendada antes de publicar."
    >
      <CampaignBuilder
        propertyData={property}
        brand={brand}
        mediaAnalysisJobId={params.analise}
      />
    </AppShell>
  );
}
