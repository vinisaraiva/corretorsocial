"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  LoaderCircle,
  MessageCircle,
  Save,
  Sparkles,
  WandSparkles,
  X,
} from "lucide-react";
import {
  saveCampaignDraft,
  scheduleCampaignDraft,
  type CampaignDraftInput,
} from "@/app/campanhas/actions";
import { formatBRL } from "@/lib/utils";
import type { Property, SocialChannel } from "@/types";

const allChannels: { id: SocialChannel; label: string }[] = [
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "tiktok", label: "TikTok" },
  { id: "google", label: "Google" },
];

const styles = [
  ["Essencial", "Limpo, claro e universal"],
  ["Destaque", "Foto em primeiro plano"],
  ["Oportunidade", "Preço em evidência"],
  ["Alto padrão", "Minimalista e sofisticado"],
] as const;

const stagingStyles = [
  "Moderno",
  "Minimalista",
  "Clássico",
  "Praiano",
] as const;

function toLocalDateTimeInput(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

type InitialCampaign = {
  id: string;
  visualStyle: string;
  headline: string;
  cta: string;
  status: string;
  scheduledFor?: string | null;
  captions?: Partial<Record<SocialChannel, string>>;
};

export function CampaignBuilder({
  propertyData,
  campaignData,
}: {
  propertyData: Property;
  campaignData?: InitialCampaign;
}) {
  const property = propertyData;

  const generatedCaptions = useMemo(
    () => ({
      instagram: `${property.title}: ${property.description || "Conheça este imóvel."} Fale comigo para saber mais.`,
      facebook: `${property.title}, ${property.location}. ${property.description || "Entre em contato para conhecer os detalhes."}`,
      tiktok: `Você moraria aqui? Conheça ${property.title.toLowerCase()} em ${property.location}.`,
      google: `${property.title} em ${property.location}${property.city ? `, ${property.city}` : ""}. ${property.bedrooms ? `${property.bedrooms} quartos` : "Veja os detalhes"}${property.area ? ` e ${property.area} m²` : ""}.`,
    }),
    [property],
  );

  const [persistedCampaignId, setPersistedCampaignId] = useState(
    campaignData?.id,
  );
  const [channel, setChannel] = useState<SocialChannel>("instagram");
  const [adjusting, setAdjusting] = useState(false);
  const [style, setStyle] = useState(campaignData?.visualStyle ?? "Destaque");
  const [headline, setHeadline] = useState(
    campaignData?.headline ?? property.highlights[0] ?? property.title,
  );
  const [cta, setCta] = useState(
    campaignData?.cta ?? "Fale comigo no WhatsApp",
  );
  const [captions, setCaptions] = useState<Record<SocialChannel, string>>({
    instagram:
      campaignData?.captions?.instagram ?? generatedCaptions.instagram,
    facebook:
      campaignData?.captions?.facebook ?? generatedCaptions.facebook,
    tiktok: campaignData?.captions?.tiktok ?? generatedCaptions.tiktok,
    google: campaignData?.captions?.google ?? generatedCaptions.google,
  });
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduledFor, setScheduledFor] = useState(
    toLocalDateTimeInput(campaignData?.scheduledFor),
  );
  const [status, setStatus] = useState(campaignData?.status ?? "draft");
  const [working, setWorking] = useState<"save" | "schedule" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [staging, setStaging] = useState(false);
  const [stagingStyle, setStagingStyle] =
    useState<(typeof stagingStyles)[number]>("Moderno");
  const [stagingGenerated, setStagingGenerated] = useState(false);

  const copy = captions[channel];

  function markChanged() {
    setDirty(true);
    setMessage("");
  }

  function draftInput(): CampaignDraftInput {
    return {
      campaignId: persistedCampaignId,
      propertyId: property.id,
      visualStyle: style,
      headline,
      cta,
      captions,
    };
  }

  async function save() {
    setWorking("save");
    setError("");
    setMessage("");

    try {
      const id = await saveCampaignDraft(draftInput());
      setPersistedCampaignId(id);
      setStatus((current) =>
        current === "scheduled" ? "scheduled" : "ready",
      );
      setDirty(false);
      setMessage("Campanha salva.");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível salvar a campanha.",
      );
    } finally {
      setWorking(null);
    }
  }

  async function schedule() {
    if (!scheduledFor) return;

    setWorking("schedule");
    setError("");
    setMessage("");

    try {
      const id = await scheduleCampaignDraft(
        draftInput(),
        new Date(scheduledFor).toISOString(),
      );
      setPersistedCampaignId(id);
      setStatus("scheduled");
      setScheduleOpen(false);
      setDirty(false);
      setMessage(
        `Campanha agendada para ${new Date(scheduledFor).toLocaleString("pt-BR")}.`,
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível agendar a campanha.",
      );
    } finally {
      setWorking(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-[#FFFAEB] p-4 text-sm text-[#B54708]">
        <strong>Prévia determinística.</strong> Os ajustes abaixo já alteram a
        peça em tempo real. IA e publicação nas redes entram nas próximas
        integrações.
      </div>

      {dirty && (
        <div className="flex items-center gap-2 rounded-xl border border-[#FEDF89] bg-[#FFFAEB] p-4 text-sm font-bold text-[#B54708]">
          <Sparkles size={17} />
          Alterações não salvas. Confira a prévia e clique em “Salvar campanha”.
        </div>
      )}

      {message && (
        <div className="flex items-center gap-2 rounded-xl bg-[#ECFDF3] p-4 text-sm font-bold text-[#067647]">
          <CheckCircle2 size={18} />
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-[#FEF3F2] p-4 text-sm font-semibold text-[#B42318]">
          {error}
        </div>
      )}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="app-card p-4 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-[#176B5B]">
                {persistedCampaignId ? "Campanha salva" : "Nova campanha"}
              </div>
              <h2 className="mt-1 text-xl font-extrabold">{property.title}</h2>
            </div>

            <span className="inline-flex items-center gap-1 rounded-full bg-[#E9F4F1] px-3 py-1.5 text-xs font-bold text-[#176B5B]">
              <Sparkles size={14} />
              Estilo {style}
            </span>
          </div>

          <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
            {allChannels.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setChannel(item.id)}
                className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-bold transition ${
                  channel === item.id
                    ? "bg-[#176B5B] text-white"
                    : "border border-[#E4E7EC] bg-white text-[#475467] hover:border-[#98A2B3] hover:bg-[#F9FAFB]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <CreativePreview
            property={property}
            style={style}
            headline={headline}
            copy={copy}
            cta={cta}
          />
        </div>

        <aside className="space-y-3">
          {adjusting ? (
            <div className="app-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-extrabold">Ajustar campanha</div>
                  <p className="mt-1 text-xs leading-5 text-[#667085]">
                    Tudo aqui altera a prévia ao lado em tempo real.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAdjusting(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-[#667085] hover:bg-[#F2F4F7]"
                  aria-label="Fechar ajustes"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <label className="block text-sm font-bold">
                  Headline da arte
                  <input
                    className="app-input mt-2"
                    value={headline}
                    onChange={(event) => {
                      setHeadline(event.target.value);
                      markChanged();
                    }}
                  />
                  <span className="mt-1 block text-xs font-normal text-[#667085]">
                    Aparece sobre a imagem.
                  </span>
                </label>

                <label className="block text-sm font-bold">
                  Chamada para ação
                  <input
                    className="app-input mt-2"
                    value={cta}
                    onChange={(event) => {
                      setCta(event.target.value);
                      markChanged();
                    }}
                  />
                  <span className="mt-1 block text-xs font-normal text-[#667085]">
                    Aparece abaixo da legenda.
                  </span>
                </label>

                <label className="block text-sm font-bold">
                  Legenda — {allChannels.find((item) => item.id === channel)?.label}
                  <textarea
                    className="app-input mt-2 min-h-28 py-3"
                    value={captions[channel]}
                    onChange={(event) => {
                      setCaptions((current) => ({
                        ...current,
                        [channel]: event.target.value,
                      }));
                      markChanged();
                    }}
                  />
                  <span className="mt-1 block text-xs font-normal text-[#667085]">
                    Troque de rede acima para editar a legenda de cada canal.
                  </span>
                </label>

                <div>
                  <div className="mb-2 text-sm font-bold">Estilo visual</div>
                  <div className="grid gap-2">
                    {styles.map(([name, description]) => (
                      <button
                        key={name}
                        type="button"
                        aria-pressed={style === name}
                        onClick={() => {
                          setStyle(name);
                          markChanged();
                        }}
                        className={`flex items-center justify-between rounded-xl border p-3 text-left transition ${
                          style === name
                            ? "border-[#176B5B] bg-[#E9F4F1]"
                            : "border-[#E4E7EC] bg-white hover:border-[#98A2B3] hover:bg-[#F9FAFB]"
                        }`}
                      >
                        <span>
                          <span className="block font-extrabold">{name}</span>
                          <span className="mt-0.5 block text-xs text-[#667085]">
                            {description}
                          </span>
                        </span>
                        {style === name && (
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#176B5B] text-white">
                            <Check size={15} />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="app-card p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-[#667085]">
                Estado da campanha
              </div>
              <p className="mt-2 font-extrabold">
                {status === "scheduled"
                  ? "Agendada"
                  : persistedCampaignId
                    ? "Salva"
                    : "Ainda não salva"}
              </p>
              <p className="mt-1 text-sm text-[#667085]">
                Use “Ajustar campanha” para mudar texto, legenda e composição
                visual.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => setAdjusting((value) => !value)}
            className="app-button-secondary w-full"
          >
            {adjusting ? "Fechar ajustes" : "Ajustar campanha"}
          </button>

          <button
            type="button"
            disabled={!property.image}
            onClick={() => setStaging(true)}
            className="app-card flex w-full items-center justify-between p-4 text-left transition hover:border-[#98A2B3] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div>
              <div className="flex items-center gap-2 font-extrabold">
                <WandSparkles size={18} className="text-[#176B5B]" />
                Mobiliar com IA
              </div>
              <div className="mt-1 text-xs text-[#667085]">
                Premium · ainda não consome créditos
              </div>
            </div>
            <ChevronDown size={18} className="text-[#667085]" />
          </button>

          <button
            type="button"
            onClick={save}
            disabled={working !== null}
            className="app-button-secondary flex w-full items-center justify-center gap-2 disabled:opacity-60"
          >
            {working === "save" ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {dirty ? "Salvar alterações" : "Salvar campanha"}
          </button>

          <button
            type="button"
            onClick={() => setScheduleOpen((value) => !value)}
            disabled={working !== null}
            className="app-button-primary flex w-full items-center justify-center gap-2 disabled:opacity-60"
          >
            <CalendarClock size={18} />
            Agendar
          </button>

          <button
            type="button"
            disabled
            title="Disponível após conectar uma rede social"
            className="app-button-secondary w-full opacity-50"
          >
            Publicar em todas
          </button>

          <p className="text-center text-xs text-[#667085]">
            Publicação será liberada após a integração OAuth das redes.
          </p>
        </aside>
      </section>

      {scheduleOpen && (
        <section className="app-card p-5 sm:p-6">
          <h3 className="text-lg font-extrabold">Agendar campanha</h3>
          <p className="mt-1 text-sm text-[#667085]">
            O agendamento já é salvo no banco. A execução automática começa
            quando o worker de publicação estiver conectado.
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1 text-sm font-bold">
              Data e horário
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(event) => setScheduledFor(event.target.value)}
                className="app-input mt-2"
              />
            </label>

            <button
              type="button"
              disabled={!scheduledFor || working !== null}
              onClick={schedule}
              className="app-button-primary inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {working === "schedule" && (
                <LoaderCircle size={18} className="animate-spin" />
              )}
              Salvar agendamento
            </button>
          </div>
        </section>
      )}

      {staging && property.image && (
        <section className="app-card p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-[#176B5B]">
                Premium
              </div>
              <h3 className="mt-1 text-lg font-extrabold">
                Ambientação virtual
              </h3>
              <p className="mt-1 text-sm text-[#667085]">
                Esta tela ainda é uma prévia funcional; nenhum crédito nem
                geração de imagem é executado nesta etapa.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setStaging(false)}
              className="text-sm font-bold text-[#667085] hover:text-[#18202A]"
            >
              Fechar
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-2 text-xs font-bold text-[#667085]">
                ORIGINAL
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                <img
                  src={property.image}
                  alt="Foto original do imóvel"
                  className="absolute inset-0 h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs font-bold text-[#667085]">
                AMBIENTAÇÃO VIRTUAL
              </div>
              <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-[#F2F4F7]">
                {stagingGenerated ? (
                  <>
                    <img
                      src={property.image}
                      alt="Simulação de ambientação virtual"
                      className="absolute inset-0 h-full w-full object-cover opacity-90"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-x-3 bottom-3 rounded-lg bg-white/95 p-2 text-center text-xs font-bold">
                      Prévia de ambientação · {stagingStyle}
                    </div>
                  </>
                ) : (
                  <span className="px-5 text-center text-sm text-[#667085]">
                    A prévia aparecerá aqui.
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {stagingStyles.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={stagingStyle === item}
                onClick={() => {
                  setStagingStyle(item);
                  setStagingGenerated(false);
                }}
                className={`min-h-10 rounded-full border px-4 text-sm font-bold transition ${
                  stagingStyle === item
                    ? "border-[#176B5B] bg-[#E9F4F1] text-[#176B5B]"
                    : "border-[#E4E7EC] bg-white hover:border-[#98A2B3]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setStagingGenerated(true)}
            className="app-button-primary mt-5"
          >
            Gerar prévia simulada
          </button>
        </section>
      )}
    </div>
  );
}

function CreativePreview({
  property,
  style,
  headline,
  copy,
  cta,
}: {
  property: Property;
  style: string;
  headline: string;
  copy: string;
  cta: string;
}) {
  const locality = [property.location, property.city]
    .filter(Boolean)
    .join(" · ");

  const featureLine = [
    property.bedrooms ? `${property.bedrooms} quartos` : null,
    property.suites ? `${property.suites} suítes` : null,
    property.area ? `${property.area} m²` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const price =
    property.price > 0
      ? `${formatBRL(property.price)}${property.purpose === "Aluguel" ? "/mês" : ""}`
      : "Preço sob consulta";

  return (
    <div className="mx-auto max-w-[430px] overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white shadow-sm">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#EAECF0]">
        <PropertyImage property={property} />

        {style === "Essencial" && (
          <>
            <div className="absolute inset-x-0 bottom-0 bg-white p-5 text-[#18202A]">
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#176B5B]">
                {locality}
              </div>
              <div className="mt-2 text-2xl font-black leading-tight">
                {headline}
              </div>
              {featureLine && (
                <div className="mt-2 text-sm font-semibold text-[#667085]">
                  {featureLine}
                </div>
              )}
              <div className="mt-3 text-xl font-black text-[#176B5B]">
                {price}
              </div>
            </div>
          </>
        )}

        {style === "Destaque" && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-5 pt-24 text-white">
            <div className="text-xs font-bold uppercase tracking-wider">
              {locality}
            </div>
            <div className="mt-2 text-2xl font-black leading-tight">
              {headline}
            </div>
            {featureLine && (
              <div className="mt-2 text-sm font-semibold">{featureLine}</div>
            )}
            <div className="mt-3 text-xl font-black">{price}</div>
          </div>
        )}

        {style === "Oportunidade" && (
          <>
            <div className="absolute left-4 top-4 rounded-full bg-[#F79009] px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white shadow">
              Oportunidade
            </div>
            <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur">
              <div className="text-3xl font-black leading-none text-[#176B5B]">
                {price}
              </div>
              <div className="mt-3 text-lg font-black leading-tight text-[#18202A]">
                {headline}
              </div>
              <div className="mt-2 text-xs font-bold uppercase tracking-wide text-[#667085]">
                {locality}
              </div>
              {featureLine && (
                <div className="mt-2 text-sm font-semibold text-[#475467]">
                  {featureLine}
                </div>
              )}
            </div>
          </>
        )}

        {style === "Alto padrão" && (
          <>
            <div className="absolute inset-0 bg-black/35" />
            <div className="absolute inset-4 border border-white/55" />
            <div className="absolute inset-x-8 bottom-10 text-center text-white">
              <div className="text-[10px] font-semibold uppercase tracking-[0.32em] text-white/80">
                {locality}
              </div>
              <div className="mt-4 font-serif text-3xl leading-tight">
                {headline}
              </div>
              <div className="mx-auto mt-4 h-px w-12 bg-white/70" />
              <div className="mt-4 text-base font-semibold tracking-wide">
                {price}
              </div>
              {featureLine && (
                <div className="mt-2 text-xs tracking-wide text-white/80">
                  {featureLine}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="p-4">
        <p className="text-sm leading-6 text-[#475467]">{copy}</p>
        <p className="mt-3 text-sm font-bold text-[#176B5B]">
          #Imóveis #
          {property.location.replace(/[^\p{L}\p{N}]/gu, "") || "Imóvel"}{" "}
          #CorretorDeImóveis
        </p>
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#F9FAFB] p-3 text-sm font-bold">
          <MessageCircle size={18} className="text-[#176B5B]" />
          {cta}
        </div>
      </div>
    </div>
  );
}

function PropertyImage({ property }: { property: Property }) {
  if (property.image) {
    return (
      <img
        src={property.image}
        alt={property.title}
        className="absolute inset-0 h-full w-full object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center text-[#98A2B3]">
      <div className="text-center">
        <Building2 size={48} className="mx-auto" />
        <p className="mt-2 text-sm font-semibold">
          Adicione fotos para enriquecer o criativo
        </p>
      </div>
    </div>
  );
}
