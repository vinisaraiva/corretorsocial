import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PropertyList } from "@/components/property-list";
import { createClient } from "@/lib/supabase/server";
import { propertyToView, resolvePrivateMedia } from "@/lib/property-ui";

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: rows, error } = await supabase
    .from("properties")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Não foi possível carregar seus imóveis.");
  }

  const propertyRows = rows ?? [];
  const ids = propertyRows.map((property) => property.id);

  let media: Array<{
    property_id: string;
    original_url: string | null;
    storage_path: string | null;
    is_cover: boolean;
    sort_order: number;
  }> = [];

  let campaigns: Array<{
    property_id: string;
    published_at: string | null;
  }> = [];

  if (ids.length > 0) {
    const [mediaResult, campaignsResult] = await Promise.all([
      supabase
        .from("property_media")
        .select("property_id,original_url,storage_path,is_cover,sort_order")
        .in("property_id", ids),
      supabase
        .from("campaigns")
        .select("property_id,published_at")
        .in("property_id", ids),
    ]);

    media = await resolvePrivateMedia(supabase, mediaResult.data ?? []);
    campaigns = campaignsResult.data ?? [];
  }

  const properties = propertyRows.map((row) =>
    propertyToView(row, media, campaigns),
  );

  return (
    <AppShell
      title="Imóveis"
      description="Seus imóveis ficam salvos para você criar novas campanhas quando quiser."
      action={
        <Link
          href="/imoveis/novo"
          className="app-button-primary inline-flex items-center gap-2 text-sm"
        >
          <Plus size={18} />
          Novo imóvel
        </Link>
      }
    >
      <PropertyList properties={properties} />
    </AppShell>
  );
}
