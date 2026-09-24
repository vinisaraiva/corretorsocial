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
  const property = properties[0];

  const [mode, setMode] = useState<Mode>(initialMode);
  const [stage, setStage] = useState<Stage>(initialUrl ? "loading" : "input");
  const [url, setUrl] = useState(initialUrl);
  const [uploadedPhotos, setUploadedPhotos] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState(0);
  const [draft, setDraft] = useState({
    title: property.title,
    price: property.price,
    location: property.location,
    city: property.city,
    bedrooms: property.bedrooms,
    suites: property.suites,
    parking: property.parking,
    area: property.area,
    description: property.description,
  });

  useEffect(() => {
    if (!initialUrl || stage !== "loading") return;
    const timeout = setTimeout(() => setStage("review"), 900);
    return () => clearTimeout(timeout);
  }, [initialUrl, stage]);

  function analyze() {
    setError("");

    if (mode === "link" && !url.trim()) {
      setError("Cole o link do imóvel para continuar.");
      return;
    }

    if (mode === "fotos" && !uploadedPhotos) {
      setError("Escolha as fotos do imóvel para continuar.");
      return;
    }

    if (mode === "manual" && (!draft.title.trim() || draft.price <= 0)) {
      setError("Preencha pelo menos o título e o preço do imóvel.");
      return;
    }

    setStage("loading");
    setTimeout(() => setStage("review"), 900);
  }

  function createCampaign() {
    setStage("ai");
    setActiveAnalysis(0);

    analysisSteps.forEach((_, index) => {
      setTimeout(() => setActiveAnalysis(index), index * 550);
    });

    setTimeout(
      () => router.push(`/campanhas/nova?imovel=${property.id}`),
      analysisSteps.length * 550 + 500,
    );
  }

  if (stage === "loading") {
    return (
      <div className="app-card flex min-h-[380px] flex-col items-center justify-center p-8 text-center">
        <LoaderCircle className="animate-spin text-[#176B5B]" size={34} />
        <h2 className="mt-5 text-xl font-extrabold">Lendo o imóvel...</h2>
        <p className="mt-2 max-w-md text-sm text-[#667085]">
          Estamos procurando fotos, preço, localização e características. Você
          poderá revisar tudo antes de continuar.
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
        <h2 className="text-center text-2xl font-extrabold">
          Criando sua campanha
        </h2>
        <p className="mt-2 text-center text-sm text-[#667085]">
          Você não precisa escolher nada agora. Estamos preparando uma versão
          recomendada.
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
              <span
                className={
                  index <= activeAnalysis ? "font-bold" : "text-[#667085]"
                }
              >
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
            <div
              className="min-h-72 bg-cover bg-center"
              style={{ backgroundImage: `url("${property.image}")` }}
              role="img"
              aria-label={draft.title}
            />

            <div className="p-5 sm:p-6">
              {editing ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Título"
                    value={draft.title}
                    onChange={(value) => setDraft({ ...draft, title: value })}
                  />
                  <NumberField
                    label="Preço"
                    value={draft.price}
                    onChange={(value) => setDraft({ ...draft, price: value })}
                  />
                  <Field
                    label="Bairro"
                    value={draft.location}
                    onChange={(value) =>
                      setDraft({ ...draft, location: value })
                    }
                  />
                  <Field
                    label="Cidade"
                    value={draft.city}
                    onChange={(value) => setDraft({ ...draft, city: value })}
                  />
                  <NumberField
                    label="Quartos"
                    value={draft.bedrooms}
                    onChange={(value) =>
                      setDraft({ ...draft, bedrooms: value })
                    }
                  />
                  <NumberField
                    label="Suítes"
                    value={draft.suites}
                    onChange={(value) =>
                      setDraft({ ...draft, suites: value })
                    }
                  />
                  <NumberField
                    label="Vagas"
                    value={draft.parking}
                    onChange={(value) =>
                      setDraft({ ...draft, parking: value })
                    }
                  />
                  <NumberField
                    label="Área (m²)"
                    value={draft.area}
                    onChange={(value) => setDraft({ ...draft, area: value })}
                  />
                  <label className="text-sm font-bold sm:col-span-2">
                    Descrição
                    <textarea
                      value={draft.description}
                      onChange={(event) =>
                        setDraft({ ...draft, description: event.target.value })
                      }
                      rows={4}
                      className="app-input mt-2 min-h-28 py-3"
                    />
                  </label>
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="app-button-primary"
                    >
                      Salvar alterações
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-xs font-bold uppercase tracking-wide text-[#176B5B]">
                    {property.purpose}
                  </div>
                  <h2 className="mt-2 text-2xl font-extrabold">
                    {draft.title}
                  </h2>
                  <p className="mt-1 text-sm text-[#667085]">
                    {draft.location} · {draft.city}
                  </p>
                  <p className="mt-4 text-2xl font-extrabold">
                    {formatBRL(draft.price)}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <Info label="Quartos" value={draft.bedrooms} />
                    <Info label="Suítes" value={draft.suites} />
                    <Info label="Vagas" value={draft.parking} />
                    <Info label="Área" value={`${draft.area} m²`} />
                  </div>

                  <p className="mt-5 text-sm leading-6 text-[#475467]">
                    {draft.description}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {property.highlights.map((highlight) => (
                      <span
                        key={highlight}
                        className="rounded-full bg-[#F2F4F7] px-3 py-1.5 text-xs font-semibold text-[#475467]"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {!editing && (
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="app-button-secondary inline-flex items-center justify-center gap-2"
            >
              <FilePenLine size={18} />
              Editar informações
            </button>
            <button
              type="button"
              onClick={createCampaign}
              className="app-button-primary"
            >
              Tudo certo — criar campanha
            </button>
          </div>
        )}
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
            onClick={() => {
              setMode(id);
              setError("");
            }}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-2 text-xs font-bold sm:text-sm ${
              mode === id
                ? "bg-white text-[#176B5B] shadow-sm"
                : "text-[#667085]"
            }`}
          >
            <Icon size={17} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-5 rounded-xl bg-[#FEF3F2] p-4 text-sm font-semibold text-[#B42318]">
          {error}
        </div>
      )}

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
        <div>
          <button
            type="button"
            onClick={() => setUploadedPhotos(true)}
            className={`flex min-h-56 w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-6 ${
              uploadedPhotos
                ? "border-[#176B5B] bg-[#E9F4F1]"
                : "border-[#98A2B3] bg-[#F9FAFB]"
            }`}
          >
            {uploadedPhotos ? (
              <CheckCircle2 size={30} className="text-[#067647]" />
            ) : (
              <ImagePlus size={30} className="text-[#176B5B]" />
            )}
            <strong>
              {uploadedPhotos
                ? "6 fotos selecionadas"
                : "Escolha as fotos do imóvel"}
            </strong>
            <span className="text-sm text-[#667085]">
              {uploadedPhotos
                ? "Clique novamente se quiser substituir a seleção."
                : "Nesta demonstração simulamos a seleção de imagens."}
            </span>
          </button>
        </div>
      )}

      {mode === "manual" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Título"
            value={draft.title}
            onChange={(value) => setDraft({ ...draft, title: value })}
          />
          <NumberField
            label="Preço"
            value={draft.price}
            onChange={(value) => setDraft({ ...draft, price: value })}
          />
          <Field
            label="Bairro"
            value={draft.location}
            onChange={(value) => setDraft({ ...draft, location: value })}
          />
          <Field
            label="Cidade"
            value={draft.city}
            onChange={(value) => setDraft({ ...draft, city: value })}
          />
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button type="button" onClick={analyze} className="app-button-primary">
          Continuar
        </button>
      </div>
    </section>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg bg-[#F9FAFB] p-3">
      <div className="text-xs text-[#667085]">{label}</div>
      <div className="mt-1 font-extrabold">{value}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm font-bold">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="app-input mt-2"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="text-sm font-bold">
      {label}
      <input
        type="number"
        min="0"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="app-input mt-2"
      />
    </label>
  );
}
