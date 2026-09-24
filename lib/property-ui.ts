import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database";
import type { Property, PropertyStatus } from "@/types";

type PropertyRow = Tables<"properties">;

export type PropertyMediaRow = Pick<
  Tables<"property_media">,
  "property_id" | "original_url" | "storage_path" | "is_cover" | "sort_order"
> &
  Partial<
    Pick<
      Tables<"property_media">,
      "id" | "width" | "height" | "ai_score" | "ai_tags"
    >
  >;

type CampaignRow = Pick<Tables<"campaigns">, "property_id" | "published_at">;

const statusMap: Record<PropertyRow["status"], PropertyStatus> = {
  active: "ativo",
  paused: "pausado",
  sold: "vendido",
  rented: "alugado",
  archived: "arquivado",
};

export async function resolvePrivateMedia(
  supabase: SupabaseClient<Database>,
  media: PropertyMediaRow[],
) {
  const storagePaths = media
    .map((item) => item.storage_path)
    .filter((path): path is string => Boolean(path));

  if (storagePaths.length === 0) return media;

  const { data } = await supabase.storage
    .from("property-media")
    .createSignedUrls(storagePaths, 60 * 60);

  const signedByPath = new Map<string, string>();

  data?.forEach((entry) => {
    if (entry.path && entry.signedUrl) {
      signedByPath.set(entry.path, entry.signedUrl);
    }
  });

  return media.map((item) => ({
    ...item,
    original_url:
      item.original_url ??
      (item.storage_path ? signedByPath.get(item.storage_path) ?? null : null),
  }));
}

export function propertyToView(
  row: PropertyRow,
  media: PropertyMediaRow[],
  campaigns: CampaignRow[],
): Property {
  const mediaForProperty = media
    .filter((item) => item.property_id === row.id)
    .sort((a, b) => {
      if (a.is_cover && !b.is_cover) return -1;
      if (!a.is_cover && b.is_cover) return 1;
      return a.sort_order - b.sort_order;
    });

  const images = Array.from(
    new Set(
      mediaForProperty
        .map((item) => item.original_url)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const image = images[0];

  const mediaView = mediaForProperty
    .filter((item) => Boolean(item.original_url))
    .map((item) => ({
      id: item.id,
      url: item.original_url!,
      width: item.width ?? null,
      height: item.height ?? null,
      aiScore:
        item.ai_score === null || item.ai_score === undefined
          ? null
          : Number(item.ai_score),
      aiTags: item.ai_tags ?? [],
      isCover: item.is_cover,
      sortOrder: item.sort_order,
    }));

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
    location:
      row.neighborhood ??
      row.public_location ??
      "Localização não informada",
    city: [row.city, row.state].filter(Boolean).join(" - "),
    bedrooms: row.bedrooms ?? 0,
    suites: row.suites ?? 0,
    bathrooms: row.bathrooms ?? 0,
    parking: row.parking ?? 0,
    area: Number(row.area_m2 ?? 0),
    description: row.description ?? "",
    highlights: row.highlights ?? [],
    image,
    images,
    media: mediaView,
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
