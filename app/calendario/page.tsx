import { AppShell } from "@/components/app-shell";

const days = [
  ["Seg, 21", "Instagram · Apartamento Taperapuã", "18:00"],
  ["Ter, 22", "", ""],
  ["Qua, 23", "Facebook · Casa Arraial d'Ajuda", "12:30"],
  ["Qui, 24", "TikTok · Apartamento Taperapuã", "19:00"],
  ["Sex, 25", "Google · Casa Arraial d'Ajuda", "10:00"],
];

export default function CalendarPage() {
  return (
    <AppShell title="Calendário" description="Veja o que será publicado nos próximos dias.">
      <div className="app-card overflow-hidden">
        <div className="border-b border-[#E4E7EC] p-5">
          <div className="font-extrabold">Esta semana</div>
          <div className="mt-1 text-sm text-[#667085]">4 publicações agendadas</div>
        </div>
        <div className="divide-y divide-[#E4E7EC]">
          {days.map(([day, content, time]) => (
            <div key={day} className="grid min-h-20 gap-3 p-4 sm:grid-cols-[100px_1fr_80px] sm:items-center sm:p-5">
              <div className="text-sm font-bold">{day}</div>
              {content ? (
                <div className="rounded-lg border border-[#E4E7EC] bg-[#F9FAFB] p-3 text-sm font-semibold">{content}</div>
              ) : (
                <div className="text-sm text-[#98A2B3]">Nenhuma publicação agendada</div>
              )}
              <div className="text-sm font-bold text-[#667085]">{time}</div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
