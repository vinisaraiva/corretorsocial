import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Megaphone, MessageCircle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { HomeCreate } from "@/components/home-create";
import { PropertyCard } from "@/components/property-card";
import { StatCard } from "@/components/stat-card";
import { properties } from "@/data/mock";
import { createClient } from "@/lib/supabase/server";

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
          label="Imóveis este mês"
          value="12"
          icon={Building2}
          helper="+3 em relação ao mês passado"
        />
        <StatCard
          label="Publicações"
          value="46"
          icon={Megaphone}
          helper="4 redes previstas"
        />
        <StatCard
          label="Cliques no WhatsApp"
          value="83"
          icon={MessageCircle}
          helper="Dados demonstrativos"
        />
      </div>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold">Imóveis recentes</h2>
            <p className="mt-1 text-sm text-[#667085]">
              Os dados abaixo ainda são demonstrativos até ligarmos o cadastro
              real de imóveis.
            </p>
          </div>
          <Link
            href="/imoveis"
            className="text-sm font-bold text-[#176B5B]"
          >
            Ver todos
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {properties.slice(0, 3).map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
