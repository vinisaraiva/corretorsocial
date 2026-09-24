import { AppShell } from "@/components/app-shell";
import { SettingsForm } from "@/components/settings-form";

export default function SettingsPage() {
  return (
    <AppShell title="Configurações" description="Deixe seu perfil pronto uma vez e reutilize em todas as campanhas.">
      <SettingsForm />
    </AppShell>
  );
}
