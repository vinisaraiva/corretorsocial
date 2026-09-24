"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  FilePenLine,
  ImagePlus,
  Link2,
  LoaderCircle,
  Sparkles,
} from "lucide-react";
import { properties } from "@/data/mock";
import { formatBRL } from "@/lib/utils";

type Mode = "link" | "fotos" | "manual";
type Stage = "input" | "loading" | "review" | "ai";

const analysisSteps = [
  "Analisando as informações do imóvel",
  "Selecionando as melhores fotos",
  "Identificando os principais destaques",
  "Preparando os textos",
  "Adaptando para cada rede",
];

export function NewPropertyFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = (searchParams.get("modo") as Mode | null) ?? "link";
  const initialUrl = searchParams.get("url") ?? "";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [stage, setStage] = useState<Stage>(initialUrl ? "loading" : "input");
  const [url, setUrl] = useState(initialUrl);
  const [activeAnalysis, setActiveAnalysis] = useState(0);
  const property = properties[0];

  useEffect(() => {
    if (!initialUrl || stage !== "loading") return;
    const timeout = setTimeout(() => setStage("review"), 900);
    return () => clearTimeout(timeout);
  }, [initialUrl, stage]);

  function analyze() {
    if (mode === "link" && !url.trim()) return;
    setStage("loading");
    setTimeout(() => setStage("review"), 900);
  }

  function createCampaign() {
    setStage("ai");
    setActiveAnalysis(0);
    analysisSteps.forEach((_, index) => {
      setTimeout(() => setActiveAnalysis(index), index * 550);
    });
    setTimeout(() => router.push("/campanhas/nova?imovel=apt-taperapua"), analysisSteps.length * 550 + 500);
  }

  if (stage === "loading") {
    return (
      <div className="app-card flex min-h-[380px] flex-col items-center justify-center p-8 text-center">
        <LoaderCircle className="animate-spin text-[#176B5B]" size={34} />
        <h2 className="mt-5 text-xl font-extrabold">Lendo o imóvel...</h2>
        <p className="mt-2 max-w-md text-sm text-[#667085]">
          Estamos procurando fotos, preço, localização e características. Você poderá revisar tudo antes de continuar.
        </p>
      </div>
    );
  }

  if (stage === "ai") {
    return (
      <div className="app-card mx-auto max-w-2xl p-6 sm:p-8">
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#E9F4F1] text-[#176B5B]">
          <Sparkles size={24} />
        </div>
        <h2 className="text-center text-2xl font-extrabold">Criando sua campanha</h2>
        <p className="mt-2 text-center text-sm text-[#667085]">
          Você não precisa escolher nada agora. Estamos preparando uma versão recomendada.
        </p>
        <div className="mt-7 space-y-3">
          {analysisSteps.map((step, index) => (
            <div
              key={step}
              className="flex items-center gap-3 rounded-xl border border-[#E4E7EC] bg-white p-4"
            >
              {index <= activeAnalysis ? (
                <CheckCircle2 size={20} className="shrink-0 text-[#067647]" />
              ) : (
                <div className="h-5 w-5 shrink-0 rounded-full border-2 border-[#D0D5DD]" />
              )}
              <span className={index <= activeAnalysis ? "font-bold" : "text-[#667085]"}>
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (stage === "review") {
    return (
      <div className="space-y-5">
        <div className="rounded-xl bg-[#E9F4F1] p-4 text-sm text-[#176B5B]">
          <strong>Encontramos estas informações.</strong> Está tudo certo?
        </div>
        <section className="app-card overflow-hidden">
          <div className="grid lg:grid-cols-[1.05fr_1fr]">
            <div className="min-h-72 bg-cover bg-center" style={{ backgroundImage: `url("${property.image}")` }} />
            <div className="p-5 sm:p-6">
              <div className="text-xs font-bold uppercase tracking-wide text-[#176B5B]">
                {property.purpose}
              </div>
              <h2 className="mt-2 text-2xl font-extrabold">{property.title}</h2>
              <p className="mt-1 text-sm text-[#667085]">{property.location} · {property.city}</p>
              <p className="mt-4 text-2xl font-extrabold">{formatBRL(property.price)}</p>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <Info label="Quartos" value={property.bedrooms} />
                <Info label="Suítes" value={property.suites} />
                <Info label="Vagas" value={property.parking} />
                <Info label="Área" value={`${property.area} m²`} />
              </div>
              <p className="mt-5 text-sm leading-6 text-[#475467]">{property.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {property.highlights.map((highlight) => (
                  <span key={highlight} className="rounded-full bg-[#F2F4F7] px-3 py-1.5 text-xs font-semibold text-[#475467]">
                    {highlight}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button className="app-button-secondary inline-flex items-center justify-center gap-2">
            <FilePenLine size={18} />
            Editar informações
          </button>
          <button onClick={createCampaign} className="app-button-primary">
            Tudo certo — criar campanha
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="app-card p-5 sm:p-6">
      <div className="mb-6 grid grid-cols-3 gap-2 rounded-xl bg-[#F2F4F7] p-1">
        {[
          { id: "link" as Mode, label: "Colar link", icon: Link2 },
          { id: "fotos" as Mode, label: "Enviar fotos", icon: ImagePlus },
          { id: "manual" as Mode, label: "Manual", icon: FilePenLine },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-2 text-xs font-bold sm:text-sm ${
              mode === id ? "bg-white text-[#176B5B] shadow-sm" : "text-[#667085]"
            }`}
          >
            <Icon size={17} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {mode === "link" && (
        <div>
          <label className="text-sm font-bold">
            Link do imóvel
            <input
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://seusite.com.br/imovel/..."
              className="app-input mt-2"
            />
          </label>
          <p className="mt-2 text-xs text-[#667085]">
            Vamos tentar recuperar fotos e informações automaticamente.
          </p>
        </div>
      )}

      {mode === "fotos" && (
        <button
          type="button"
          className="flex min-h-56 w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#98A2B3] bg-[#F9FAFB] p-6"
        >
          <ImagePlus size={30} className="text-[#176B5B]" />
          <strong>Escolha as fotos do imóvel</strong>
          <span className="text-sm text-[#667085]">Depois você preencherá só as informações essenciais.</span>
        </button>
      )}

      {mode === "manual" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold">Título<input className="app-input mt-2" placeholder="Apartamento em Taperapuã" /></label>
          <label className="text-sm font-bold">Preço<input className="app-input mt-2" placeholder="R$ 790.000" /></label>
          <label className="text-sm font-bold">Bairro<input className="app-input mt-2" placeholder="Taperapuã" /></label>
          <label className="text-sm font-bold">Cidade<input className="app-input mt-2" placeholder="Porto Seguro - BA" /></label>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button onClick={analyze} className="app-button-primary">
          Continuar
        </button>
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-[#F9FAFB] p-3">
      <div className="text-xs text-[#667085]">{label}</div>
      <div className="mt-1 font-extrabold">{value}</div>
    </div>
  );
}
