import type { Property, SocialChannel } from "@/types";
import {
  DEFAULT_CAMPAIGN_TEMPLATE_ID,
  type CampaignTemplateId,
} from "@/lib/campaign-templates";
import {
  defaultCarouselModel,
  type CarouselModelId,
} from "@/lib/carousel-templates";
import { campaignTemplateToVertical } from "@/lib/campaign-layout";
import type { VerticalTemplateId } from "@/lib/vertical-templates";
import { formatBRL } from "@/lib/utils";
import { buildMediaSelection } from "@/lib/media-intelligence";

export type CampaignRecommendation = {
  style: CampaignTemplateId;
  headline: string;
  subheadline: string;
  cta: string;
  captions: Record<SocialChannel, string>;
  instagramStory: {
    templateId: VerticalTemplateId;
    headline: string;
    subheadline: string;
    cta: string;
  };
  tiktokVertical: {
    templateId: VerticalTemplateId;
    headline: string;
    subheadline: string;
    cta: string;
  };
  instagramCarousel: {
    modelId: CarouselModelId;
    headline: string;
    cta: string;
  };
  media: {
    feedCover?: { id?: string; url: string };
    storyCover?: { id?: string; url: string };
    tiktokCover?: { id?: string; url: string };
    carousel: Array<{ id?: string; url: string }>;
  };
};

const carouselCtasByPurpose = {
  Venda: [
    "Agende uma visita",
    "Quero saber mais",
    "Fale com o corretor",
    "Conheça este imóvel",
    "Tire suas dúvidas",
    "Solicite mais informações",
  ],
  Aluguel: [
    "Consulte disponibilidade",
    "Agende uma visita",
    "Quero saber mais",
    "Fale com o corretor",
    "Tire suas dúvidas",
    "Conheça este imóvel",
  ],
} as const;

function carouselCtaForPurpose(purpose: Property["purpose"]) {
  const options = carouselCtasByPurpose[purpose] ?? carouselCtasByPurpose.Venda;
  return options[Math.floor(Math.random() * options.length)];
}

