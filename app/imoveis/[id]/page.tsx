import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { formatBRL } from "@/lib/utils";
import { propertyToView } from "@/lib/property-ui";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PropertyDetailPage({
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

  const { data: row } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
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
      title={property.title}
      description={[property.location, property.city]
        .filter(Boolean)
        .join(" · ")}
      action={
        <Link
          href={`/campanhas/nova?imovel=${property.id}`}
          className="app-button-primary text-sm"
        >
          Criar nova campanha
        </Link>
      }
    >
      <section className="app-card overflow-hidden">
        <div className="grid lg:grid-cols-[1.1fr_1fr]">
          <div className="relative min-h-80 bg-[#EAECF0]">
            {property.image ? (
              <Image
                src={property.image}
                alt={property.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full min-h-80 items-center justify-center text-[#98A2B3]">
                <div className="text-center">
                  <Building2 size={42} className="mx-auto" />
                  <p className="mt-2 text-sm font-semibold">
                    Nenhuma foto importada
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs font-bold uppercase tracking-wide text-[#176B5B]">
                {property.purpose}
              </div>
              <StatusBadge status={property.status} />
            </div>

            <p className="mt-2 text-3xl font-extrabold">
              {property.price > 0
                ? formatBRL(property.price)
                : "Preço sob consulta"}
              {property.purpose === "Aluguel" && property.price > 0 && (
                <span className="text-sm font-medium text-[#667085]">
                  /mês
                </span>
              )}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Quartos", property.bedrooms || "—"],
                ["Suítes", property.suites || "—"],
                ["Vagas", property.parking || "—"],
                ["Área", property.area ? `${property.area} m²` : "—"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-[#F9FAFB] p-3">
                  <div className="text-xs text-[#667085]">{label}</div>
                  <div className="mt-1 font-extrabold">{value}</div>
                </div>
              ))}
            </div>

            {property.description && (
              <p className="mt-6 text-sm leading-6 text-[#475467]">
                {property.description}
              </p>
            )}

            {property.highlights.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {property.highlights.map((highlight) => (
                  <span
                    key={highlight}
                    className="rounded-full bg-[#E9F4F1] px-3 py-1.5 text-xs font-bold text-[#176B5B]"
                  >
                    {highlight}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
