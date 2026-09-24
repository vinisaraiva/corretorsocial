"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  CalendarClock,
  Check,
  ImageDown,
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
  registerRenderedAssets,
  saveCampaignDraft,
  scheduleCampaignDraft,
  type CampaignDraftInput,
} from "@/app/campanhas/actions";
import {
  campaignTemplates,
  getCampaignTemplate,
  normalizeCampaignTemplate,
  type CampaignTemplateId,
} from "@/lib/campaign-templates";
import { formatBRL } from "@/lib/utils";
import {
  campaignTemplateToVertical,
  normalizeBlockPosition,
  resolveBlockPosition,
  suggestedBlockPositionFromTags,
  type BlockPosition,
} from "@/lib/campaign-layout";
import { BlockPositionControl } from "@/components/block-position-control";
import {
  getVerticalTemplate,
  getVerticalTemplateName,
  normalizeVerticalTemplate,
  type VerticalTemplateId,
} from "@/lib/vertical-templates";
import { VerticalTemplateControls } from "@/components/vertical-template-controls";
import { VerticalCreativePreview } from "@/components/vertical-creative-preview";
import {
  getCarouselModel,
  normalizeCarouselModel,
  type CarouselModelId,
} from "@/lib/carousel-templates";
import { InstagramCarouselPreview } from "@/components/instagram-carousel-preview";
import { InstagramCarouselControls } from "@/components/instagram-carousel-controls";
import { buildCampaignRecommendation } from "@/lib/campaign-recommendation";
import { MediaAnalysisStatus } from "@/components/media-analysis-status";
import { renderAndUploadCampaignAssets } from "@/lib/campaign-renderer";
import type { Property, SocialChannel } from "@/types";

const allChannels: { id: SocialChannel; label: string }[] = [
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "tiktok", label: "TikTok" },
  { id: "google", label: "Google" },
];

type InstagramCampaignFormat = "feed" | "story" | "carousel";

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

function safeBrandColor(value: string) {
  return /^#[0-9A-F]{6}$/i.test(value) ? value : "#176B5B";
}

