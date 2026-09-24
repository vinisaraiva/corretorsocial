import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";
import {
  getCampaignTemplate,
  normalizeCampaignTemplate,
} from "@/lib/campaign-templates";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  generating: "Gerando",
  ready: "Pronta",
  scheduled: "Agendada",
  publishing: "Publicando",
  published: "Publicada",
  failed: "Erro",
};

const statusClasses: Record<string, string> = {
  ready: "bg-[#ECFDF3] text-[#067647]",
  scheduled: "bg-[#EFF8FF] text-[#175CD3]",
  published: "bg-[#ECFDF3] text-[#067647]",
  failed: "bg-[#FEF3F2] text-[#B42318]",
};

const providerLabels: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  google_business: "Google",
};

export default async function CampaignsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("id,property_id,status,marketing_angle,visual_style,scheduled_for,published_at,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Não foi possível carregar suas campanhas.");
  }

  const rows = campaigns ?? [];
  const propertyIds = [...new Set(rows.map((item) => item.property_id))];
  const campaignIds = rows.map((item) => item.id);

  const [propertiesResult, variantsResult] = await Promise.all([
    propertyIds.length
      ? supabase
          .from("properties")
          .select("id,title")
          .in("id", propertyIds)
      : Promise.resolve({ data: [] }),
    campaignIds.length
      ? supabase
          .from("campaign_variants")
          .select("campaign_id,provider,headline")
          .in("campaign_id", campaignIds)
      : Promise.resolve({ data: [] }),
  ]);

  const propertyTitle = new Map(
    (propertiesResult.data ?? []).map((item) => [item.id, item.title]),
  );

  return (
    <AppShell
      title="Campanhas"
      description="Acompanhe rascunhos, agendamentos e futuras publicações."
    >
      {rows.length === 0 ? (
        <div className="app-card p-8 text-center">
          <h2 className="font-extrabold">Nenhuma campanha ainda</h2>
          <p className="mt-2 text-sm text-[#667085]">
            Escolha um imóvel e crie sua primeira campanha.
          </p>
          <Link
            href="/imoveis"
            className="app-button-primary mt-5 inline-flex"
          >
            Escolher imóvel
          </Link>
        </div>
      ) : (
        <div className="app-card overflow-hidden">
          <div className="divide-y divide-[#E4E7EC]">
            {rows.map((campaign) => {
              const variants = (variantsResult.data ?? []).filter(
                (variant) => variant.campaign_id === campaign.id,
              );
              const headline =
                campaign.marketing_angle ??
                variants.find((variant) => variant.headline)?.headline ??
                "Campanha do imóvel";
              const channels = [
                ...new Set(
                  variants.map(
                    (variant) =>
                      providerLabels[variant.provider] ?? variant.provider,
                  ),
                ),
              ];
              const date =
                campaign.scheduled_for ??
                campaign.published_at ??
                campaign.created_at;
              const template = getCampaignTemplate(
                normalizeCampaignTemplate(campaign.visual_style),
              );

              return (
                <div
                  key={campaign.id}
                  className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                >
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                          statusClasses[campaign.status] ??
                          "bg-[#F2F4F7] text-[#475467]"
                        }`}
                      >
                        {statusLabels[campaign.status] ?? campaign.status}
                      </span>
                      <span className="text-xs text-[#667085]">
                        {new Intl.DateTimeFormat("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }).format(new Date(date))}
                      </span>
                    </div>

                    <h2 className="font-extrabold">
                      {propertyTitle.get(campaign.property_id) ?? "Imóvel"}
                    </h2>
                    <p className="mt-1 text-sm text-[#667085]">{headline}</p>
                    <p className="mt-2 text-xs text-[#667085]">
                      Arte: {template.name}
                      {channels.length > 0 ? ` · ${channels.join(" · ")}` : ""}
                    </p>
                  </div>

                  <Link
                    href={`/campanhas/${campaign.id}`}
                    className="app-button-secondary flex items-center justify-center text-sm"
                  >
                    Ver campanha
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AppShell>
  );
}
