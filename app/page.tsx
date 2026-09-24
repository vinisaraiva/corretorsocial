import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Megaphone, MessageCircle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { HomeCreate } from "@/components/home-create";
import { PropertyCard } from "@/components/property-card";
import { StatCard } from "@/components/stat-card";
import { createClient } from "@/lib/supabase/server";
import { propertyToView, resolvePrivateMedia } from "@/lib/property-ui";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("professional_name,onboarding_completed")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed) {
    redirect("/onboarding");
  }

  const [
    propertyCountResult,
    campaignCountResult,
    trackingResult,
    recentResult,
  ] = await Promise.all([
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("tracking_links")
      .select("clicks")
      .eq("user_id", user.id),
    supabase
      .from("properties")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const recentRows = recentResult.data ?? [];
  const recentIds = recentRows.map((property) => property.id);

  let media: Array<{
    property_id: string;
    original_url: string | null;
    storage_path: string | null;
    is_cover: boolean;
    sort_order: number;
  }> = [];

  let propertyCampaigns: Array<{
    property_id: string;
    published_at: string | null;
  }> = [];

  if (recentIds.length > 0) {
    const [mediaResult, propertyCampaignResult] = await Promise.all([
      supabase
        .from("property_media")
        .select("property_id,original_url,storage_path,is_cover,sort_order")
        .in("property_id", recentIds),
      supabase
        .from("campaigns")
        .select("property_id,published_at")
        .in("property_id", recentIds),
    ]);

    media = await resolvePrivateMedia(supabase, mediaResult.data ?? []);
    propertyCampaigns = propertyCampaignResult.data ?? [];
  }

  const recentProperties = recentRows.map((row) =>
    propertyToView(row, media, propertyCampaigns),
  );

  const clicks = (trackingResult.data ?? []).reduce(
    (total, item) => total + item.clicks,
    0,
  );

  const firstName =
    profile.professional_name?.trim().split(/\s+/)[0] || "corretor";

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-[#176B5B]">
            Olá, {firstName}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
            O que vamos divulgar hoje?
          </h1>
        </div>

        <Link
          href="/onboarding?mode=review"
          className="text-sm font-bold text-[#667085] hover:text-[#176B5B]"
        >
          Rever configuração inicial
        </Link>
      </div>

      <HomeCreate />

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Imóveis"
          value={String(propertyCountResult.count ?? 0)}
          icon={Building2}
          helper="Salvos na sua conta"
        />
        <StatCard
          label="Campanhas"
          value={String(campaignCountResult.count ?? 0)}
          icon={Megaphone}
          helper="Rascunhos e agendamentos"
        />
        <StatCard
          label="Cliques no WhatsApp"
          value={String(clicks)}
          icon={MessageCircle}
          helper="Tracking acumulado"
        />
      </div>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold">Imóveis recentes</h2>
            <p className="mt-1 text-sm text-[#667085]">
              Continue uma campanha sem cadastrar tudo novamente.
            </p>
          </div>
          <Link
            href="/imoveis"
            className="text-sm font-bold text-[#176B5B]"
          >
            Ver todos
          </Link>
        </div>

        {recentProperties.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {recentProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="app-card p-8 text-center">
            <h3 className="font-extrabold">Nenhum imóvel cadastrado</h3>
            <p className="mt-2 text-sm text-[#667085]">
              Cole o link de um imóvel ou faça o primeiro cadastro manual.
            </p>
            <Link
              href="/imoveis/novo"
              className="app-button-primary mt-5 inline-flex"
            >
              Cadastrar imóvel
            </Link>
          </div>
        )}
      </section>
    </AppShell>
  );
}
