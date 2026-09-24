import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CampaignBuilder } from "@/components/campaign-builder";
import { createClient } from "@/lib/supabase/server";
import { propertyToView } from "@/lib/property-ui";

export const dynamic = "force-dynamic";

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ imovel?: string }>;
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

  const [mediaResult, campaignsResult] = await Promise.all([
    supabase
      .from("property_media")
      .select("property_id,original_url,storage_path,is_cover,sort_order")
      .eq("property_id", row.id),
    supabase
      .from("campaigns")
      .select("property_id,published_at")
      .eq("property_id", row.id),
  ]);

  const property = propertyToView(
    row,
    mediaResult.data ?? [],
    campaignsResult.data ?? [],
  );

  return (
    <AppShell
      title="Nova campanha"
      description="Revise a versão recomendada antes de publicar."
    >
      <CampaignBuilder propertyData={property} />
    </AppShell>
  );
}