function compact(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function truncate(value: string, limit: number) {
  const clean = compact(value);

  if (clean.length <= limit) return clean;

  const clipped = clean.slice(0, Math.max(0, limit - 1)).trimEnd();
  const lastSpace = clipped.lastIndexOf(" ");

  if (lastSpace >= Math.floor(limit * 0.6)) {
    return `${clipped.slice(0, lastSpace)}…`;
  }

  return `${clipped}…`;
}

function locationText(property: Property) {
  return [property.location, property.city].filter(Boolean).join(" · ");
}

function factItems(property: Property) {
  return [
    property.bedrooms ? `${property.bedrooms} quartos` : null,
    property.suites ? `${property.suites} suítes` : null,
    property.area ? `${property.area} m²` : null,
    property.parking ? `${property.parking} vagas` : null,
  ].filter((item): item is string => Boolean(item));
}

function priceText(property: Property) {
  if (property.price <= 0) return "";

  const suffix = property.purpose === "Aluguel" ? "/mês" : "";
  return `${formatBRL(property.price)}${suffix}`;
}

function strongestHeadline(property: Property) {
  return (
    property.highlights.find((item) => compact(item).length > 0) ??
    property.title
  );
}

function supportLine(property: Property) {
  const secondHighlight = property.highlights
    .map(compact)
    .filter(Boolean)
    .find((item) => item !== compact(strongestHeadline(property)));

  return secondHighlight ?? locationText(property);
}

function descriptionSentence(property: Property) {
  const description = compact(property.description);

  if (description) return truncate(description, 190);

  const facts = factItems(property);
  const location = locationText(property);

  if (facts.length > 0) {
    return `${facts.slice(0, 3).join(" · ")}${location ? ` em ${location}` : ""}.`;
  }

  return location
    ? `Conheça este imóvel em ${location}.`
    : "Conheça os detalhes deste imóvel.";
}

function instagramCaption(property: Property) {
  const price = priceText(property);
  const body = descriptionSentence(property);
  const headline = truncate(strongestHeadline(property), 70);

  return compact(
    `${headline}. ${body}${price ? ` Valor: ${price}.` : ""} Fale comigo para saber mais.`,
  );
}

function facebookCaption(property: Property) {
  const facts = factItems(property);
  const location = locationText(property);
  const price = priceText(property);

  return compact(
    `${truncate(property.title, 80)}. ${facts.slice(0, 4).join(" · ")}${
      location ? `. Localização: ${location}` : ""
    }${price ? `. Valor: ${price}` : ""}. Entre em contato para conhecer os detalhes.`,
  );
}

function tiktokCaption(property: Property) {
  const location = locationText(property);
  const facts = factItems(property).slice(0, 2);

  return compact(
    `Conheça ${truncate(property.title.toLowerCase(), 70)}${
      location ? ` em ${location}` : ""
    }.${facts.length ? ` ${facts.join(" · ")}.` : ""} Veja mais detalhes.`,
  );
}

function googleCaption(property: Property) {
  const location = locationText(property);
  const facts = factItems(property);
  const price = priceText(property);

  return compact(
    `${truncate(property.title, 85)}${
      location ? ` em ${location}` : ""
    }.${facts.length ? ` ${facts.slice(0, 4).join(" · ")}.` : ""}${
      price ? ` Valor: ${price}.` : ""
    } Entre em contato para informações e disponibilidade.`,
  );
}

export function buildCampaignRecommendation(
  property: Property,
): CampaignRecommendation {
  const style = DEFAULT_CAMPAIGN_TEMPLATE_ID;
  const verticalTemplate = campaignTemplateToVertical(style);
  const headline = truncate(strongestHeadline(property), 60);
  const carouselCta = carouselCtaForPurpose(property.purpose);
  const subheadline = truncate(supportLine(property), 80);
  const fallbackMedia = Array.from(
    new Set(
      [...(property.images ?? []), ...(property.image ? [property.image] : [])]
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ).map((url, index) => ({
    url,
    isCover: index === 0,
    sortOrder: index,
  }));

  const mediaSelection = buildMediaSelection(
    property.media?.length ? property.media : fallbackMedia,
    property.coverManuallySelected ?? false,
  );

  return {
    style,
    headline,
    subheadline,
    cta: "Fale comigo no WhatsApp",
    captions: {
      instagram: instagramCaption(property),
      facebook: facebookCaption(property),
      tiktok: tiktokCaption(property),
      google: googleCaption(property),
    },
    instagramStory: {
      templateId: verticalTemplate,
      headline: truncate(strongestHeadline(property), 46),
      subheadline: truncate(supportLine(property), 64),
      cta: "Fale comigo",
    },
    tiktokVertical: {
      templateId: verticalTemplate,
      headline: truncate(
        property.location && property.location !== "Localização não informada"
          ? `Conheça este imóvel em ${property.location}`
          : strongestHeadline(property),
        42,
      ),
      subheadline: truncate(supportLine(property), 60),
      cta: "Veja mais detalhes",
    },
    instagramCarousel: {
      modelId: defaultCarouselModel(property.purpose),
      headline,
      cta: carouselCta,
    },
    media: {
      feedCover: mediaSelection.feedCover
        ? {
            id: mediaSelection.feedCover.id,
            url: mediaSelection.feedCover.url,
          }
        : undefined,
      storyCover: mediaSelection.storyCover
        ? {
            id: mediaSelection.storyCover.id,
            url: mediaSelection.storyCover.url,
          }
        : undefined,
      tiktokCover: mediaSelection.tiktokCover
        ? {
            id: mediaSelection.tiktokCover.id,
            url: mediaSelection.tiktokCover.url,
          }
        : undefined,
      carousel: mediaSelection.carousel.map((item) => ({
        id: item.id,
        url: item.url,
      })),
    },
  };
}
