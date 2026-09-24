"use client";

import { useRef, useState } from "react";
import { CheckCircle2, ImagePlus, LoaderCircle } from "lucide-react";
import { uploadProfileLogo } from "@/lib/supabase/uploads";

export function LogoUploader({
  initialUrl,
}: {
  initialUrl?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(initialUrl ?? "");
  const [status, setStatus] = useState<"idle" | "uploading" | "saved" | "error">(
    initialUrl ? "saved" : "idle",
  );
  const [message, setMessage] = useState(
    initialUrl ? "Logo salvo" : "PNG, JPG ou WebP · até 5 MB",
  );

  async function onFile(file?: File) {
    if (!file) return;

    setStatus("uploading");
    setMessage("Enviando logo...");

    try {
      const localPreview = URL.createObjectURL(file);
      setPreview(localPreview);

      const result = await uploadProfileLogo(file);

      if (result.signedUrl) {
        setPreview(result.signedUrl);
      }

      setStatus("saved");
      setMessage("Logo salvo no seu perfil");
    } catch (caught) {
      setStatus("error");
      setMessage(
        caught instanceof Error ? caught.message : "Não foi possível enviar o logo.",
      );
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => void onFile(event.target.files?.[0])}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={status === "uploading"}
        className="flex min-h-40 w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border border-dashed border-[#D0D5DD] bg-[#F9FAFB] p-4 text-center disabled:cursor-wait"
      >
        {preview ? (
          <img
            src={preview}
            alt="Logo profissional"
            className="max-h-24 max-w-[220px] object-contain"
          />
        ) : status === "uploading" ? (
          <LoaderCircle className="animate-spin text-[#176B5B]" size={28} />
        ) : (
          <ImagePlus size={28} className="text-[#176B5B]" />
        )}

        <strong className="text-sm">
          {preview ? "Trocar logo" : "Enviar logo"}
        </strong>

        <span
          className={
            status === "error"
              ? "text-xs font-semibold text-[#B42318]"
              : status === "saved"
                ? "inline-flex items-center gap-1 text-xs font-semibold text-[#067647]"
                : "text-xs text-[#667085]"
          }
        >
          {status === "saved" && <CheckCircle2 size={14} />}
          {message}
        </span>
      </button>
    </div>
  );
}
