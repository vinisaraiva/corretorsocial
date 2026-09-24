import { AppShell } from "@/components/app-shell";
import { OnboardingFlow } from "@/components/onboarding-flow";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const reviewMode = params.mode === "review";

  if (reviewMode) {
    return (
      <AppShell
        title="Configuração inicial"
        description="Revise seus dados, sua marca, sua área de atuação e as redes conectadas."
      >
        <OnboardingFlow reviewMode />
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
      <OnboardingFlow />
    </main>
  );
}
