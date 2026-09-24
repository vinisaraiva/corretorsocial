import type { CampaignStatus, PropertyStatus } from "@/types";
import { cn } from "@/lib/utils";

const labels: Record<CampaignStatus | PropertyStatus, string> = {
  ativo: "Ativo",
  arquivado: "Arquivado",
  rascunho: "Rascunho",
  agendada: "Agendada",
  publicada: "Publicada",
  erro: "Erro",
};

export function StatusBadge({
  status,
}: {
  status: CampaignStatus | PropertyStatus;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold",
        status === "publicada" || status === "ativo"
          ? "bg-[#ECFDF3] text-[#067647]"
          : status === "agendada"
            ? "bg-[#EFF8FF] text-[#175CD3]"
            : status === "erro"
              ? "bg-[#FEF3F2] text-[#B42318]"
              : "bg-[#F2F4F7] text-[#475467]",
      )}
    >
      {labels[status]}
    </span>
  );
}
