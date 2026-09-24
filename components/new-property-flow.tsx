"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  FilePenLine,
  ImagePlus,
  Link2,
  LoaderCircle,
  Sparkles,
} from "lucide-react";
import {
  createProperty,
  extractPropertyFromUrl,
  type PropertyDraftInput,
} from "@/app/imoveis/novo/actions";
import { formatBRL } from "@/lib/utils";

type Mode = "link" | "fotos" | "manual";
type Stage = "input" | "loading" | "review" | "saving" | "ai";

const analysisSteps = [
  "Organizando as informações do imóvel",
  "Preparando os principais destaques",
  "Criando a estrutura da campanha",
  "Preparando os textos por rede",
  "Montando a versão recomendada",
];

const emptyDraft: PropertyDraftInput = {
  title: "",
  purpose: "Venda",
  price: 0,
  neighborhood: "",
  city: "",
  state: "",
  bedrooms: 0,
  suites: 0,
  bathrooms: 0,
  parking: 0,
  area: 0,
  description: "",
  highlights: [],
  images: [],
};

export function NewPropertyFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = (searchParams.get("modo") as Mode | null) ?? "link";
  const initialUrl = searchParams.get("url") ?? "";

  const [mode, setMode] = useState<Mode>(initialMode);
  const [stage, setStage] = useState<Stage>("input");
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [extractionMessage, setExtractionMessage] = useState("");
  const [activeAnalysis, setActiveAnalysis] = useState(0);
  const [highlightsText, setHighlightsText] = useState("");
  const [draft, setDraft] = useState<PropertyDraftInput>(emptyDraft);

  useEffect(() => {
    if (!initialUrl) return;

    const timer = window.setTimeout(() => {
      void extractFromLink(initialUrl);
    }, 0);

    return () => window.clearTimeout(timer);
    // The initial URL is intentionally processed only once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUrl]);

  async function extractFromLink(link = url) {
    setError("");
    setExtractionMessage("");

    if (!link.trim()) {
      setError("Cole o link do imóvel para continuar.");
      return;
    }

    setStage("loading");

    try {
      const extracted = await extractPropertyFromUrl(link.trim());

      setDraft({
        title: extracted.title,
        purpose: extracted.purpose,
        price: extracted.price,
        neighborhood: extracted.neighborhood,
        city: extracted.city,
        state: extracted.state ?? "",
        bedrooms: extracted.bedrooms,
        suites: extracted.suites,
        bathrooms: extracted.bathrooms,
        parking: extracted.parking,
        area: extracted.area,
        description: extracted.description,
        highlights: extracted.highlights,
        sourceUrl: extracted.sourceUrl,
        images: extracted.images,
      });

      setHighlightsText(extracted.highlights.join(", "));
      setExtractionMessage(
        extracted.confidence === "high"
          ? "Encontramos boa parte das informações automaticamente."
          : extracted.confidence === "medium"
            ? "Encontramos parte das informações. Confira os campos antes de continuar."
            : "Encontramos poucos dados estruturados. Complete o que estiver faltando.",
      );
      setStage("review");
    } catch (caught) {
      setStage("input");
      setError(
        caught instanceof Error
          ? caught.message
          : "Não conseguimos ler esse link. Use o cadastro manual.",
      );
    }
  }

  function reviewManual() {
    setError("");

    if (!draft.title.trim()) {
      setError("Informe pelo menos o título do imóvel.");
      return;
    }

    setDraft({
      ...draft,
      highlights: highlightsText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    });
    setExtractionMessage("Cadastro manual pronto para revisão.");
    setStage("review");
  }

  async function persistProperty(goToCampaign: boolean) {
    setError("");
    setStage("saving");

    try {
      const id = await createProperty({
        ...draft,
        highlights: highlightsText
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });

      if (!goToCampaign) {
        router.push(`/imoveis/${id}`);
        router.refresh();
        return;
      }

      setStage("ai");
      setActiveAnalysis(0);

      analysisSteps.forEach((_, index) => {
        window.setTimeout(() => setActiveAnalysis(index), index * 450);
      });

      window.setTimeout(() => {
        router.push(`/campanhas/nova?imovel=${id}`);
        router.refresh();
      }, analysisSteps.length * 450 + 350);
    } catch (caught) {
      setStage("review");
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível salvar o imóvel.",
      );
    }
  }

  if (stage === "loading") {
    return (
      <div className="app-card flex min-h-[380px] flex-col items-center justify-center p-8 text-center">
        <LoaderCircle className="animate-spin text-[#176B5B]" size={34} />
        <h2 className="mt-5 text-xl font-extrabold">Lendo o imóvel...</h2>
        <p className="mt-2 max-w-md text-sm text-[#667085]">
          Estamos procurando os dados estruturados e as imagens públicas dessa
          página. Você poderá revisar tudo antes de salvar.
        </p>
      </div>
    );
  }

  if (stage === "saving") {
    return (
      <div className="app-card flex min-h-[320px] flex-col items-center justify-center p-8 text-center">
        <LoaderCircle className="animate-spin text-[#176B5B]" size={34} />
        <h2 className="mt-5 text-xl font-extrabold">Salvando imóvel...</h2>
        <p className="mt-2 text-sm text-[#667085]">
          Guardando as informações na sua conta.
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
          Preparando sua campanha
        </h2>
        <p className="mt-2 text-center text-sm text-[#667085]">
          Nesta fase a criação visual ainda é demonstrativa, mas o imóvel já foi
          salvo de verdade.
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
    const coverImage = draft.images?.[0];

    return (
      <div className="space-y-5">
        {error && (
          <div className="rounded-xl bg-[#FEF3F2] p-4 text-sm font-semibold text-[#B42318]">
            {error}
          </div>
        )}

        <div className="rounded-xl bg-[#E9F4F1] p-4 text-sm text-[#176B5B]">
          <strong>Revise antes de salvar.</strong> {extractionMessage}
        </div>

        <section className="app-card overflow-hidden">
          <div className="grid lg:grid-cols-[1.05fr_1fr]">
            <div className="min-h-72 bg-[#EAECF0]">
              {coverImage ? (
                <div
                  className="h-full min-h-72 bg-cover bg-center"
                  style={{ backgroundImage: `url("${coverImage}")` }}
                  role="img"
                  aria-label={draft.title || "Foto do imóvel"}
                />
              ) : (
                <div className="flex h-full min-h-72 items-center justify-center text-[#98A2B3]">
                  <div className="text-center">
                    <Building2 size={42} className="mx-auto" />
                    <p className="mt-2 text-sm font-semibold">
                      Nenhuma foto identificada
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 sm:p-6">
              {editing ? (
                <PropertyEditor
                  draft={draft}
                  highlightsText={highlightsText}
                  setDraft={setDraft}
                  setHighlightsText={setHighlightsText}
                  onDone={() => setEditing(false)}
                />
              ) : (
                <>
                  <div className="text-xs font-bold uppercase tracking-wide text-[#176B5B]">
                    {draft.purpose}
                  </div>

                  <h2 className="mt-2 text-2xl font-extrabold">
                    {draft.title || "Imóvel sem título"}
                  </h2>

                  <p className="mt-1 text-sm text-[#667085]">
                    {[draft.neighborhood, draft.city, draft.state]
                      .filter(Boolean)
                      .join(" · ") || "Localização não informada"}
                  </p>

                  <p className="mt-4 text-2xl font-extrabold">
                    {draft.price > 0
                      ? formatBRL(draft.price)
                      : "Preço sob consulta"}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <Info label="Quartos" value={draft.bedrooms || "—"} />
                    <Info label="Suítes" value={draft.suites || "—"} />
                    <Info label="Vagas" value={draft.parking || "—"} />
                    <Info
                      label="Área"
                      value={draft.area ? `${draft.area} m²` : "—"}
                    />
                  </div>

                  {draft.description && (
                    <p className="mt-5 text-sm leading-6 text-[#475467]">
                      {draft.description}
                    </p>
                  )}

                  {highlightsText.trim() && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {highlightsText
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean)
                        .map((highlight) => (
                          <span
                            key={highlight}
                            className="rounded-full bg-[#F2F4F7] px-3 py-1.5 text-xs font-semibold text-[#475467]"
                          >
                            {highlight}
                          </span>
                        ))}
                    </div>
                  )}

                  {draft.images && draft.images.length > 1 && (
                    <p className="mt-5 text-xs font-semibold text-[#667085]">
                      {draft.images.length} imagens públicas encontradas
                    </p>
                  )}
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
              onClick={() => void persistProperty(false)}
              className="app-button-secondary"
            >
              Salvar imóvel
            </button>

            <button
              type="button"
              onClick={() => void persistProperty(true)}
              className="app-button-primary"
            >
              Salvar e criar campanha
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
            Primeiro tentamos JSON-LD e metadados públicos. Sites que exigem
            JavaScript ou bloqueiam robôs poderão precisar do modo manual.
          </p>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => void extractFromLink()}
              className="app-button-primary"
            >
              Ler imóvel
            </button>
          </div>
        </div>
      )}

      {mode === "fotos" && (
        <div className="rounded-xl border border-dashed border-[#D0D5DD] bg-[#F9FAFB] p-8 text-center">
          <ImagePlus size={30} className="mx-auto text-[#176B5B]" />
          <h2 className="mt-3 font-extrabold">Upload de fotos</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#667085]">
            O Storage já está no planejamento, mas não vamos simular um upload
            como se ele estivesse persistindo. Use o cadastro manual por
            enquanto.
          </p>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className="app-button-secondary mt-5"
          >
            Cadastrar manualmente
          </button>
        </div>
      )}

      {mode === "manual" && (
        <>
          <PropertyEditor
            draft={draft}
            highlightsText={highlightsText}
            setDraft={setDraft}
            setHighlightsText={setHighlightsText}
          />

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={reviewManual}
              className="app-button-primary"
            >
              Revisar imóvel
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function PropertyEditor({
  draft,
  highlightsText,
  setDraft,
  setHighlightsText,
  onDone,
}: {
  draft: PropertyDraftInput;
  highlightsText: string;
  setDraft: React.Dispatch<React.SetStateAction<PropertyDraftInput>>;
  setHighlightsText: React.Dispatch<React.SetStateAction<string>>;
  onDone?: () => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-bold sm:col-span-2">
        Finalidade
        <select
          value={draft.purpose}
          onChange={(event) =>
            setDraft({
              ...draft,
              purpose: event.target.value as "Venda" | "Aluguel",
            })
          }
          className="app-input mt-2"
        >
          <option value="Venda">Venda</option>
          <option value="Aluguel">Aluguel</option>
        </select>
      </label>

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
        value={draft.neighborhood}
        onChange={(value) => setDraft({ ...draft, neighborhood: value })}
      />
      <Field
        label="Cidade"
        value={draft.city}
        onChange={(value) => setDraft({ ...draft, city: value })}
      />
      <Field
        label="Estado"
        value={draft.state ?? ""}
        onChange={(value) => setDraft({ ...draft, state: value })}
      />
      <NumberField
        label="Área (m²)"
        value={draft.area}
        onChange={(value) => setDraft({ ...draft, area: value })}
      />
      <NumberField
        label="Quartos"
        value={draft.bedrooms}
        onChange={(value) => setDraft({ ...draft, bedrooms: value })}
      />
      <NumberField
        label="Suítes"
        value={draft.suites}
        onChange={(value) => setDraft({ ...draft, suites: value })}
      />
      <NumberField
        label="Banheiros"
        value={draft.bathrooms}
        onChange={(value) => setDraft({ ...draft, bathrooms: value })}
      />
      <NumberField
        label="Vagas"
        value={draft.parking}
        onChange={(value) => setDraft({ ...draft, parking: value })}
      />

      <label className="text-sm font-bold sm:col-span-2">
        Diferenciais
        <input
          value={highlightsText}
          onChange={(event) => setHighlightsText(event.target.value)}
          placeholder="Ex.: perto da praia, varanda, piscina"
          className="app-input mt-2"
        />
        <span className="mt-1 block text-xs font-normal text-[#667085]">
          Separe por vírgulas.
        </span>
      </label>

      <label className="text-sm font-bold sm:col-span-2">
        Descrição
        <textarea
          value={draft.description}
          onChange={(event) =>
            setDraft({ ...draft, description: event.target.value })
          }
          rows={5}
          className="app-input mt-2 min-h-32 py-3"
        />
      </label>

      {onDone && (
        <div className="sm:col-span-2">
          <button
            type="button"
            onClick={onDone}
            className="app-button-primary"
          >
            Aplicar alterações
          </button>
        </div>
      )}
    </div>
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
