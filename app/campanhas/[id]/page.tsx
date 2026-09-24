import { AppShell } from "@/components/app-shell";
import { CampaignBuilder } from "@/components/campaign-builder";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AppShell
      title="Campanha"
      description="Revise a versão recomendada ou publique diretamente."
    >
      <CampaignBuilder campaignId={id} />
    </AppShell>
  );
}
