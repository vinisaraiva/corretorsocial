import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { EditPropertyForm } from "@/components/edit-property-form";
import { createClient } from "@/lib/supabase/server";
import { resolvePrivateMedia } from "@/lib/property-ui";
import type { PropertyDraftInput } from "@/app/imoveis/novo/actions";

export const dynamic = "force-dynamic";

export default async function EditPropertyPage({
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

  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!property) {
    notFound();
  }

  const { data: mediaRows, error: mediaError } = await supabase
    .from("property_media")
    .select(
      "id,property_id,original_url,storage_path,is_cover,sort_order,width,height,ai_score,ai_tags",
    )
    .eq("property_id", property.id)
    .order("sort_order", { ascending: true });

  if (mediaError) {
    throw new Error("Não foi possível carregar a galeria do imóvel.");
  }

  const resolvedMedia = await resolvePrivateMedia(
    supabase,
    mediaRows ?? [],
  );

  const initialDraft: PropertyDraftInput = {
    title: property.title,
    purpose: property.purpose === "rent" ? "Aluguel" : "Venda",
    price: Number(property.price ?? 0),
    neighborhood: property.neighborhood ?? "",
    city: property.city ?? "",
    state: property.state ?? "",
    bedrooms: property.bedrooms ?? 0,
    suites: property.suites ?? 0,
    bathrooms: property.bathrooms ?? 0,
    parking: property.parking ?? 0,
    area: Number(property.area_m2 ?? 0),
    description: property.description ?? "",
    highlights: property.highlights ?? [],
  };

  const initialMedia = resolvedMedia
    .filter((item) => Boolean(item.original_url))
    .sort((a, b) => {
      if (a.is_cover && !b.is_cover) return -1;
      if (!a.is_cover && b.is_cover) return 1;
      return a.sort_order - b.sort_order;
    })
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

  return (
    <AppShell
      title="Editar imóvel"
      description="Atualize as informações e organize as fotos usadas nas próximas campanhas."
    >
      <EditPropertyForm
        propertyId={property.id}
        initialDraft={initialDraft}
        initialMedia={initialMedia}
        initialCoverManuallySelected={property.cover_manually_selected}
      />
    </AppShell>
  );
}
