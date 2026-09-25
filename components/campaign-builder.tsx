"use client";

import { useMemo, useState } from "react";
import {
  CalendarClock,
  Check,
  ImageDown,
  CheckCircle2,
  ChevronDown,
  LoaderCircle,
  Save,
  Sparkles,
  WandSparkles,
  X,
} from "lucide-react";
import {
  ensureCampaignVariant,
  getCampaignRenderRequirements,
  registerRenderedAssets,
  validateCampaignScheduleTime,
  saveCampaignDraft,
  publishCampaignNow,
  scheduleCampaignDraft,
  type CampaignDraftInput,
} from "@/app/campanhas/actions";
import {
  campaignTemplates,
  getCampaignTemplate,
  normalizeCampaignTemplate,
  type CampaignTemplateId,
} from "@/lib/campaign-templates";
import {
  CreativePreview,
  TemplateThumbnail,
  safeBrandColor,
  type CampaignBrand,
} from "@/components/campaign/creative-preview";
import { CampaignRenderWorkspace } from "@/components/campaign/campaign-render-workspace";
import {
  campaignTemplateToVertical,
  normalizeBlockPosition,
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
import {
  cleanupCampaignAssetFolder,
  createCampaignAssetSignedUrls,
  removeCampaignAssetPaths,
  renderAndUploadCampaignAssets,
} from "@/lib/campaign-renderer";
import type { PublishProvider } from "@/lib/publication-plan";
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

type SocialConnectionSummary = {
  provider: "instagram" | "facebook" | "tiktok" | "google_business";
  status: string;
  display_name: string | null;
};

type InitialCampaign = {
  id: string;
  visualStyle: string;
  headline: string;
  subheadline: string;
  cta: string;
  status: string;
  scheduledFor?: string | null;
  publishProviders?: PublishProvider[];
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
  socialConnections = [],
}: {
  propertyData: Property;
  brand: CampaignBrand;
  campaignData?: InitialCampaign;
  mediaAnalysisJobId?: string | null;
  socialConnections?: SocialConnectionSummary[];
}) {
  const property = propertyData;
  const connectedMetaProviders = socialConnections
    .filter(
      (connection) =>
        connection.status === "connected" &&
        (connection.provider === "instagram" ||
          connection.provider === "facebook"),
    )
    .map((connection) => connection.provider);
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
  const [publishProviders, setPublishProviders] = useState<PublishProvider[]>(
    () =>
      campaignData?.publishProviders ??
      Array.from(new Set<PublishProvider>(connectedMetaProviders)),
  );
  const [status, setStatus] = useState(campaignData?.status ?? "draft");
  const [working, setWorking] = useState<
    "save" | "schedule" | "publish" | "render" | null
  >(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [renderedDownloads, setRenderedDownloads] = useState<
    Array<{ path: string; url: string }>
  >([]);
  const [renderedLabel, setRenderedLabel] = useState("");
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
  const facebookMedia = resolveSavedMedia(
    campaignData?.mediaSelection?.facebook,
    recommendation.media.feedCover,
  );
  const googleMedia = resolveSavedMedia(
    campaignData?.mediaSelection?.google,
    recommendation.media.feedCover,
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
  const facebookProperty: Property = {
    ...property,
    image: facebookMedia?.url ?? property.image,
  };
  const googleProperty: Property = {
    ...property,
    image: googleMedia?.url ?? property.image,
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
  const activeNonVerticalProperty =
    channel === "facebook"
      ? facebookProperty
      : channel === "google"
        ? googleProperty
        : feedProperty;
  const activeNonVerticalMedia =
    channel === "facebook"
      ? facebookMedia
      : channel === "google"
        ? googleMedia
        : feedMedia;
  const activeNonVerticalPosition =
    channel === "facebook"
      ? blockPositions.facebook
      : channel === "google"
        ? blockPositions.google
        : blockPositions.instagramFeed;

  function markChanged() {
    setDirty(true);
    setMessage("");
    setRenderedDownloads([]);
    setRenderedLabel("");
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

  function togglePublishProvider(provider: PublishProvider) {
    setPublishProviders((current) =>
      current.includes(provider)
        ? current.filter((item) => item !== provider)
        : [...current, provider],
    );
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
      publishProviders,
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
        facebook: facebookMedia?.id,
        tiktok: tiktokMedia?.id,
        google: googleMedia?.id,
        carousel: carouselMedia
          .map((item) => item.id)
          .filter((id): id is string => Boolean(id)),
      },
      blockPositions,
    };
  }

  type StaticRenderConfig = {
    provider: "instagram" | "facebook" | "google_business";
    format: string;
    selector: string;
    width: number;
    height: number;
  };

  async function renderRegisteredAssets(
    campaignId: string,
    config: StaticRenderConfig,
  ) {
    const paths = await renderAndUploadCampaignAssets({
      campaignId,
      ...config,
    });

    try {
      await registerRenderedAssets({
        campaignId,
        provider: config.provider,
        format: config.format,
        paths,
      });
    } catch (registerError) {
      await removeCampaignAssetPaths(paths);
      throw registerError;
    }

    await cleanupCampaignAssetFolder({
      campaignId,
      provider: config.provider,
      format: config.format,
      keepPaths: paths,
    });

    return paths;
  }

  function staticRenderConfigs(): StaticRenderConfig[] {
    const configs: StaticRenderConfig[] = [
      {
        provider: "instagram",
        format: "feed_4x5",
        selector: '[data-render-target="schedule-instagram-feed"]',
        width: 1080,
        height: 1350,
      },
      {
        provider: "instagram",
        format: "story_9x16",
        selector: '[data-render-target="schedule-story"]',
        width: 1080,
        height: 1920,
      },
      {
        provider: "facebook",
        format: "feed",
        selector: '[data-render-target="schedule-facebook"]',
        width: 1080,
        height: 1350,
      },
      {
        provider: "google_business",
        format: "post",
        selector: '[data-render-target="schedule-google"]',
        width: 1080,
        height: 1350,
      },
    ];

    if (carouselEligible) {
      configs.splice(2, 0, {
        provider: "instagram",
        format: "carousel_4x5",
        selector: '[data-render-carousel-slide="schedule-carousel"]',
        width: 1080,
        height: 1350,
      });
    }

    return configs;
  }

  async function prepareSelectedPublishAssets(campaignId: string) {
    if (publishProviders.length === 0) return 0;

    const required = await getCampaignRenderRequirements(campaignId);
    const requiredKeys = new Set(
      required.map((item) => `${item.provider}:${item.format}`),
    );

    const configs = staticRenderConfigs().filter(
      (config) =>
        publishProviders.includes(config.provider) &&
        requiredKeys.has(`${config.provider}:${config.format}`),
    );

    for (const [index, config] of configs.entries()) {
      setMessage(
        `Preparando arquivos finais (${index + 1}/${configs.length})…`,
      );
      await renderRegisteredAssets(campaignId, config);
    }

    return configs.length;
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

  async function publishNow() {
    if (!property.image) {
      setError("Adicione pelo menos uma foto antes de publicar a campanha.");
      return;
    }

    if (publishProviders.length === 0) {
      setError("Selecione pelo menos uma rede conectada para publicar.");
      return;
    }

    setWorking("publish");
    setError("");
    setMessage("");
    setRenderedDownloads([]);
    setRenderedLabel("");

    try {
      const savedId = await saveCampaignDraft(draftInput());
      setPersistedCampaignId(savedId);
      setDirty(false);

      const renderedCount = await prepareSelectedPublishAssets(savedId);

      const publishResult = await publishCampaignNow({
        ...draftInput(),
        campaignId: savedId,
      });

      if (!publishResult.ok) {
        setError(publishResult.message);
        setMessage("");
        return;
      }

      setPersistedCampaignId(publishResult.campaignId);
      setStatus("publishing");
      setDirty(false);
      setMessage(
        renderedCount > 0
          ? `Arquivos atualizados e publicação enviada para ${publishResult.queuedProviders.length} rede${publishResult.queuedProviders.length === 1 ? "" : "s"}.`
          : `Publicação enviada para ${publishResult.queuedProviders.length} rede${publishResult.queuedProviders.length === 1 ? "" : "s"}.`,
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível iniciar a publicação.",
      );
    } finally {
      setWorking(null);
    }
  }

  async function schedule() {
    if (!scheduledFor) return;

    if (!property.image) {
      setError("Adicione pelo menos uma foto antes de agendar a campanha.");
      return;
    }

    setWorking("schedule");
    setError("");
    setMessage("");
    setRenderedDownloads([]);
    setRenderedLabel("");

    try {
      const requestedDate = new Date(scheduledFor);

      if (Number.isNaN(requestedDate.getTime())) {
        setError("Escolha uma data e horário válidos.");
        return;
      }

      const validation = await validateCampaignScheduleTime(
        requestedDate.toISOString(),
      );

      if (!validation.ok) {
        setError(validation.message);
        return;
      }

      const savedId = await saveCampaignDraft(draftInput());
      setPersistedCampaignId(savedId);
      setDirty(false);

      const renderedCount = await prepareSelectedPublishAssets(savedId);

      const scheduleResult = await scheduleCampaignDraft(
        {
          ...draftInput(),
          campaignId: savedId,
        },
        validation.scheduledFor,
      );

      if (!scheduleResult.ok) {
        setError(scheduleResult.message);
        setMessage("");
        return;
      }

      const id = scheduleResult.campaignId;
      setPersistedCampaignId(id);
      setStatus("scheduled");
      setScheduleOpen(false);
      setDirty(false);

      const queuedProviders = scheduleResult.queuedProviders;

      if (queuedProviders.length === 0) {
        setMessage(
          `Agendamento salvo para ${new Date(scheduledFor).toLocaleString("pt-BR")}. Nenhuma rede foi selecionada para publicação automática.`,
        );
      } else if (renderedCount > 0) {
        setMessage(
          `Campanha agendada para publicação e ${renderedCount} formato${renderedCount === 1 ? "" : "s"} atualizado${renderedCount === 1 ? "" : "s"} automaticamente.`,
        );
      } else {
        setMessage(
          `Campanha agendada para publicação em ${new Date(scheduledFor).toLocaleString("pt-BR")}. Os arquivos já estavam atualizados.`,
        );
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível preparar e agendar a campanha.",
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
    setRenderedDownloads([]);
    setRenderedLabel("");

    try {
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

      let campaignId = persistedCampaignId;

      if (!campaignId || dirty) {
        campaignId = await saveCampaignDraft(draftInput());
        setPersistedCampaignId(campaignId);
        setDirty(false);
        setStatus((current) =>
          current === "scheduled" ? "scheduled" : "ready",
        );
      }

      const input = {
        ...draftInput(),
        campaignId,
      };

      campaignId = await ensureCampaignVariant(
        input,
        config.provider,
        config.format,
      );

      setPersistedCampaignId(campaignId);

      const paths = await renderRegisteredAssets(
        campaignId,
        config,
      );

      const signedFiles = await createCampaignAssetSignedUrls(paths);
      setRenderedDownloads(signedFiles);
      setRenderedLabel(activeArtName);

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
              property={activeNonVerticalProperty}
              brand={brand}
              templateId={templateId}
              headline={headline}
              subheadline={subheadline}
              copy={copy}
              cta={cta}
              blockPosition={activeNonVerticalPosition}
              suggestedBlockPosition={suggestedBlockPositionFromTags(
                activeNonVerticalMedia?.aiTags,
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
              ? `Gerar ${selectedCarouselModel.slideCount} JPGs`
              : isStoryView
                ? "Gerar Story JPG"
                : isTiktokView
                  ? "TikTok · vídeo em breve"
                  : "Gerar JPG"}
          </button>

          {renderedDownloads.length > 0 && (
            <div className="rounded-xl border border-[#D1E9E2] bg-[#F6FEFC] p-3">
              <div className="text-xs font-extrabold text-[#176B5B]">
                Arquivo gerado · {renderedLabel}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {renderedDownloads.map((file, index) => (
                  <a
                    key={file.path}
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-[#176B5B] shadow-sm ring-1 ring-[#D1E9E2]"
                  >
                    {renderedDownloads.length > 1
                      ? `Abrir página ${index + 1}`
                      : "Abrir JPG"}
                  </a>
                ))}
              </div>
              <div className="mt-2 text-[10px] leading-4 text-[#667085]">
                Links temporários de 10 minutos. O arquivo permanece salvo na campanha.
              </div>
            </div>
          )}

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

      <CampaignRenderWorkspace
        brand={brand}
        templateId={templateId}
        headline={headline}
        subheadline={subheadline}
        cta={cta}
        instagramFeed={{
          property: feedProperty,
          caption: captions.instagram,
          blockPosition: blockPositions.instagramFeed,
          aiTags: feedMedia?.aiTags,
        }}
        story={{
          property: storyProperty,
          templateId: storyTemplateId,
          headline: storyHeadline,
          subheadline: storySubheadline,
          cta: storyCta,
          blockPosition: blockPositions.instagramStory,
          aiTags: storyMedia?.aiTags,
        }}
        facebook={{
          property: facebookProperty,
          caption: captions.facebook,
          blockPosition: blockPositions.facebook,
          aiTags: facebookMedia?.aiTags,
        }}
        google={{
          property: googleProperty,
          caption: captions.google,
          blockPosition: blockPositions.google,
          aiTags: googleMedia?.aiTags,
        }}
        carousel={
          carouselEligible
            ? {
                property: carouselProperty,
                modelId: carouselModelId,
                headline: carouselHeadline,
                cta: carouselCta,
              }
            : undefined
        }
      />

      {scheduleOpen && (
        <section className="app-card p-5 sm:p-6">
          <h3 className="text-lg font-extrabold">Agendar campanha</h3>
          <p className="mt-1 text-sm text-[#667085]">
            Escolha quando publicar e em quais redes conectadas. Se nenhuma rede
            for marcada, o agendamento fica apenas no calendário.
          </p>

          <div className="mt-5">
            <div className="text-sm font-extrabold">Onde publicar</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {(["instagram", "facebook"] as const).map((provider) => {
                const connection = socialConnections.find(
                  (item) =>
                    item.provider === provider && item.status === "connected",
                );
                const connected = Boolean(connection);
                const selected = publishProviders.includes(provider);

                return (
                  <label
                    key={provider}
                    className={`flex min-h-20 items-start gap-3 rounded-xl border p-4 ${
                      connected
                        ? "border-[#D0D5DD] bg-white"
                        : "border-[#EAECF0] bg-[#F9FAFB]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected && connected}
                      disabled={!connected || working !== null}
                      onChange={() => togglePublishProvider(provider)}
                      className="mt-1 h-5 w-5 accent-[#176B5B]"
                    />
                    <span className="min-w-0">
                      <span className="block font-bold">
                        {provider === "instagram" ? "Instagram" : "Facebook"}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-[#667085]">
                        {connected
                          ? connection?.display_name ||
                            "Conta conectada"
                          : "Não conectado"}
                      </span>
                      {provider === "instagram" && connected ? (
                        <span className="mt-1 block text-[11px] leading-4 text-[#667085]">
                          Inclui Feed, Story e Carrossel quando disponível.
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </div>

            {connectedMetaProviders.length === 0 ? (
              <p className="mt-3 text-xs leading-5 text-[#667085]">
                Nenhuma rede Meta está conectada. Você ainda pode salvar o
                horário no calendário ou conectar Facebook/Instagram em
                Configurações.
              </p>
            ) : publishProviders.length === 0 ? (
              <p className="mt-3 text-xs font-semibold text-[#B54708]">
                Nenhuma rede selecionada: não haverá publicação automática.
              </p>
            ) : null}
          </div>

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

function MiniBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-[#F2F4F7] px-2.5 py-1 text-[10px] font-bold text-[#475467]">
      {label}
    </span>
  );
}
