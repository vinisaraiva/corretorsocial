"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  Building2,
  CalendarClock,
  Check,
  ChevronDown,
  MessageCircle,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { campaigns, properties as mockProperties } from "@/data/mock";
import { formatBRL } from "@/lib/utils";
import type { Campaign, Property, SocialChannel } from "@/types";

const allChannels: { id: SocialChannel; label: string }[] = [
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "tiktok", label: "TikTok" },
  { id: "google", label: "Google" },
];

const styles = [
  ["Essencial", "Limpo e universal"],
  ["Destaque", "Fotografia em primeiro plano"],
  ["Oportunidade", "Preço e condição em evidência"],
  ["Alto padrão", "Minimalista e sofisticado"],
] as const;

const stagingStyles = [
  "Moderno",
  "Minimalista",
  "Clássico",
  "Praiano",
] as const;

export function CampaignBuilder({
  campaignId,
  propertyData,
}: {
  campaignId?: string;
  propertyData?: Property;
}) {
  const campaign: Campaign | undefined = campaignId
    ? campaigns.find((item) => item.id === campaignId)
    : undefined;

  const property =
    propertyData ??
    mockProperties.find((item) => item.id === campaign?.propertyId) ??
    mockProperties[0];

  const initialChannel =
    campaign?.channels[0] ?? ("instagram" as SocialChannel);

  const [channel, setChannel] = useState<SocialChannel>(initialChannel);
  const [adjusting, setAdjusting] = useState(false);
  const [style, setStyle] = useState("Destaque");
  const [headline, setHeadline] = useState(
    campaign?.headline ?? property.highlights[0] ?? property.title,
  );
  const [cta, setCta] = useState("Fale comigo no WhatsApp");
  const [published, setPublished] = useState(campaign?.status === "publicada");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduledFor, setScheduledFor] = useState("");
  const [scheduled, setScheduled] = useState(campaign?.status === "agendada");
  const [staging, setStaging] = useState(false);
  const [stagingStyle, setStagingStyle] =
    useState<(typeof stagingStyles)[number]>("Moderno");
  const [stagingGenerated, setStagingGenerated] = useState(false);

  const channels = useMemo(() => {
    if (!campaign) return allChannels;
    return allChannels.filter((item) => campaign.channels.includes(item.id));
  }, [campaign]);

  const copy = {
    instagram: `${property.title}: ${property.description || "Conheça este imóvel."} Fale comigo para saber mais.`,
    facebook: `${property.title}, ${property.location}. ${property.description || "Entre em contato para conhecer os detalhes."}`,
    tiktok: `Você moraria aqui? Conheça ${property.title.toLowerCase()} em ${property.location}.`,
    google: `${property.title} em ${property.location}${property.city ? `, ${property.city}` : ""}. ${property.bedrooms ? `${property.bedrooms} quartos` : "Veja os detalhes"}${property.area ? ` e ${property.area} m²` : ""}.`,
  }[channel];

  const locality = [property.location, property.city]
    .filter(Boolean)
    .join(" · ");

  function confirmSchedule() {
    if (!scheduledFor) return;
    setScheduled(true);
    setPublished(false);
    setScheduleOpen(false);
  }

  function publish() {
    setPublished(true);
    setScheduled(false);
    setScheduleOpen(false);
  }

  const featureLine = [
    property.bedrooms ? `${property.bedrooms} quartos` : null,
    property.suites ? `${property.suites} suítes` : null,
    property.area ? `${property.area} m²` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-5">
      {!campaign && (
        <div className="rounded-xl bg-[#FFFAEB] p-4 text-sm text-[#B54708]">
          <strong>Prévia da campanha.</strong> Os textos e a arte ainda são
          demonstrativos. A persistência do imóvel já é real; o motor de
          geração/publicação entra na próxima etapa.
        </div>
      )}

      {published && (
        <div className="flex items-center gap-2 rounded-xl bg-[#ECFDF3] p-4 text-sm font-bold text-[#067647]">
          <Check size={18} />
          Demonstração: ação de publicação concluída na interface.
        </div>
      )}

      {scheduled && !published && (
        <div className="flex items-center gap-2 rounded-xl bg-[#EFF8FF] p-4 text-sm font-bold text-[#175CD3]">
          <CalendarClock size={18} />
          Agendamento demonstrativo
          {scheduledFor
            ? ` para ${new Date(scheduledFor).toLocaleString("pt-BR")}`
            : ""}
          .
        </div>
      )}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="app-card p-4 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-[#176B5B]">
                {campaign ? "Campanha" : "Campanha pronta"}
              </div>
              <h2 className="mt-1 text-xl font-extrabold">
                {property.title}
              </h2>
            </div>

            <span className="inline-flex items-center gap-1 rounded-full bg-[#E9F4F1] px-3 py-1.5 text-xs font-bold text-[#176B5B]">
              <Sparkles size={14} />
              Estilo {style}
            </span>
          </div>

          <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
            {channels.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setChannel(item.id)}
                className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-bold ${
                  channel === item.id
                    ? "bg-[#176B5B] text-white"
                    : "border border-[#E4E7EC] bg-white text-[#475467]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mx-auto max-w-[430px] overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white">
            <div className="relative aspect-[4/5] bg-[#EAECF0]">
              {property.image ? (
                <Image
                  src={property.image}
                  alt={property.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[#98A2B3]">
                  <div className="text-center">
                    <Building2 size={48} className="mx-auto" />
                    <p className="mt-2 text-sm font-semibold">
                      Adicione fotos para enriquecer o criativo
                    </p>
                  </div>
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-5 pt-20 text-white">
                {locality && (
                  <div className="text-xs font-bold uppercase tracking-wider">
                    {locality}
                  </div>
                )}
                <div className="mt-2 text-2xl font-black">{headline}</div>
                {featureLine && (
                  <div className="mt-2 text-sm font-semibold">
                    {featureLine}
                  </div>
                )}
                <div className="mt-3 text-xl font-black">
                  {property.price > 0
                    ? formatBRL(property.price)
                    : "Preço sob consulta"}
                  {property.purpose === "Aluguel" && property.price > 0 && (
                    <span className="text-xs font-semibold">/mês</span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4">
              <p className="text-sm leading-6 text-[#475467]">{copy}</p>
              <p className="mt-3 text-sm font-bold text-[#176B5B]">
                #Imóveis #
                {property.location.replace(/[^\p{L}\p{N}]/gu, "") ||
                  "Imóvel"}{" "}
                #CorretorDeImóveis
              </p>
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#F9FAFB] p-3 text-sm font-bold">
                <MessageCircle size={18} className="text-[#176B5B]" />
                {cta}
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-3">
          <div className="app-card p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-[#667085]">
              Argumento principal
            </div>
            <p className="mt-2 font-extrabold">
              {property.highlights[0] ?? property.title}
            </p>
            <p className="mt-1 text-sm text-[#667085]">
              Nesta prévia usamos o primeiro diferencial informado.
            </p>
          </div>

          <button
            type="button"
            disabled={!property.image}
            onClick={() => setStaging(true)}
            className="app-card flex w-full items-center justify-between p-4 text-left disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div>
              <div className="flex items-center gap-2 font-extrabold">
                <WandSparkles size={18} className="text-[#176B5B]" />
                Mobiliar com IA
              </div>
              <div className="mt-1 text-xs text-[#667085]">
                Premium · 1 crédito por imagem
              </div>
            </div>
            <ChevronDown size={18} className="text-[#667085]" />
          </button>

          <button
            type="button"
            onClick={() => setAdjusting((value) => !value)}
            className="app-button-secondary w-full"
          >
            Ajustar campanha
          </button>

          <button
            type="button"
            onClick={() => setScheduleOpen((value) => !value)}
            className="app-button-secondary flex w-full items-center justify-center gap-2"
          >
            <CalendarClock size={18} />
            Agendar
          </button>

          <button
            type="button"
            onClick={publish}
            className="app-button-primary w-full"
          >
            Publicar em todas
          </button>
        </aside>
      </section>

      {scheduleOpen && (
        <section className="app-card p-5 sm:p-6">
          <h3 className="text-lg font-extrabold">Agendar publicação</h3>
          <p className="mt-1 text-sm text-[#667085]">
            Escolha quando a campanha deve ser publicada.
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
              disabled={!scheduledFor}
              onClick={confirmSchedule}
              className="app-button-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Confirmar agendamento
            </button>
          </div>
        </section>
      )}

      {adjusting && (
        <section className="app-card p-5 sm:p-6">
          <h3 className="text-lg font-extrabold">Ajustar campanha</h3>
          <p className="mt-1 text-sm text-[#667085]">
            Só mexa no que quiser. A versão recomendada já está pronta.
          </p>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <label className="text-sm font-bold">
              Headline
              <input
                className="app-input mt-2"
                value={headline}
                onChange={(event) => setHeadline(event.target.value)}
              />
            </label>

            <label className="text-sm font-bold">
              CTA
              <input
                className="app-input mt-2"
                value={cta}
                onChange={(event) => setCta(event.target.value)}
              />
            </label>
          </div>

          <div className="mt-5">
            <div className="mb-3 text-sm font-bold">Estilo visual</div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {styles.map(([name, description]) => (
                <button
                  key={name}
                  type="button"
                  aria-pressed={style === name}
                  onClick={() => setStyle(name)}
                  className={`rounded-xl border p-4 text-left ${
                    style === name
                      ? "border-[#176B5B] bg-[#E9F4F1]"
                      : "border-[#E4E7EC] bg-white"
                  }`}
                >
                  <div className="font-extrabold">{name}</div>
                  <div className="mt-1 text-xs text-[#667085]">
                    {description}
                  </div>
                  {style === name && (
                    <div className="mt-3 text-xs font-bold text-[#176B5B]">
                      Selecionado
                    </div>
                  )}
                </button>
              ))}
            </div>
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
                Escolha um estilo. A foto original sempre será preservada.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setStaging(false)}
              className="text-sm font-bold text-[#667085]"
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
                <Image
                  src={property.image}
                  alt="Foto original do imóvel"
                  fill
                  className="object-cover"
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
                    <Image
                      src={property.image}
                      alt="Simulação de ambientação virtual"
                      fill
                      className="object-cover opacity-90"
                    />
                    <div className="absolute inset-x-3 bottom-3 rounded-lg bg-white/95 p-2 text-center text-xs font-bold">
                      Ambientação virtual gerada por IA · {stagingStyle}
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
                className={`min-h-10 rounded-full border px-4 text-sm font-bold ${
                  stagingStyle === item
                    ? "border-[#176B5B] bg-[#E9F4F1] text-[#176B5B]"
                    : "border-[#E4E7EC] bg-white"
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
            Gerar ambientação · 1 crédito
          </button>
        </section>
      )}
    </div>
  );
}
