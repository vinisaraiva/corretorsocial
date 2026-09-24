"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Link2 } from "lucide-react";

export function HomeCreate() {
  const router = useRouter();
  const [url, setUrl] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!url.trim()) return;
    router.push(`/imoveis/novo?url=${encodeURIComponent(url.trim())}`);
  }

  return (
    <section className="app-card overflow-hidden">
      <div className="border-b border-[#E4E7EC] px-5 py-5 sm:px-6">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#E9F4F1] px-3 py-1 text-xs font-bold text-[#176B5B]">
          <Link2 size={14} />
          Mais rápido
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Divulgue um imóvel
        </h2>
        <p className="mt-2 text-sm text-[#667085] sm:text-base">
          Cole o link. O restante fica por nossa conta.
        </p>
      </div>
      <form onSubmit={submit} className="p-5 sm:p-6">
        <label htmlFor="property-url" className="mb-2 block text-sm font-bold">
          Link do imóvel
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="property-url"
            type="url"
            required
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://seusite.com.br/imovel/..."
            className="app-input min-w-0 flex-1"
          />
          <button type="submit" className="app-button-primary shrink-0">
            Criar campanha
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/imoveis/novo?modo=fotos")}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-bold text-[#176B5B] hover:bg-[#F7F8FA]"
          >
            <ImagePlus size={18} />
            Enviar fotos manualmente
          </button>
          <span className="text-xs text-[#98A2B3]">
            Você sempre poderá revisar antes de publicar.
          </span>
        </div>
      </form>
    </section>
  );
}
