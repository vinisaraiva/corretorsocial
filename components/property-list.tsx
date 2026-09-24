"use client";

import { useMemo, useState } from "react";
import { PropertyCard } from "@/components/property-card";
import type { Property } from "@/types";

type Filter = "todos" | "ativos" | "arquivados";

const filters: { id: Filter; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "ativos", label: "Ativos" },
  { id: "arquivados", label: "Arquivados" },
];

export function PropertyList({ properties }: { properties: Property[] }) {
  const [filter, setFilter] = useState<Filter>("todos");

  const visible = useMemo(() => {
    if (filter === "todos") return properties;
    if (filter === "ativos") {
      return properties.filter((property) => property.status === "ativo");
    }
    return properties.filter((property) => property.status === "arquivado");
  }, [filter, properties]);

  return (
    <>
      <div className="mb-5 flex flex-wrap gap-2" aria-label="Filtrar imóveis">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={filter === item.id}
            onClick={() => setFilter(item.id)}
            className={`min-h-10 rounded-full px-4 text-sm font-bold ${
              filter === item.id
                ? "bg-[#176B5B] text-white"
                : "border border-[#E4E7EC] bg-white text-[#475467]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {visible.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <div className="app-card p-8 text-center">
          <h2 className="font-extrabold">Nenhum imóvel aqui</h2>
          <p className="mt-2 text-sm text-[#667085]">
            Quando houver imóveis neste status, eles aparecerão nesta lista.
          </p>
        </div>
      )}
    </>
  );
}
