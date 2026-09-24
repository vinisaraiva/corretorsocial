import { BarChart3, Megaphone, MessageCircle, Trophy } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { campaigns } from "@/data/mock";

export default function ResultsPage() {
  return (
    <AppShell title="Resultados" description="Os números essenciais para saber o que está trazendo interessados.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Publicações" value="46" icon={Megaphone} helper="Últimos 30 dias" />
        <StatCard label="Cliques no WhatsApp" value="83" icon={MessageCircle} helper="+18% no período" />
        <StatCard label="Melhor campanha" value="24 cliques" icon={Trophy} helper="Apartamento Taperapuã" />
        <StatCard label="Rede com mais cliques" value="Instagram" icon={BarChart3} helper="44% dos cliques" />
      </div>

      <section className="app-card mt-6 overflow-hidden">
        <div className="border-b border-[#E4E7EC] p-5">
          <h2 className="font-extrabold">Campanhas recentes</h2>
        </div>
        <div className="divide-y divide-[#E4E7EC]">
          {campaigns.filter((campaign) => campaign.status === "publicada").map((campaign) => (
            <div key={campaign.id} className="grid gap-2 p-5 sm:grid-cols-[1fr_140px_140px] sm:items-center">
              <div>
                <div className="font-bold">{campaign.propertyTitle}</div>
                <div className="mt-1 text-sm text-[#667085]">{campaign.headline}</div>
              </div>
              <div className="text-sm text-[#667085]">{campaign.date}</div>
              <div className="text-sm font-extrabold text-[#176B5B]">{campaign.whatsappClicks ?? 0} cliques</div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
