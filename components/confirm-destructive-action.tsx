"use client";

import { useState } from "react";
import { AlertTriangle, LoaderCircle, Trash2, X } from "lucide-react";

export function ConfirmDestructiveAction({
  triggerLabel,
  title,
  description,
  confirmLabel,
  requiredText,
  onConfirm,
}: {
  triggerLabel: string;
  title: string;
  description: string;
  confirmLabel: string;
  requiredText?: string;
  onConfirm: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  const canConfirm = !requiredText || typed === requiredText;

  async function confirm() {
    if (!canConfirm || working) return;

    setWorking(true);
    setError("");

    try {
      await onConfirm();
      setOpen(false);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível concluir esta ação.",
      );
    } finally {
      setWorking(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setTyped("");
          setError("");
          setOpen(true);
        }}
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#FDA29B] bg-white px-3 text-sm font-bold text-[#B42318] transition hover:bg-[#FEF3F2]"
      >
        <Trash2 size={16} />
        {triggerLabel}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="destructive-action-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FEF3F2] text-[#B42318]">
                <AlertTriangle size={20} />
              </div>
              <button
                type="button"
                onClick={() => !working && setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#667085] hover:bg-[#F2F4F7]"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <h2
              id="destructive-action-title"
              className="mt-4 text-lg font-extrabold text-[#18202A]"
            >
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#667085]">
              {description}
            </p>

            {requiredText && (
              <label className="mt-4 block text-sm font-bold text-[#344054]">
                Digite <strong>{requiredText}</strong> para confirmar
                <input
                  className="app-input mt-2"
                  value={typed}
                  autoComplete="off"
                  onChange={(event) => setTyped(event.target.value)}
                />
              </label>
            )}

            {error && (
              <div className="mt-4 rounded-lg bg-[#FEF3F2] p-3 text-sm font-semibold text-[#B42318]">
                {error}
              </div>
            )}

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={working}
                onClick={() => setOpen(false)}
                className="app-button-secondary min-h-10 px-4 text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!canConfirm || working}
                onClick={() => void confirm()}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#B42318] px-4 text-sm font-bold text-white transition hover:bg-[#912018] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {working && <LoaderCircle size={16} className="animate-spin" />}
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
