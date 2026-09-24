import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SettingsForm } from "@/components/settings-form";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: connections }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "professional_name,agency_name,creci,email,whatsapp,phone,website,city,service_regions,primary_color,secondary_color,communication_tone,default_cta,review_before_publish",
      )
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("social_connections")
      .select("provider,status")
      .eq("user_id", user.id),
  ]);

  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <AppShell
      title="Configurações"
      description="Deixe seu perfil pronto uma vez e reutilize em todas as campanhas."
    >
      <SettingsForm
        profile={profile}
        connections={connections ?? []}
      />
    </AppShell>
  );
}
