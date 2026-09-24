"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function saveSettings(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const serviceRegions = String(formData.get("service_regions") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const { error } = await supabase
    .from("profiles")
    .update({
      professional_name: String(formData.get("professional_name") ?? "").trim(),
      agency_name: String(formData.get("agency_name") ?? "").trim() || null,
      creci: String(formData.get("creci") ?? "").trim() || null,
      whatsapp: String(formData.get("whatsapp") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      website: String(formData.get("website") ?? "").trim() || null,
      city: String(formData.get("city") ?? "").trim() || null,
      service_regions: serviceRegions,
      primary_color:
        String(formData.get("primary_color") ?? "#176B5B") || "#176B5B",
      secondary_color:
        String(formData.get("secondary_color") ?? "#18202A") || "#18202A",
      communication_tone:
        String(formData.get("communication_tone") ?? "professional") ||
        "professional",
      default_cta:
        String(formData.get("default_cta") ?? "Fale comigo no WhatsApp") ||
        "Fale comigo no WhatsApp",
      review_before_publish:
        String(formData.get("review_before_publish") ?? "") === "on",
    })
    .eq("user_id", user.id);

  if (error) {
    throw new Error("Não foi possível salvar suas configurações.");
  }

  revalidatePath("/");
  revalidatePath("/configuracoes");
}
