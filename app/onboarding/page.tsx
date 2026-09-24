import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { OnboardingFlow } from "@/components/onboarding-flow";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const reviewMode = params.mode === "review";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "professional_name,creci,whatsapp,website,city,service_regions,primary_color",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const initialProfile = {
    professionalName: profile?.professional_name ?? "",
    creci: profile?.creci ?? "",
    whatsapp: profile?.whatsapp ?? "",
    website: profile?.website ?? "",
    city: profile?.city ?? "Porto Seguro - BA",
    serviceRegions: profile?.service_regions ?? [],
    primaryColor: profile?.primary_color ?? "#176B5B",
  };

  if (reviewMode) {
    return (
      <AppShell
        title="Configuração inicial"
        description="Revise seus dados, sua marca e sua área de atuação."
      >
        <OnboardingFlow
          reviewMode
          initialProfile={initialProfile}
        />
      </AppShell>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F8FA] px-5 py-8 sm:py-12">
      <div className="mx-auto mb-8 max-w-2xl">
        <div className="text-lg font-extrabold tracking-tight">
          Corretor <span className="text-[#176B5B]">Social</span>
        </div>
        <p className="mt-1 text-sm text-[#667085]">
          Vamos deixar tudo pronto em poucos minutos.
        </p>
      </div>

      <OnboardingFlow initialProfile={initialProfile} />
    </main>
  );
}
