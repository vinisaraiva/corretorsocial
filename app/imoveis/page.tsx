import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PropertyList } from "@/components/property-list";
import { properties } from "@/data/mock";

export default function PropertiesPage() {
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
