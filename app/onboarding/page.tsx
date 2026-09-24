import { OnboardingFlow } from "@/components/onboarding-flow";

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-[#F7F8FA] px-5 py-8 sm:py-12">
      <div className="mx-auto mb-8 max-w-2xl">
        <div className="text-lg font-extrabold tracking-tight">
          Corretor <span className="text-[#176B5B]">Social</span>
        </div>
        <p className="mt-1 text-sm text-[#667085]">Vamos deixar tudo pronto em poucos minutos.</p>
      </div>
      <OnboardingFlow />
    </main>
  );
}
