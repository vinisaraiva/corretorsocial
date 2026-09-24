"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type OnboardingInput = {
  professionalName: string;
  creci: string;
  whatsapp: string;
  website: string;
  city: string;
  serviceRegions: string[];
  primaryColor: string;
};

export async function saveOnboarding(
  input: OnboardingInput,
  reviewMode = false,
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      professional_name: input.professionalName.trim(),
      creci: input.creci.trim() || null,
      whatsapp: input.whatsapp.trim() || null,
      website: input.website.trim() || null,
      city: input.city.trim() || null,
      service_regions: input.serviceRegions,
      primary_color: input.primaryColor,
      onboarding_completed: true,
    })
    .eq("user_id", user.id);

  if (error) {
    throw new Error("Não foi possível salvar sua configuração.");
  }

  redirect(reviewMode ? "/configuracoes" : "/");
}
