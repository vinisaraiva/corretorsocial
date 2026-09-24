import { AppShell } from "@/components/app-shell";
import { CampaignBuilder } from "@/components/campaign-builder";

export default function CampaignDetailPage() {
  return (
    <AppShell title="Campanha" description="Revise a versão recomendada ou publique diretamente.">
      <CampaignBuilder />
    </AppShell>
  );
}
