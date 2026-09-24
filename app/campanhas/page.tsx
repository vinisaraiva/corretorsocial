import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { campaigns, channelLabels } from "@/data/mock";

export default function CampaignsPage() {
  return (
    <AppShell title="Campanhas" description="Acompanhe o que está pronto, agendado ou já publicado.">
      <div className="app-card overflow-hidden">
        <div className="divide-y divide-[#E4E7EC]">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <StatusBadge status={campaign.status} />
                  <span className="text-xs text-[#667085]">{campaign.date}</span>
                </div>
                <h2 className="font-extrabold">{campaign.propertyTitle}</h2>
                <p className="mt-1 text-sm text-[#667085]">{campaign.headline}</p>
                <p className="mt-2 text-xs text-[#667085]">
                  {campaign.channels.map((channel) => channelLabels[channel]).join(" · ")}
                  {campaign.whatsappClicks !== undefined && ` · ${campaign.whatsappClicks} cliques no WhatsApp`}
                </p>
              </div>
              <Link href={`/campanhas/${campaign.propertyId}`} className="app-button-secondary flex items-center justify-center text-sm">
                Ver campanha
              </Link>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
