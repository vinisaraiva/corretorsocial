import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { NewPropertyFlow } from "@/components/new-property-flow";

export default function NewPropertyPage() {
  return (
    <AppShell title="Novo imóvel" description="Comece pelo link do anúncio ou escolha outra forma de cadastro.">
      <Suspense fallback={<div className="app-card p-6">Preparando...</div>}>
        <NewPropertyFlow />
      </Suspense>
    </AppShell>
  );
}