function contrastText(hex: string) {
  const color = hex.replace("#", "");
  const r = Number.parseInt(color.slice(0, 2), 16);
  const g = Number.parseInt(color.slice(2, 4), 16);
  const b = Number.parseInt(color.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.62 ? "#18202A" : "#FFFFFF";
}

type CampaignBrand = {
  professionalName: string;
  logoUrl?: string | null;
  primaryColor: string;
};

type InitialCampaign = {
  id: string;
  visualStyle: string;
  headline: string;
  subheadline: string;
  cta: string;
  status: string;
  scheduledFor?: string | null;
  captions?: Partial<Record<SocialChannel, string>>;
  instagramStory?: {
    templateId: string;
    headline: string;
    subheadline: string;
    cta: string;
  };
  tiktokVertical?: {
    templateId: string;
    headline: string;
    subheadline: string;
    cta: string;
  };
  instagramCarousel?: {
    modelId: string;
    headline: string;
    cta: string;
  };
  mediaSelection?: {
    instagramFeed?: string;
    instagramStory?: string;
    facebook?: string;
    tiktok?: string;
    google?: string;
    carousel?: string[];
  };
  blockPositions?: {
    instagramFeed?: string;
    instagramStory?: string;
    facebook?: string;
    tiktok?: string;
    google?: string;
  };
};

export function CampaignBuilder({
  propertyData,
  brand,
  campaignData,
  mediaAnalysisJobId,
}: {
  propertyData: Property;
  brand: CampaignBrand;
  campaignData?: InitialCampaign;
  mediaAnalysisJobId?: string | null;
}) {
  const property = propertyData;
  const brandColor = safeBrandColor(brand.primaryColor);

  const recommendation = useMemo(
    () => buildCampaignRecommendation(property),
    [property],
  );

  const [persistedCampaignId, setPersistedCampaignId] = useState(
    campaignData?.id,
  );
  const [channel, setChannel] = useState<SocialChannel>("instagram");
  const [instagramFormat, setInstagramFormat] =
    useState<InstagramCampaignFormat>("feed");
  const [adjusting, setAdjusting] = useState(false);
  const [templateId, setTemplateId] = useState<CampaignTemplateId>(() =>
    normalizeCampaignTemplate(
      campaignData?.visualStyle ?? recommendation.style,
    ),
  );
  const [headline, setHeadline] = useState(
    campaignData?.headline ?? recommendation.headline,
  );
  const [subheadline, setSubheadline] = useState(
    campaignData?.subheadline ?? recommendation.subheadline,
  );
  const [cta, setCta] = useState(
    campaignData?.cta ?? recommendation.cta,
  );
  const [storyTemplateId, setStoryTemplateId] =
    useState<VerticalTemplateId>(() =>
      normalizeVerticalTemplate(
        campaignData?.instagramStory?.templateId ??
          recommendation.instagramStory.templateId,
      ),
    );
  const [storyHeadline, setStoryHeadline] = useState(
    campaignData?.instagramStory?.headline ??
      recommendation.instagramStory.headline,
  );
  const [storySubheadline, setStorySubheadline] = useState(
    campaignData?.instagramStory?.subheadline ??
      recommendation.instagramStory.subheadline,
  );
  const [storyCta, setStoryCta] = useState(
    campaignData?.instagramStory?.cta ?? recommendation.instagramStory.cta,
  );
  const [tiktokTemplateId, setTiktokTemplateId] =
    useState<VerticalTemplateId>(() =>
      normalizeVerticalTemplate(
        campaignData?.tiktokVertical?.templateId ??
          recommendation.tiktokVertical.templateId,
      ),
    );
  const [tiktokHeadline, setTiktokHeadline] = useState(
    campaignData?.tiktokVertical?.headline ??
      recommendation.tiktokVertical.headline,
  );
  const [tiktokSubheadline, setTiktokSubheadline] = useState(
    campaignData?.tiktokVertical?.subheadline ??
      recommendation.tiktokVertical.subheadline,
  );
  const [tiktokCta, setTiktokCta] = useState(
    campaignData?.tiktokVertical?.cta ?? recommendation.tiktokVertical.cta,
  );
  const [carouselModelId, setCarouselModelId] =
    useState<CarouselModelId>(() =>
      normalizeCarouselModel(
        campaignData?.instagramCarousel?.modelId ??
          recommendation.instagramCarousel.modelId,
        property.purpose,
      ),
    );
  const [carouselHeadline, setCarouselHeadline] = useState(
    campaignData?.instagramCarousel?.headline ??
      recommendation.instagramCarousel.headline,
  );
  const [carouselCta, setCarouselCta] = useState(
    campaignData?.instagramCarousel?.cta ??
      recommendation.instagramCarousel.cta,
  );
  const [blockPositions, setBlockPositions] = useState({
    instagramFeed: normalizeBlockPosition(
      campaignData?.blockPositions?.instagramFeed,
    ),
    instagramStory: normalizeBlockPosition(
      campaignData?.blockPositions?.instagramStory,
    ),
    facebook: normalizeBlockPosition(campaignData?.blockPositions?.facebook),
    tiktok: normalizeBlockPosition(campaignData?.blockPositions?.tiktok),
    google: normalizeBlockPosition(campaignData?.blockPositions?.google),
  });
  const [captions, setCaptions] = useState<Record<SocialChannel, string>>({
    instagram:
      campaignData?.captions?.instagram ?? recommendation.captions.instagram,
    facebook:
      campaignData?.captions?.facebook ?? recommendation.captions.facebook,
    tiktok:
      campaignData?.captions?.tiktok ?? recommendation.captions.tiktok,
    google:
      campaignData?.captions?.google ?? recommendation.captions.google,
  });
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduledFor, setScheduledFor] = useState(
    toLocalDateTimeInput(campaignData?.scheduledFor),
  );
  const [status, setStatus] = useState(campaignData?.status ?? "draft");
  const [working, setWorking] = useState<
    "save" | "schedule" | "render" | null
  >(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [staging, setStaging] = useState(false);
  const [stagingStyle, setStagingStyle] =
    useState<(typeof stagingStyles)[number]>("Moderno");
  const [stagingGenerated, setStagingGenerated] = useState(false);

  const mediaById = new Map(
    (property.media ?? [])
      .filter((item) => Boolean(item.id))
      .map((item) => [item.id!, item]),
  );

  type PreviewMedia = {
    id?: string;
    url: string;
    aiTags?: string[];
  };

  const resolveSavedMedia = (
    id: string | undefined,
    fallback: PreviewMedia | undefined,
  ): PreviewMedia | undefined => {
    if (id) return mediaById.get(id) ?? fallback;
    if (fallback?.id) return mediaById.get(fallback.id) ?? fallback;
    return fallback;
  };

  const feedMedia = resolveSavedMedia(
    campaignData?.mediaSelection?.instagramFeed,
    recommendation.media.feedCover,
  );
  const storyMedia = resolveSavedMedia(
    campaignData?.mediaSelection?.instagramStory,
    recommendation.media.storyCover,
  );
  const tiktokMedia = resolveSavedMedia(
    campaignData?.mediaSelection?.tiktok,
    recommendation.media.tiktokCover,
  );

  const savedCarouselMedia = (campaignData?.mediaSelection?.carousel ?? [])
    .map((id) => mediaById.get(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const carouselMedia =
    savedCarouselMedia.length > 0
      ? savedCarouselMedia
      : recommendation.media.carousel;

  const feedProperty: Property = {
    ...property,
    image: feedMedia?.url ?? property.image,
  };
  const storyProperty: Property = {
    ...property,
    image: storyMedia?.url ?? property.image,
  };
  const tiktokProperty: Property = {
    ...property,
    image: tiktokMedia?.url ?? property.image,
  };
  const carouselProperty: Property = {
    ...property,
    image: carouselMedia[0]?.url ?? property.image,
    images:
      carouselMedia.length > 0
        ? carouselMedia.map((item) => item.url)
        : property.images,
  };

  const selectedTemplate = getCampaignTemplate(templateId);
  const selectedStoryTemplate = getVerticalTemplate(storyTemplateId);
  const selectedTiktokTemplate = getVerticalTemplate(tiktokTemplateId);
  const selectedCarouselModel = getCarouselModel(carouselModelId);
  const imageCount =
    carouselMedia.length ||
    property.images?.length ||
    (property.image ? 1 : 0);
  const carouselEligible = imageCount >= 3;
  const isStoryView =
    channel === "instagram" && instagramFormat === "story";
  const isCarouselView =
    channel === "instagram" && instagramFormat === "carousel";
  const isTiktokView = channel === "tiktok";
  const isVerticalView = isStoryView || isTiktokView;
  const activeArtName = isStoryView
    ? getVerticalTemplateName(storyTemplateId, "instagram_story")
    : isCarouselView
      ? `Carrossel · ${selectedCarouselModel.name}`
      : isTiktokView
        ? getVerticalTemplateName(tiktokTemplateId, "tiktok")
        : selectedTemplate.name;
  const copy = captions[channel];
  const activeNonVerticalPosition =
    channel === "facebook"
      ? blockPositions.facebook
      : channel === "google"
        ? blockPositions.google
        : blockPositions.instagramFeed;

  function markChanged() {
    setDirty(true);
    setMessage("");
  }

  function applyGlobalStyle(value: CampaignTemplateId) {
    setTemplateId(value);
    const verticalTemplate = campaignTemplateToVertical(value);
    setStoryTemplateId(verticalTemplate);
    setTiktokTemplateId(verticalTemplate);
    markChanged();
  }

  function updateNonVerticalPosition(value: BlockPosition) {
    const key =
      channel === "facebook"
        ? "facebook"
        : channel === "google"
          ? "google"
          : "instagramFeed";

    setBlockPositions((current) => ({
      ...current,
      [key]: value,
    }));
    markChanged();
  }

  function draftInput(): CampaignDraftInput {
    return {
      campaignId: persistedCampaignId,
      propertyId: property.id,
      visualStyle: templateId,
      headline,
      subheadline,
      cta,
      captions,
      instagramStory: {
        templateId: storyTemplateId,
        headline: storyHeadline,
        subheadline: storySubheadline,
        cta: storyCta,
      },
      tiktokVertical: {
        templateId: tiktokTemplateId,
        headline: tiktokHeadline,
        subheadline: tiktokSubheadline,
        cta: tiktokCta,
      },
      instagramCarousel: carouselEligible
        ? {
            modelId: carouselModelId,
            headline: carouselHeadline,
            cta: carouselCta,
            slideCount: selectedCarouselModel.slideCount,
          }
        : undefined,
      mediaSelection: {
        instagramFeed: feedMedia?.id,
        instagramStory: storyMedia?.id,
        facebook: feedMedia?.id,
        tiktok: tiktokMedia?.id,
        google: feedMedia?.id,
        carousel: carouselMedia
          .map((item) => item.id)
          .filter((id): id is string => Boolean(id)),
      },
      blockPositions,
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

  async function renderCurrentCreative() {
    if (isTiktokView) {
      setError("O TikTok será exportado como vídeo em uma etapa própria.");
      return;
    }

    if (!property.image) {
      setError("Adicione pelo menos uma foto antes de gerar a arte.");
      return;
    }

    setWorking("render");
    setError("");
    setMessage("");

    try {
      let campaignId = persistedCampaignId;

      if (!campaignId || dirty) {
        campaignId = await saveCampaignDraft(draftInput());
        setPersistedCampaignId(campaignId);
        setDirty(false);
        setStatus((current) =>
          current === "scheduled" ? "scheduled" : "ready",
        );
      }

      const config = isStoryView
        ? {
            provider: "instagram" as const,
            format: "story_9x16",
            selector: '[data-render-target="story"]',
            width: 1080,
            height: 1920,
          }
        : isCarouselView
          ? {
              provider: "instagram" as const,
              format: "carousel_4x5",
              selector: '[data-render-carousel-slide="true"]',
              width: 1080,
              height: 1350,
            }
          : channel === "facebook"
            ? {
                provider: "facebook" as const,
                format: "feed",
                selector: '[data-render-target="feed"]',
                width: 1080,
                height: 1350,
              }
            : channel === "google"
              ? {
                  provider: "google_business" as const,
                  format: "post",
                  selector: '[data-render-target="feed"]',
                  width: 1080,
                  height: 1350,
                }
              : {
                  provider: "instagram" as const,
                  format: "feed_4x5",
                  selector: '[data-render-target="feed"]',
                  width: 1080,
                  height: 1350,
                };

      const paths = await renderAndUploadCampaignAssets({
        campaignId,
        ...config,
      });

      await registerRenderedAssets({
        campaignId,
        provider: config.provider,
        format: config.format,
        paths,
      });

      setMessage(
        paths.length > 1
          ? `${paths.length} páginas do carrossel geradas em PNG.`
          : "Arquivo PNG gerado e salvo na campanha.",
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível gerar o arquivo da campanha.",
      );
    } finally {
      setWorking(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-[#E9F4F1] p-4 text-sm text-[#176B5B]">
        <strong>Versões prontas por rede, sem editor livre.</strong> O sistema
        prepara os formatos automaticamente; ajuste apenas o que quiser.
      </div>

      <MediaAnalysisStatus jobId={mediaAnalysisJobId} />

      {dirty && (
        <div className="flex items-center gap-2 rounded-xl border border-[#FEDF89] bg-[#FFFAEB] p-4 text-sm font-bold text-[#B54708]">
          <Sparkles size={17} />
          Alterações não salvas. Confira a prévia e clique em “Salvar
          alterações”.
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

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
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
              {activeArtName}
            </span>
          </div>

          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
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

          {channel === "instagram" && (
            <div className="mb-5 flex gap-2 rounded-xl bg-[#F2F4F7] p-1.5">
              <button
                type="button"
                onClick={() => setInstagramFormat("feed")}
                className={`min-h-10 flex-1 rounded-lg px-3 text-sm font-bold transition ${
                  instagramFormat === "feed"
                    ? "bg-white text-[#18202A] shadow-sm"
                    : "text-[#667085] hover:text-[#18202A]"
                }`}
              >
                Feed
              </button>
              <button
                type="button"
                onClick={() => setInstagramFormat("story")}
                className={`min-h-10 flex-1 rounded-lg px-3 text-sm font-bold transition ${
                  instagramFormat === "story"
                    ? "bg-white text-[#18202A] shadow-sm"
                    : "text-[#667085] hover:text-[#18202A]"
                }`}
              >
                Stories
              </button>
              <button
                type="button"
                disabled={!carouselEligible}
                title={
                  carouselEligible
                    ? "Ver Carrossel"
                    : "Adicione pelo menos 3 fotos ao imóvel"
                }
                onClick={() => setInstagramFormat("carousel")}
                className={`min-h-10 flex-1 rounded-lg px-3 text-sm font-bold transition ${
                  instagramFormat === "carousel"
                    ? "bg-white text-[#18202A] shadow-sm"
                    : carouselEligible
                      ? "text-[#667085] hover:text-[#18202A]"
                      : "text-[#98A2B3] opacity-60"
                }`}
              >
                {carouselEligible ? "Carrossel" : "Carrossel · + fotos"}
              </button>
            </div>
          )}

          {isStoryView ? (
            <VerticalCreativePreview
              property={storyProperty}
              brand={brand}
              platform="instagram_story"
              templateId={storyTemplateId}
              headline={storyHeadline}
              subheadline={storySubheadline}
              cta={storyCta}
              blockPosition={blockPositions.instagramStory}
              suggestedBlockPosition={suggestedBlockPositionFromTags(
                storyMedia?.aiTags,
              )}
            />
          ) : isCarouselView ? (
            <InstagramCarouselPreview
              property={carouselProperty}
              brand={brand}
              templateId={templateId}
              modelId={carouselModelId}
              headline={carouselHeadline}
              cta={carouselCta}
            />
          ) : isTiktokView ? (
            <VerticalCreativePreview
              property={tiktokProperty}
              brand={brand}
              platform="tiktok"
              templateId={tiktokTemplateId}
              headline={tiktokHeadline}
              subheadline={tiktokSubheadline}
              cta={tiktokCta}
              blockPosition={blockPositions.tiktok}
              suggestedBlockPosition={suggestedBlockPositionFromTags(
                tiktokMedia?.aiTags,
              )}
            />
          ) : (
            <CreativePreview
              property={feedProperty}
              brand={brand}
              templateId={templateId}
              headline={headline}
              subheadline={subheadline}
              copy={copy}
              cta={cta}
              blockPosition={activeNonVerticalPosition}
              suggestedBlockPosition={suggestedBlockPositionFromTags(
                feedMedia?.aiTags,
              )}
            />
          )}
        </div>

        <aside className="space-y-3">
          {adjusting ? (
            <div className="app-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-extrabold">
                    Ajustar campanha
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[#667085]">
                    O estilo vale para a campanha. Os demais ajustes valem
                    apenas para a mídia aberta.
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

              <div className="mt-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-extrabold">
                      Estilo da campanha
                    </div>
                    <p className="mt-1 text-xs leading-5 text-[#667085]">
                      Aplicado automaticamente aos formatos equivalentes de
                      todas as redes.
                    </p>
                  </div>
                  <span className="rounded-full bg-[#E9F4F1] px-2.5 py-1 text-[10px] font-bold text-[#176B5B]">
                    Padrão: Clean Base
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {campaignTemplates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      aria-pressed={templateId === template.id}
                      onClick={() => applyGlobalStyle(template.id)}
                      className={`overflow-hidden rounded-xl border text-left transition ${
                        templateId === template.id
                          ? "border-[#176B5B] ring-2 ring-[#176B5B]/10"
                          : "border-[#E4E7EC] hover:border-[#98A2B3]"
                      }`}
                    >
                      <TemplateThumbnail
                        property={feedProperty}
                        brand={brand}
                        templateId={template.id}
                      />
                      <div className="p-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-extrabold">
                            {template.name}
                          </span>
                          {templateId === template.id && (
                            <Check size={14} className="text-[#176B5B]" />
                          )}
                        </div>
                        <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-[#667085]">
                          {template.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {isCarouselView ? (
                <>
                  <InstagramCarouselControls
                    purpose={property.purpose}
                    modelId={carouselModelId}
                    headline={carouselHeadline}
                    cta={carouselCta}
                    onModelChange={(value) => {
                      setCarouselModelId(value);
                      markChanged();
                    }}
                    onHeadlineChange={(value) => {
                      setCarouselHeadline(value);
                      markChanged();
                    }}
                    onCtaChange={(value) => {
                      setCarouselCta(value);
                      markChanged();
                    }}
                  />

                  <div className="mt-5 border-t border-[#E4E7EC] pt-5">
                    <label className="block text-sm font-bold">
                      Legenda — Instagram
                      <textarea
                        className="app-input mt-2 min-h-28 py-3"
                        value={captions.instagram}
                        onChange={(event) => {
                          setCaptions((current) => ({
                            ...current,
                            instagram: event.target.value,
                          }));
                          markChanged();
                        }}
                      />
                    </label>
                  </div>
                </>
              ) : isVerticalView ? (
                <>
                  <VerticalTemplateControls
                    platform={isStoryView ? "instagram_story" : "tiktok"}
                    templateId={
                      isStoryView ? storyTemplateId : tiktokTemplateId
                    }
                    blockPosition={
                      isStoryView
                        ? blockPositions.instagramStory
                        : blockPositions.tiktok
                    }
                    headline={isStoryView ? storyHeadline : tiktokHeadline}
                    subheadline={
                      isStoryView ? storySubheadline : tiktokSubheadline
                    }
                    cta={isStoryView ? storyCta : tiktokCta}
                    onBlockPositionChange={(value) => {
                      setBlockPositions((current) => ({
                        ...current,
                        [isStoryView ? "instagramStory" : "tiktok"]: value,
                      }));
                      markChanged();
                    }}
                    onHeadlineChange={(value) => {
                      if (isStoryView) {
                        setStoryHeadline(value);
                      } else {
                        setTiktokHeadline(value);
                      }
                      markChanged();
                    }}
                    onSubheadlineChange={(value) => {
                      if (isStoryView) {
                        setStorySubheadline(value);
                      } else {
                        setTiktokSubheadline(value);
                      }
                      markChanged();
                    }}
                    onCtaChange={(value) => {
                      if (isStoryView) {
                        setStoryCta(value);
                      } else {
                        setTiktokCta(value);
                      }
                      markChanged();
                    }}
                  />

                  <div className="mt-5 border-t border-[#E4E7EC] pt-5">
                    <label className="block text-sm font-bold">
                      Legenda — {isStoryView ? "Instagram" : "TikTok"}
                      <textarea
                        className="app-input mt-2 min-h-28 py-3"
                        value={
                          isStoryView ? captions.instagram : captions.tiktok
                        }
                        onChange={(event) => {
                          const key = isStoryView ? "instagram" : "tiktok";
                          setCaptions((current) => ({
                            ...current,
                            [key]: event.target.value,
                          }));
                          markChanged();
                        }}
                      />
                      <span className="mt-1 block text-xs font-normal text-[#667085]">
                        A legenda é específica da rede e não precisa repetir o
                        texto da arte.
                      </span>
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <div className="mt-5 border-t border-[#E4E7EC] pt-5">
                    <div className="mb-4">
                      <div className="text-sm font-extrabold">
                        Textos desta arte
                      </div>
                      <p className="mt-1 text-xs leading-5 text-[#667085]">
                        Sem posicionamento livre: apenas opções seguras do
                        template.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {selectedTemplate.supportsBlockPosition && (
                        <BlockPositionControl
                          value={activeNonVerticalPosition}
                          onChange={updateNonVerticalPosition}
                        />
                      )}

                      <label className="block text-sm font-bold">
                        Headline
                        <input
                          className="app-input mt-2"
                          maxLength={60}
                          value={headline}
                          onChange={(event) => {
                            setHeadline(event.target.value);
                            markChanged();
                          }}
                        />
                        <span className="mt-1 block text-right text-[10px] font-normal text-[#98A2B3]">
                          {headline.length}/60
                        </span>
                      </label>

                      {selectedTemplate.supportsSubheadline && (
                        <label className="block text-sm font-bold">
                          Subheadline
                          <input
                            className="app-input mt-2"
                            maxLength={80}
                            value={subheadline}
                            onChange={(event) => {
                              setSubheadline(event.target.value);
                              markChanged();
                            }}
                          />
                          <span className="mt-1 block text-right text-[10px] font-normal text-[#98A2B3]">
                            {subheadline.length}/80
                          </span>
                        </label>
                      )}

                      <label className="block text-sm font-bold">
                        CTA
                        <input
                          className="app-input mt-2"
                          maxLength={36}
                          value={cta}
                          onChange={(event) => {
                            setCta(event.target.value);
                            markChanged();
                          }}
                        />
                        <span className="mt-1 block text-xs font-normal text-[#667085]">
                          {selectedTemplate.showsCtaOnArt
                            ? "Nesta arte, o CTA também aparece dentro da peça."
                            : "Usado na publicação; esta arte não coloca CTA sobre a foto."}
                        </span>
                      </label>

                      <label className="block text-sm font-bold">
                        Legenda —{" "}
                        {allChannels.find((item) => item.id === channel)?.label}
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
                          Troque de rede no topo para editar cada legenda.
                        </span>
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="app-card p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-[#667085]">
                {isStoryView
                  ? "Story selecionado"
                  : isCarouselView
                    ? "Carrossel selecionado"
                    : isTiktokView
                      ? "TikTok selecionado"
                      : "Arte selecionada"}
              </div>
              <p className="mt-2 font-extrabold">{activeArtName}</p>
              <p className="mt-1 text-sm leading-5 text-[#667085]">
                {isStoryView
                  ? selectedStoryTemplate.description
                  : isCarouselView
                    ? selectedCarouselModel.description
                    : isTiktokView
                      ? selectedTiktokTemplate.description
                      : selectedTemplate.useCase}
              </p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {isCarouselView ? (
                  <>
                    <MiniBadge label="4:5" />
                    <MiniBadge label={`${selectedCarouselModel.slideCount} páginas`} />
                    <MiniBadge label="Narrativa fixa" />
                  </>
                ) : isVerticalView ? (
                  <>
                    <MiniBadge label="9:16" />
                    <MiniBadge label="Headline" />
                    {(isStoryView
                      ? selectedStoryTemplate.supportsSubheadline
                      : selectedTiktokTemplate.supportsSubheadline) && (
                      <MiniBadge label="Subheadline" />
                    )}
                    <MiniBadge label="CTA" />
                    <MiniBadge label="Área segura" />
                  </>
                ) : (
                  <>
                    {selectedTemplate.showsLogo && <MiniBadge label="Logo" />}
                    <MiniBadge label="Headline" />
                    {selectedTemplate.supportsSubheadline && (
                      <MiniBadge label="Subheadline" />
                    )}
                    {selectedTemplate.showsPrice && <MiniBadge label="Preço" />}
                    {selectedTemplate.showsFeatures && (
                      <MiniBadge label="Características" />
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setAdjusting((value) => !value)}
            className="app-button-secondary w-full"
          >
            {adjusting ? "Fechar ajustes" : "Escolher/ajustar arte"}
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
            onClick={() => void renderCurrentCreative()}
            disabled={
              working !== null ||
              !property.image ||
              isTiktokView
            }
            title={
              isTiktokView
                ? "TikTok será gerado como vídeo/slideshow"
                : "Gerar arquivo final desta mídia"
            }
            className="app-button-secondary flex w-full items-center justify-center gap-2 disabled:opacity-50"
          >
            {working === "render" ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : (
              <ImageDown size={18} />
            )}
            {isCarouselView
              ? `Gerar ${selectedCarouselModel.slideCount} PNGs`
              : isStoryView
                ? "Gerar Story PNG"
                : isTiktokView
                  ? "TikTok · vídeo em breve"
                  : "Gerar PNG"}
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
            O agendamento já é salvo. A publicação automática começa quando o
            worker e as conexões sociais estiverem ativos.
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
  brand,
  templateId,
  headline,
  subheadline,
  copy,
  cta,
  blockPosition,
  suggestedBlockPosition,
}: {
  property: Property;
  brand: CampaignBrand;
  templateId: CampaignTemplateId;
  headline: string;
  subheadline: string;
  copy: string;
  cta: string;
  blockPosition: BlockPosition;
  suggestedBlockPosition?: "left" | "right" | null;
}) {
  const brandColor = safeBrandColor(brand.primaryColor);
  const brandText = contrastText(brandColor);
  const locality = [property.location, property.city]
    .filter(Boolean)
    .join(" · ");
  const features = featureItems(property);
  const price = priceText(property);
  const resolvedPosition = selectedTemplateSupportsPosition(templateId)
    ? resolveBlockPosition(blockPosition, undefined, suggestedBlockPosition)
    : "left";
  const sideClass =
    resolvedPosition === "right"
      ? "right-4 left-auto text-right"
      : "left-4 right-auto text-left";
  const innerAlignment =
    resolvedPosition === "right" ? "ml-auto text-right" : "mr-auto text-left";

  return (
    <div className="mx-auto max-w-[430px] overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white shadow-sm">
      <div
        className="relative aspect-[4/5] overflow-hidden bg-[#EAECF0]"
        data-render-target="feed"
      >
        <PropertyImage property={property} />

        {templateId === "clean-base" && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent p-5 pt-28 text-white">
            <div className={`max-w-[78%] ${innerAlignment}`}>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/75">
                {locality}
              </div>
              <div className="mt-2 text-3xl font-black leading-[1.05]">
                {headline}
              </div>
              <div className="mt-4 inline-flex rounded-full bg-white/95 px-3 py-1.5 text-sm font-black text-[#18202A]">
                {price}
              </div>
            </div>
          </div>
        )}

        {templateId === "clean-top" && (
          <>
            <div className={`absolute top-4 w-[78%] ${sideClass} rounded-2xl bg-white/95 p-4 shadow-sm backdrop-blur`}>
              <BrandMark brand={brand} compact />
              <div className="mt-3 text-2xl font-black leading-tight text-[#18202A]">
                {headline}
              </div>
              <div className="mt-1.5 text-sm leading-5 text-[#667085]">
                {subheadline}
              </div>
            </div>
            <div
              className={`absolute bottom-4 ${resolvedPosition === "right" ? "right-4" : "left-4"} rounded-xl px-4 py-2 text-base font-black shadow`}
              style={{ backgroundColor: brandColor, color: brandText }}
            >
              {price}
            </div>
          </>
        )}

        {templateId === "commercial" && (
          <>
            <div
              className="absolute left-4 top-4 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] shadow"
              style={{ backgroundColor: brandColor, color: brandText }}
            >
              {property.purpose}
            </div>
            <div className={`absolute bottom-4 w-[78%] ${sideClass} rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur`}>
              <div className="text-xl font-black leading-tight text-[#18202A]">
                {headline}
              </div>
              <div
                className="mt-3 text-3xl font-black"
                style={{ color: brandColor }}
              >
                {price}
              </div>
              <FeatureRow features={features} />
            </div>
          </>
        )}

        {templateId === "opportunity" && (
          <>
            <div className="absolute inset-x-0 top-5 flex justify-start">
              <div className="rounded-r-full bg-[#F79009] px-5 py-2 text-xs font-black uppercase tracking-[0.16em] text-white shadow">
                Oportunidade
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0">
              <div className="bg-black/72 px-5 py-4 text-white backdrop-blur-sm">
                <div className="text-xl font-black leading-tight">
                  {headline}
                </div>
                <FeatureRow features={features} inverse />
              </div>
              <div className="bg-[#F79009] px-5 py-3 text-center text-3xl font-black text-white">
                {price}
              </div>
            </div>
          </>
        )}

        {templateId === "info-card" && (
          <>
            <div className="absolute inset-x-0 top-0 h-[57%]" />
            <div className={`absolute bottom-0 min-h-[43%] w-[84%] ${resolvedPosition === "right" ? "right-0 left-auto text-right" : "left-0 right-auto text-left"} bg-white p-5 text-[#18202A]`}>
              <div className="flex items-center justify-between gap-3">
                <BrandMark brand={brand} compact />
                <span
                  className="text-lg font-black"
                  style={{ color: brandColor }}
                >
                  {price}
                </span>
              </div>
              <div className="mt-3 text-xl font-black leading-tight">
                {headline}
              </div>
              <div className="mt-1 text-sm text-[#667085]">
                {subheadline}
              </div>
              <FeatureRow features={features} />
              <div
                className="mt-4 rounded-xl px-3 py-2 text-center text-sm font-black"
                style={{ backgroundColor: brandColor, color: brandText }}
              >
                {cta}
              </div>
            </div>
          </>
        )}

        {templateId === "brand-frame" && (
          <>
            <div
              className="absolute inset-0 border-[10px]"
              style={{ borderColor: brandColor }}
            />
            <div className="absolute left-5 top-5 rounded-xl bg-white/95 px-3 py-2 shadow backdrop-blur">
              <BrandMark brand={brand} compact />
            </div>
            <div className={`absolute bottom-5 w-[78%] ${resolvedPosition === "right" ? "right-5 left-auto text-right" : "left-5 right-auto text-left"} rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur`}>
              <div className="text-2xl font-black leading-tight text-[#18202A]">
                {headline}
              </div>
              <div className="mt-1 text-sm text-[#667085]">
                {subheadline}
              </div>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div
                  className="text-xl font-black"
                  style={{ color: brandColor }}
                >
                  {price}
                </div>
                <div
                  className="rounded-full px-3 py-1.5 text-[11px] font-black"
                  style={{ backgroundColor: brandColor, color: brandText }}
                >
                  {cta}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="p-4">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[#98A2B3]">
          Legenda — prévia
        </div>
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

function selectedTemplateSupportsPosition(
  templateId: CampaignTemplateId,
) {
  return getCampaignTemplate(templateId).supportsBlockPosition;
}

function TemplateThumbnail({
  property,
  brand,
  templateId,
}: {
  property: Property;
  brand: CampaignBrand;
  templateId: CampaignTemplateId;
}) {
  const brandColor = safeBrandColor(brand.primaryColor);

  return (
    <div className="relative aspect-[4/5] overflow-hidden bg-[#EAECF0]">
      {property.image ? (
        <img
          src={property.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="absolute inset-0 bg-[#D0D5DD]" />
      )}

      {templateId === "clean-base" && (
        <div className="absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-t from-black/90 to-transparent p-2">
          <div className="mt-7 h-2 w-3/4 rounded bg-white" />
          <div className="mt-1.5 h-2 w-1/2 rounded bg-white/80" />
        </div>
      )}

      {templateId === "clean-top" && (
        <>
          <div className="absolute inset-x-2 top-2 rounded bg-white/95 p-2">
            <div className="h-1.5 w-1/3 rounded" style={{ backgroundColor: brandColor }} />
            <div className="mt-1.5 h-2 w-4/5 rounded bg-[#18202A]" />
            <div className="mt-1 h-1.5 w-2/3 rounded bg-[#98A2B3]" />
          </div>
          <div className="absolute bottom-2 right-2 h-4 w-1/3 rounded" style={{ backgroundColor: brandColor }} />
        </>
      )}

      {templateId === "commercial" && (
        <>
          <div className="absolute left-2 top-2 h-4 w-1/4 rounded" style={{ backgroundColor: brandColor }} />
          <div className="absolute inset-x-2 bottom-2 rounded bg-white/95 p-2">
            <div className="h-2 w-3/4 rounded bg-[#18202A]" />
            <div className="mt-1.5 h-3 w-1/2 rounded" style={{ backgroundColor: brandColor }} />
            <div className="mt-2 flex gap-1">
              <div className="h-2 flex-1 rounded bg-[#EAECF0]" />
              <div className="h-2 flex-1 rounded bg-[#EAECF0]" />
              <div className="h-2 flex-1 rounded bg-[#EAECF0]" />
            </div>
          </div>
        </>
      )}

      {templateId === "opportunity" && (
        <>
          <div className="absolute left-0 top-3 h-4 w-1/2 rounded-r-full bg-[#F79009]" />
          <div className="absolute inset-x-0 bottom-5 h-10 bg-black/70 p-2">
            <div className="h-2 w-3/4 rounded bg-white" />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-5 bg-[#F79009]" />
        </>
      )}

      {templateId === "info-card" && (
        <div className="absolute inset-x-0 bottom-0 h-[43%] bg-white p-2">
          <div className="h-1.5 w-1/3 rounded" style={{ backgroundColor: brandColor }} />
          <div className="mt-2 h-2 w-4/5 rounded bg-[#18202A]" />
          <div className="mt-1 h-1.5 w-2/3 rounded bg-[#98A2B3]" />
          <div className="mt-2 h-4 rounded" style={{ backgroundColor: brandColor }} />
        </div>
      )}

      {templateId === "brand-frame" && (
        <>
          <div className="absolute inset-0 border-[5px]" style={{ borderColor: brandColor }} />
          <div className="absolute left-2 top-2 h-4 w-1/3 rounded bg-white/95" />
          <div className="absolute inset-x-2 bottom-2 rounded bg-white/95 p-2">
            <div className="h-2 w-4/5 rounded bg-[#18202A]" />
            <div className="mt-1.5 h-2 w-1/2 rounded" style={{ backgroundColor: brandColor }} />
          </div>
        </>
      )}
    </div>
  );
}

function BrandMark({
  brand,
  compact = false,
}: {
  brand: CampaignBrand;
  compact?: boolean;
}) {
  if (brand.logoUrl) {
    return (
      <img
        src={brand.logoUrl}
        alt={brand.professionalName}
        className={compact ? "max-h-7 max-w-28 object-contain" : "max-h-10 max-w-36 object-contain"}
      />
    );
  }

  return (
    <span className="text-xs font-black uppercase tracking-wide text-[#18202A]">
      {brand.professionalName}
    </span>
  );
}

function FeatureRow({
  features,
  inverse = false,
}: {
  features: string[];
  inverse?: boolean;
}) {
  if (features.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {features.map((feature) => (
        <span
          key={feature}
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
            inverse
              ? "bg-white/15 text-white"
              : "bg-[#F2F4F7] text-[#475467]"
          }`}
        >
          {feature}
        </span>
      ))}
    </div>
  );
}

function MiniBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-[#F2F4F7] px-2.5 py-1 text-[10px] font-bold text-[#475467]">
      {label}
    </span>
  );
}

function featureItems(property: Property) {
  return [
    property.bedrooms ? `${property.bedrooms} quartos` : null,
    property.suites ? `${property.suites} suítes` : null,
    property.area ? `${property.area} m²` : null,
    property.parking ? `${property.parking} vagas` : null,
  ]
    .filter((item): item is string => Boolean(item))
    .slice(0, 3);
}

function priceText(property: Property) {
  if (property.price <= 0) return "Preço sob consulta";

  return `${formatBRL(property.price)}${property.purpose === "Aluguel" ? "/mês" : ""}`;
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
