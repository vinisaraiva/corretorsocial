import Image from "next/image";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { properties } from "@/data/mock";
import { formatBRL } from "@/lib/utils";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = properties.find((item) => item.id === id) ?? properties[0];

  return (
    <AppShell
      title={property.title}
      description={`${property.location} · ${property.city}`}
      action={<Link href={`/campanhas/${property.id}`} className="app-button-primary text-sm">Criar nova campanha</Link>}
    >
      <section className="app-card overflow-hidden">
        <div className="grid lg:grid-cols-[1.1fr_1fr]">
          <div className="relative min-h-80">
            <Image src={property.image} alt={property.title} fill className="object-cover" />
          </div>
          <div className="p-5 sm:p-7">
            <div className="text-xs font-bold uppercase tracking-wide text-[#176B5B]">{property.purpose}</div>
            <p className="mt-2 text-3xl font-extrabold">{formatBRL(property.price)}</p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Quartos", property.bedrooms],
                ["Suítes", property.suites],
                ["Vagas", property.parking],
                ["Área", `${property.area} m²`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-[#F9FAFB] p-3">
                  <div className="text-xs text-[#667085]">{label}</div>
                  <div className="mt-1 font-extrabold">{value}</div>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm leading-6 text-[#475467]">{property.description}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {property.highlights.map((highlight) => (
                <span key={highlight} className="rounded-full bg-[#E9F4F1] px-3 py-1.5 text-xs font-bold text-[#176B5B]">{highlight}</span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
