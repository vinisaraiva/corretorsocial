"use client";

import { useRouter } from "next/navigation";
import { ConfirmDestructiveAction } from "@/components/confirm-destructive-action";
import { deleteCampaign } from "@/app/campanhas/actions";

export function CampaignActions({
  campaignId,
  status,
}: {
  campaignId: string;
  status: string;
}) {
  const router = useRouter();

  const description =
    status === "published"
      ? "A campanha será removida do Corretor Social. Publicações que já foram enviadas para redes sociais não serão apagadas automaticamente."
      : status === "scheduled"
        ? "A campanha e o agendamento serão removidos do Corretor Social. Esta ação não pode ser desfeita."
        : "A campanha será removida definitivamente do Corretor Social. Esta ação não pode ser desfeita.";

  if (status === "publishing") {
    return (
      <span className="rounded-lg bg-[#F2F4F7] px-3 py-2 text-xs font-semibold text-[#667085]">
        Exclusão indisponível durante a publicação
      </span>
    );
  }

  return (
    <ConfirmDestructiveAction
      triggerLabel="Excluir campanha"
      title="Excluir esta campanha?"
      description={description}
      confirmLabel="Excluir campanha"
      onConfirm={async () => {
        await deleteCampaign(campaignId);
        router.push("/campanhas");
        router.refresh();
      }}
    />
  );
}
