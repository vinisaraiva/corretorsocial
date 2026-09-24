import type { Tables } from "@/types/database";
import type { Property, PropertyStatus } from "@/types";

type PropertyRow = Tables<"properties">;

type MediaRow = Pick<
  Tables<"property_media">,
  "property_id" | "original_url" | "storage_path" | "is_cover" | "sort_order"
>;

type CampaignRow = Pick<Tables<"campaigns">, "property_id" | "published_at">;

const statusMap: Record<PropertyRow["status"], PropertyStatus> = {
  active: "ativo",
  paused: "pausado",
  sold: "vendido",
  rented: "alugado",
  archived: "arquivado",
};

export function propertyToView(
  row: PropertyRow,
  media: MediaRow[],
  campaigns: CampaignRow[],
): Property {
  const mediaForProperty = media
    .filter((item) => item.property_id === row.id)
    .sort((a, b) => {
      if (a.is_cover && !b.is_cover) return -1;
      if (!a.is_cover && b.is_cover) return 1;
      return a.sort_order - b.sort_order;
    });

  const image =
    mediaForProperty.find((item) => item.original_url)?.original_url ??
    undefined;

  const propertyCampaigns = campaigns.filter(
    (campaign) => campaign.property_id === row.id,
  );

  const lastPublished = propertyCampaigns
    .map((campaign) => campaign.published_at)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);

  return {
    id: row.id,
    title: row.title,
    purpose: row.purpose === "rent" ? "Aluguel" : "Venda",
    price: Number(row.price ?? 0),
    location: row.neighborhood ?? row.public_location ?? "Localização não informada",
    city: [row.city, row.state].filter(Boolean).join(" - "),
    bedrooms: row.bedrooms ?? 0,
    suites: row.suites ?? 0,
    bathrooms: row.bathrooms ?? 0,
    parking: row.parking ?? 0,
    area: Number(row.area_m2 ?? 0),
    description: row.description ?? "",
    highlights: row.highlights ?? [],
    image,
    status: statusMap[row.status],
    campaigns: propertyCampaigns.length,
    lastPublished: lastPublished
      ? new Intl.DateTimeFormat("pt-BR", {
          day: "2-digit",
          month: "short",
        }).format(new Date(lastPublished))
      : undefined,
  };
}
