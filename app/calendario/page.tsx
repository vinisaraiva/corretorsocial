import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const providerLabels: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  google_business: "Google",
};

function publishProviders(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return [];
  }

  const raw = (metadata as Record<string, unknown>).publish_providers;

  return Array.isArray(raw)
    ? raw.filter((provider): provider is string => typeof provider === "string")
    : [];
}

function formatSchedule(value: string) {
  const date = new Date(value);

  return {
    day: new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Bahia",
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    }).format(date),
    time: new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Bahia",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date),
  };
}

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const now = new Date();
  const horizon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select(
      "id,property_id,marketing_angle,scheduled_for,generation_metadata,status",
    )
    .eq("user_id", user.id)
    .eq("status", "scheduled")
    .gte("scheduled_for", now.toISOString())
    .lt("scheduled_for", horizon.toISOString())
    .order("scheduled_for", { ascending: true });

  if (error) {
    throw new Error("Não foi possível carregar os agendamentos.");
  }

  const rows = (campaigns ?? []).filter(
    (campaign): campaign is typeof campaign & { scheduled_for: string } =>
      Boolean(campaign.scheduled_for),
  );

  const propertyIds = Array.from(
    new Set(rows.map((campaign) => campaign.property_id)),
  );

  const { data: properties } = propertyIds.length
    ? await supabase
        .from("properties")
        .select("id,title")
        .in("id", propertyIds)
    : { data: [] as Array<{ id: string; title: string }> };

  const titleByProperty = new Map(
    (properties ?? []).map((property) => [property.id, property.title]),
  );

  return (
    <AppShell
      title="Calendário"
      description="Veja as campanhas programadas para os próximos 7 dias."
    >
      <div className="app-card overflow-hidden">
        <div className="border-b border-[#E4E7EC] p-5">
          <div className="font-extrabold">Próximos 7 dias</div>
          <div className="mt-1 text-sm text-[#667085]">
            {rows.length === 1
              ? "1 campanha agendada"
              : `${rows.length} campanhas agendadas`}
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="p-8 text-center">
            <div className="font-bold">Nenhuma campanha agendada</div>
            <p className="mt-2 text-sm text-[#667085]">
              Quando você programar uma campanha, ela aparecerá aqui.
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
            {rows.map((campaign) => {
              const schedule = formatSchedule(campaign.scheduled_for);
              const providers = publishProviders(campaign.generation_metadata);
              const networkText =
                providers.length > 0
                  ? providers
                      .map((provider) => providerLabels[provider] ?? provider)
                      .join(" · ")
                  : "Somente calendário";

              return (
                <div
                  key={campaign.id}
                  className="grid min-h-24 gap-3 p-4 sm:grid-cols-[110px_1fr_80px] sm:items-center sm:p-5"
                >
                  <div className="text-sm font-bold capitalize">
                    {schedule.day}
                  </div>
                  <Link
                    href={`/campanhas/${campaign.id}`}
                    className="rounded-lg border border-[#E4E7EC] bg-[#F9FAFB] p-3 transition hover:border-[#98A2B3]"
                  >
                    <div className="text-sm font-semibold">
                      {titleByProperty.get(campaign.property_id) ?? "Imóvel"}
                    </div>
                    <div className="mt-1 text-xs text-[#667085]">
                      {networkText}
                    </div>
                    {campaign.marketing_angle ? (
                      <div className="mt-1 truncate text-xs text-[#667085]">
                        {campaign.marketing_angle}
                      </div>
                    ) : null}
                  </Link>
                  <div className="text-sm font-bold text-[#667085]">
                    {schedule.time}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
