"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PropertyDraftInput } from "@/app/imoveis/novo/actions";

const restorableStatuses = new Set([
  "active",
  "paused",
  "sold",
  "rented",
]);

export async function archiveProperty(propertyId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: property, error: readError } = await supabase
    .from("properties")
    .select("id,status")
    .eq("id", propertyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (readError || !property) {
    throw new Error("Imóvel não encontrado.");
  }

  if (property.status === "archived") {
    return;
  }

  const { error } = await supabase
    .from("properties")
    .update({
      archived_from_status: property.status,
      status: "archived",
    })
    .eq("id", property.id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error("Não foi possível arquivar o imóvel.");
  }

  revalidatePath("/imoveis");
  revalidatePath(`/imoveis/${property.id}`);
}

export async function restoreProperty(propertyId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: property, error: readError } = await supabase
    .from("properties")
    .select("id,status,archived_from_status")
    .eq("id", propertyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (readError || !property) {
    throw new Error("Imóvel não encontrado.");
  }

  if (property.status !== "archived") {
    return;
  }

  const previous =
    property.archived_from_status &&
    restorableStatuses.has(property.archived_from_status)
      ? property.archived_from_status
      : "active";

  const { error } = await supabase
    .from("properties")
    .update({
      status: previous,
      archived_from_status: null,
    })
    .eq("id", property.id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error("Não foi possível restaurar o imóvel.");
  }

  revalidatePath("/imoveis");
  revalidatePath(`/imoveis/${property.id}`);
}

export async function deleteProperty(propertyId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id")
    .eq("id", propertyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (propertyError || !property) {
    throw new Error("Imóvel não encontrado.");
  }

  const { data: mediaRows, error: mediaError } = await supabase
    .from("property_media")
    .select("storage_path")
    .eq("property_id", property.id);

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id")
    .eq("property_id", property.id)
    .eq("user_id", user.id);

  const campaignIds = (campaigns ?? []).map((campaign) => campaign.id);

  let renderedPaths: string[] = [];

  if (campaignIds.length > 0) {
    const { data: renderedVariants } = await supabase
      .from("campaign_variants")
      .select("rendered_asset_path,render_metadata")
      .in("campaign_id", campaignIds);

    renderedPaths = Array.from(
      new Set(
        (renderedVariants ?? []).flatMap((variant) => {
          const metadata =
            variant.render_metadata &&
            typeof variant.render_metadata === "object" &&
            !Array.isArray(variant.render_metadata)
              ? (variant.render_metadata as Record<string, unknown>)
              : null;

          const paths = Array.isArray(metadata?.rendered_asset_paths)
            ? metadata.rendered_asset_paths.filter(
                (path): path is string => typeof path === "string",
              )
            : [];

          if (variant.rendered_asset_path) paths.push(variant.rendered_asset_path);
          return paths;
        }),
      ),
    ).filter((path) => path.startsWith(`${user.id}/`));
  }

  if (mediaError) {
    throw new Error("Não foi possível preparar a exclusão do imóvel.");
  }

  const storagePaths = (mediaRows ?? [])
    .map((item) => item.storage_path)
    .filter((path): path is string => Boolean(path));

  const { error: deleteError } = await supabase
    .from("properties")
    .delete()
    .eq("id", property.id)
    .eq("user_id", user.id);

  if (deleteError) {
    throw new Error("Não foi possível excluir o imóvel.");
  }

  if (storagePaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from("property-media")
      .remove(storagePaths);

    if (storageError) {
      console.error(
        "Property deleted but some storage files could not be removed",
        storageError,
      );
    }
  }

  if (renderedPaths.length > 0) {
    const { error: assetError } = await supabase.storage
      .from("campaign-assets")
      .remove(renderedPaths);

    if (assetError) {
      console.error(
        "Property deleted but rendered campaign assets could not be removed",
        assetError,
      );
    }
  }

  revalidatePath("/imoveis");
  revalidatePath("/campanhas");

  return { deleted: true };
}


export async function updateProperty(
  propertyId: string,
  input: PropertyDraftInput,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  if (!input.title.trim()) {
    throw new Error("Informe um título para o imóvel.");
  }

  const { data: property } = await supabase
    .from("properties")
    .select("id,status")
    .eq("id", propertyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!property) {
    throw new Error("Imóvel não encontrado.");
  }

  const { error } = await supabase
    .from("properties")
    .update({
      purpose: input.purpose === "Aluguel" ? "rent" : "sale",
      title: input.title.trim(),
      price: input.price || null,
      neighborhood: input.neighborhood.trim() || null,
      city: input.city.trim() || null,
      state: input.state?.trim() || null,
      public_location:
        [input.neighborhood, input.city].filter(Boolean).join(", ") || null,
      bedrooms: input.bedrooms || null,
      suites: input.suites || null,
      bathrooms: input.bathrooms || null,
      parking: input.parking || null,
      area_m2: input.area || null,
      description: input.description.trim() || null,
      highlights: input.highlights,
    })
    .eq("id", property.id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error("Não foi possível atualizar o imóvel.");
  }

  revalidatePath("/imoveis");
  revalidatePath(`/imoveis/${property.id}`);
  revalidatePath(`/imoveis/${property.id}/editar`);

  return { updated: true };
}

export async function setPropertyCover(
  propertyId: string,
  mediaId: string,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { error } = await supabase.rpc("set_property_cover", {
    p_property_id: propertyId,
    p_media_id: mediaId,
  });

  if (error) {
    throw new Error("Não foi possível definir a foto de capa.");
  }

  revalidatePath("/imoveis");
  revalidatePath(`/imoveis/${propertyId}`);
  revalidatePath(`/imoveis/${propertyId}/editar`);
}

export async function reorderPropertyMedia(
  propertyId: string,
  mediaIds: string[],
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { error } = await supabase.rpc("reorder_property_media", {
    p_property_id: propertyId,
    p_media_ids: mediaIds,
  });

  if (error) {
    throw new Error("Não foi possível alterar a ordem das fotos.");
  }

  revalidatePath(`/imoveis/${propertyId}`);
  revalidatePath(`/imoveis/${propertyId}/editar`);
}

export async function removePropertyMedia(
  propertyId: string,
  mediaId: string,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: storagePath, error } = await supabase.rpc(
    "remove_property_media",
    {
      p_property_id: propertyId,
      p_media_id: mediaId,
    },
  );

  if (error) {
    throw new Error("Não foi possível remover a foto.");
  }

  if (storagePath) {
    const { error: storageError } = await supabase.storage
      .from("property-media")
      .remove([storagePath]);

    if (storageError) {
      console.error(
        "Media row removed but storage file could not be deleted",
        storageError,
      );
    }
  }

  revalidatePath("/imoveis");
  revalidatePath(`/imoveis/${propertyId}`);
  revalidatePath(`/imoveis/${propertyId}/editar`);

  return { removed: true };
}


export async function enableAutomaticPropertyCover(propertyId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { error } = await supabase
    .from("properties")
    .update({ cover_manually_selected: false })
    .eq("id", propertyId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error("Não foi possível reativar a seleção automática de capa.");
  }

  revalidatePath("/imoveis");
  revalidatePath(`/imoveis/${propertyId}`);
  revalidatePath(`/imoveis/${propertyId}/editar`);
}
