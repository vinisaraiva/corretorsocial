"use client";

import { createClient } from "@/lib/supabase/client";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

async function readImageDimensions(file: File) {
  try {
    if (typeof createImageBitmap === "function") {
      const bitmap = await createImageBitmap(file);
      const dimensions = { width: bitmap.width, height: bitmap.height };
      bitmap.close();
      return dimensions;
    }
  } catch {
    // Fall through to the Image element fallback.
  }

  return new Promise<{ width: number | null; height: number | null }>(
    (resolve) => {
      const objectUrl = URL.createObjectURL(file);
      const image = new Image();

      const finish = (width: number | null, height: number | null) => {
        URL.revokeObjectURL(objectUrl);
        resolve({ width, height });
      };

      image.onload = () => finish(image.naturalWidth || null, image.naturalHeight || null);
      image.onerror = () => finish(null, null);
      image.src = objectUrl;
    },
  );
}

function assertImage(file: File, maxBytes: number) {
  if (!allowedTypes.has(file.type)) {
    throw new Error("Use imagens JPG, PNG ou WebP.");
  }

  if (file.size > maxBytes) {
    throw new Error(
      `A imagem ${file.name} ultrapassa o limite permitido.`,
    );
  }
}

export async function uploadProfileLogo(file: File) {
  assertImage(file, 5 * 1024 * 1024);

  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Sua sessão expirou. Entre novamente.");
  }

  const path = `${user.id}/logo`;

  const { error: uploadError } = await supabase.storage
    .from("profile-assets")
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
      cacheControl: "3600",
    });

  if (uploadError) {
    throw new Error("Não foi possível enviar o logo.");
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ logo_path: path })
    .eq("user_id", user.id);

  if (profileError) {
    await supabase.storage.from("profile-assets").remove([path]);
    throw new Error("O logo foi enviado, mas não conseguimos vinculá-lo ao perfil.");
  }

  const { data } = await supabase.storage
    .from("profile-assets")
    .createSignedUrl(path, 60 * 60);

  return {
    path,
    signedUrl: data?.signedUrl ?? null,
  };
}

export async function uploadPropertyPhotos(
  propertyId: string,
  files: File[],
) {
  const selected = files.slice(0, 20);

  if (selected.length === 0) return [];

  selected.forEach((file) => assertImage(file, 12 * 1024 * 1024));

  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Sua sessão expirou. Entre novamente.");
  }

  const uploadedPaths: string[] = [];

  try {
    for (const [index, file] of selected.entries()) {
      const dimensions = await readImageDimensions(file);
      const path = `${user.id}/${propertyId}/${crypto.randomUUID()}`;

      const { error: uploadError } = await supabase.storage
        .from("property-media")
        .upload(path, file, {
          contentType: file.type,
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Falha ao enviar ${file.name}.`);
      }

      uploadedPaths.push(path);

      const { error: rowError } = await supabase
        .from("property_media")
        .insert({
          property_id: propertyId,
          storage_path: path,
          media_type: "image",
          sort_order: index,
          is_cover: index === 0,
          width: dimensions.width,
          height: dimensions.height,
        });

      if (rowError) {
        throw new Error("Não foi possível registrar uma das fotos.");
      }
    }

    return uploadedPaths;
  } catch (error) {
    if (uploadedPaths.length > 0) {
      await supabase.storage.from("property-media").remove(uploadedPaths);
      await supabase
        .from("property_media")
        .delete()
        .eq("property_id", propertyId)
        .in("storage_path", uploadedPaths);
    }

    throw error;
  }
}
