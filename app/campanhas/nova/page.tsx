import { AppShell } from "@/components/app-shell";
import { CampaignBuilder } from "@/components/campaign-builder";

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ imovel?: string }>;
}) {
  const params = await searchParams;

  return (
    <AppShell
      title="Nova campanha"
      description="Revise a versão recomendada antes de publicar."
    >
      <CampaignBuilder propertyId={params.imovel} />
    </AppShell>
  );
}
