import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PropertyCard } from "@/components/property-card";
import { properties } from "@/data/mock";

export default function PropertiesPage() {
  return (
    <AppShell
      title="Imóveis"
      description="Seus imóveis ficam salvos para você criar novas campanhas quando quiser."
      action={
        <Link href="/imoveis/novo" className="app-button-primary inline-flex items-center gap-2 text-sm">
          <Plus size={18} />
          Novo imóvel
        </Link>
      }
    >
      <div className="mb-5 flex flex-wrap gap-2">
        {["Todos", "Ativos", "Arquivados"].map((filter, index) => (
          <button
            key={filter}
            className={`min-h-10 rounded-full px-4 text-sm font-bold ${
              index === 0 ? "bg-[#176B5B] text-white" : "border border-[#E4E7EC] bg-white text-[#475467]"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {properties.map((property) => <PropertyCard key={property.id} property={property} />)}
      </div>
    </AppShell>
  );
}
