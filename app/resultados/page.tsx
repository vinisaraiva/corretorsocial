import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, Megaphone, MessageCircle, Trophy } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const providerLabels: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  google_business: "Google",
};

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Bahia",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default async function ResultsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [campaignsResult, linksResult] = await Promise.all([
    supabase
      .from("campaigns")
      .select(
        "id,property_id,marketing_angle,status,published_at,created_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("tracking_links")
      .select("campaign_id,provider,clicks,created_at")
      .eq("user_id", user.id),
  ]);

  if (campaignsResult.error || linksResult.error) {
    throw new Error("Não foi possível carregar os resultados.");
  }

  const allCampaigns = campaignsResult.data ?? [];
  const trackingLinks = linksResult.data ?? [];
  const allCampaignIds = allCampaigns.map((campaign) => campaign.id);
  const propertyIds = Array.from(
    new Set(allCampaigns.map((campaign) => campaign.property_id)),
  );

  const [variantsResult, propertiesResult] = await Promise.all([
    allCampaignIds.length
      ? supabase
          .from("campaign_variants")
          .select("id,campaign_id,provider")
          .in("campaign_id", allCampaignIds)
      : Promise.resolve({ data: [], error: null }),
    propertyIds.length
      ? supabase
          .from("properties")
          .select("id,title")
          .in("id", propertyIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (variantsResult.error || propertiesResult.error) {
    throw new Error("Não foi possível carregar os detalhes dos resultados.");
  }

  const variants = variantsResult.data ?? [];
  const variantIds = variants.map((variant) => variant.id);

  const publicationsResult = variantIds.length
    ? await supabase
        .from("publications")
        .select(
          "id,campaign_variant_id,status,published_at,external_post_id,external_url",
        )
        .in("campaign_variant_id", variantIds)
        .eq("status", "published")
        .gte("published_at", since)
        .order("published_at", { ascending: false })
    : { data: [], error: null };

  if (publicationsResult.error) {
    throw new Error("Não foi possível carregar as publicações.");
  }

  const publications = publicationsResult.data ?? [];
  const propertyTitle = new Map(
    (propertiesResult.data ?? []).map((property) => [
      property.id,
      property.title,
    ]),
  );
  const campaignById = new Map(
    allCampaigns.map((campaign) => [campaign.id, campaign]),
  );
  const variantById = new Map(
    variants.map((variant) => [variant.id, variant]),
  );

  const clicksByCampaign = new Map<string, number>();
  const clicksByProvider = new Map<string, number>();
  let totalClicks = 0;

  for (const link of trackingLinks) {
    const clicks = Number(link.clicks ?? 0);
    totalClicks += clicks;

    if (link.campaign_id) {
      clicksByCampaign.set(
        link.campaign_id,
        (clicksByCampaign.get(link.campaign_id) ?? 0) + clicks,
      );
    }

    if (link.provider) {
      clicksByProvider.set(
        link.provider,
        (clicksByProvider.get(link.provider) ?? 0) + clicks,
      );
    }
  }

  const bestCampaignEntry = Array.from(clicksByCampaign.entries()).sort(
    (a, b) => b[1] - a[1],
  )[0];
  const bestNetworkEntry = Array.from(clicksByProvider.entries()).sort(
    (a, b) => b[1] - a[1],
  )[0];

  const bestCampaign = bestCampaignEntry
    ? campaignById.get(bestCampaignEntry[0])
    : undefined;
  const bestCampaignTitle = bestCampaign
    ? propertyTitle.get(bestCampaign.property_id) ?? "Campanha"
    : "Ainda sem cliques";
  const bestNetworkShare =
    bestNetworkEntry && totalClicks > 0
      ? Math.round((bestNetworkEntry[1] / totalClicks) * 100)
      : 0;

  const publicationsByCampaign = new Map<string, number>();
  const latestPublicationByCampaign = new Map<string, string>();

  for (const publication of publications) {
    const variant = variantById.get(publication.campaign_variant_id);
    if (!variant) continue;

    publicationsByCampaign.set(
      variant.campaign_id,
      (publicationsByCampaign.get(variant.campaign_id) ?? 0) + 1,
    );

    if (publication.published_at) {
      const current = latestPublicationByCampaign.get(variant.campaign_id);

      if (
        !current ||
        new Date(publication.published_at).getTime() >
          new Date(current).getTime()
      ) {
        latestPublicationByCampaign.set(
          variant.campaign_id,
          publication.published_at,
        );
      }
    }
  }

  const recentCampaigns = Array.from(latestPublicationByCampaign.entries())
    .map(([campaignId, latestPublishedAt]) => ({
      campaign: campaignById.get(campaignId),
      latestPublishedAt,
    }))
    .filter(
      (
        item,
      ): item is {
        campaign: NonNullable<typeof item.campaign>;
        latestPublishedAt: string;
      } => Boolean(item.campaign),
    )
    .sort(
      (a, b) =>
        new Date(b.latestPublishedAt).getTime() -
        new Date(a.latestPublishedAt).getTime(),
    )
    .slice(0, 10);

  return (
    <AppShell
      title="Resultados"
      description="Publicações confirmadas dos últimos 30 dias e cliques acumulados nos links rastreáveis."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Publicações"
          value={String(publications.length)}
          icon={Megaphone}
          helper="Posts confirmados nos últimos 30 dias"
        />
        <StatCard
          label="Cliques no WhatsApp"
          value={String(totalClicks)}
          icon={MessageCircle}
          helper="Total acumulado nos links rastreáveis"
        />
        <StatCard
          label="Melhor campanha"
          value={
            bestCampaignEntry ? `${bestCampaignEntry[1]} cliques` : "Sem dados"
          }
          icon={Trophy}
          helper={bestCampaignTitle}
        />
        <StatCard
          label="Rede com mais cliques"
          value={
            bestNetworkEntry
              ? providerLabels[bestNetworkEntry[0]] ?? bestNetworkEntry[0]
              : "Sem dados"
          }
          icon={BarChart3}
          helper={
            bestNetworkEntry
              ? `${bestNetworkShare}% dos cliques rastreados`
              : "Ainda sem cliques rastreados"
          }
        />
      </div>

      <section className="app-card mt-6 overflow-hidden">
        <div className="border-b border-[#E4E7EC] p-5">
          <h2 className="font-extrabold">Campanhas com publicações recentes</h2>
        </div>

        {recentCampaigns.length === 0 ? (
          <div className="p-8 text-center">
            <div className="font-bold">Ainda não há publicações no período</div>
            <p className="mt-2 text-sm text-[#667085]">
              Quando o worker confirmar uma publicação, ela aparecerá aqui.
            </p>
            <Link
              href="/campanhas"
              className="app-button-secondary mt-5 inline-flex"
            >
              Ver campanhas
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#E4E7EC]">
            {recentCampaigns.map(({ campaign, latestPublishedAt }) => {
              const clicks = clicksByCampaign.get(campaign.id) ?? 0;
              const publicationCount =
                publicationsByCampaign.get(campaign.id) ?? 0;

              return (
                <Link
                  key={campaign.id}
                  href={`/campanhas/${campaign.id}`}
                  className="grid gap-2 p-5 transition hover:bg-[#F9FAFB] sm:grid-cols-[1fr_150px_120px_100px] sm:items-center"
                >
                  <div>
                    <div className="font-bold">
                      {propertyTitle.get(campaign.property_id) ?? "Imóvel"}
                    </div>
                    <div className="mt-1 text-sm text-[#667085]">
                      {campaign.marketing_angle ?? "Campanha publicada"}
                    </div>
                    {campaign.status === "failed" ? (
                      <div className="mt-1 text-xs font-semibold text-[#B42318]">
                        Houve falha em outra publicação desta campanha.
                      </div>
                    ) : null}
                  </div>
                  <div className="text-sm text-[#667085]">
                    {formatDate(latestPublishedAt)}
                  </div>
                  <div className="text-sm text-[#667085]">
                    {publicationCount === 1
                      ? "1 publicação"
                      : `${publicationCount} publicações`}
                  </div>
                  <div className="text-sm font-extrabold text-[#176B5B]">
                    {clicks} cliques
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </AppShell>
  );
}
