"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  revalidatePath("/imoveis");
  revalidatePath("/campanhas");

  return { deleted: true };
}
