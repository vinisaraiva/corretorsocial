"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, LoaderCircle, RotateCcw } from "lucide-react";
import {
  archiveProperty,
  deleteProperty,
  restoreProperty,
} from "@/app/imoveis/actions";
import { ConfirmDestructiveAction } from "@/components/confirm-destructive-action";
import type { PropertyStatus } from "@/types";

export function PropertyActions({
  propertyId,
  propertyTitle,
  status,
  campaignCount,
}: {
  propertyId: string;
  propertyTitle: string;
  status: PropertyStatus;
  campaignCount: number;
}) {
  const router = useRouter();
  const [working, setWorking] = useState<"archive" | "restore" | null>(null);
  const [error, setError] = useState("");

  async function toggleArchive() {
    const mode = status === "arquivado" ? "restore" : "archive";
    setWorking(mode);
    setError("");

    try {
      if (mode === "restore") {
        await restoreProperty(propertyId);
      } else {
        await archiveProperty(propertyId);
      }

      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível atualizar o imóvel.",
      );
    } finally {
      setWorking(null);
    }
  }

  const deleteDescription =
    campaignCount > 0
      ? `O imóvel “${propertyTitle}” e suas ${campaignCount} campanha${campaignCount === 1 ? "" : "s"} serão removidos do Corretor Social. Esta ação não pode ser desfeita.`
      : `O imóvel “${propertyTitle}” será removido definitivamente do Corretor Social. Esta ação não pode ser desfeita.`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={working !== null}
        onClick={() => void toggleArchive()}
        className="app-button-secondary inline-flex min-h-10 items-center justify-center gap-2 px-3 text-sm"
      >
        {working ? (
          <LoaderCircle size={16} className="animate-spin" />
        ) : status === "arquivado" ? (
          <RotateCcw size={16} />
        ) : (
          <Archive size={16} />
        )}
        {status === "arquivado" ? "Restaurar" : "Arquivar"}
      </button>

      <ConfirmDestructiveAction
        triggerLabel="Excluir"
        title="Excluir imóvel definitivamente?"
        description={deleteDescription}
        confirmLabel="Excluir imóvel"
        requiredText="EXCLUIR"
        onConfirm={async () => {
          await deleteProperty(propertyId);
          router.push("/imoveis");
          router.refresh();
        }}
      />

      {error && (
        <div className="w-full text-xs font-semibold text-[#B42318]">
          {error}
        </div>
      )}
    </div>
  );
}
