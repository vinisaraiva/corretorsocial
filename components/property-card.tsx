import Image from "next/image";
import Link from "next/link";
import { MapPin, Megaphone } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { formatBRL } from "@/lib/utils";
import type { Property } from "@/types";

export function PropertyCard({ property }: { property: Property }) {
  return (
    <article className="app-card overflow-hidden">
      <div className="relative aspect-[16/9] bg-[#EAECF0]">
        <Image
          src={property.image}
          alt={property.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-extrabold">{property.title}</h3>
            <div className="mt-1 flex items-center gap-1 text-sm text-[#667085]">
              <MapPin size={15} />
              <span className="truncate">{property.location}</span>
            </div>
          </div>
          <StatusBadge status={property.status} />
        </div>
        <p className="mt-3 text-lg font-extrabold">
          {formatBRL(property.price)}
          {property.purpose === "Aluguel" && (
            <span className="text-xs font-medium text-[#667085]">/mês</span>
          )}
        </p>
        <div className="mt-3 flex items-center gap-2 text-xs text-[#667085]">
          <Megaphone size={15} />
          {property.campaigns} campanha{property.campaigns === 1 ? "" : "s"}
          {property.lastPublished && <span>· {property.lastPublished}</span>}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            href={`/imoveis/${property.id}`}
            className="app-button-secondary flex items-center justify-center text-sm"
          >
            Ver imóvel
          </Link>
          <Link
            href={`/campanhas/${property.id}`}
            className="app-button-primary flex items-center justify-center text-sm"
          >
            Criar campanha
          </Link>
        </div>
      </div>
    </article>
  );
}
