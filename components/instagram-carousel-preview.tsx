"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";
import type { Property } from "@/types";
import type { CampaignTemplateId } from "@/lib/campaign-templates";
import {
  getCarouselModel,
  type CarouselModelId,
} from "@/lib/carousel-templates";
import { formatBRL } from "@/lib/utils";

type CarouselBrand = {
  professionalName: string;
  logoUrl?: string | null;
  primaryColor: string;
};

type Slide =
  | {
      kind: "cover";
      title: string;
      subtitle: string;
      image?: string;
    }
  | {
      kind: "facts";
      title: string;
      items: string[];
      image?: string;
    }
  | {
      kind: "photo";
      title: string;
      subtitle?: string;
      image?: string;
    }
  | {
      kind: "cta";
      title: string;
      subtitle: string;
    };

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

function priceText(property: Property) {
  if (property.price <= 0) return "Preço sob consulta";
  return `${formatBRL(property.price)}${property.purpose === "Aluguel" ? "/mês" : ""}`;
}

function propertyFacts(property: Property) {
  return [
    property.bedrooms ? `${property.bedrooms} quartos` : null,
    property.suites ? `${property.suites} suítes` : null,
    property.area ? `${property.area} m²` : null,
    property.parking ? `${property.parking} vagas` : null,
  ].filter((item): item is string => Boolean(item));
}

function buildSlides(
  property: Property,
  modelId: CarouselModelId,
  headline: string,
  cta: string,
): Slide[] {
  const images = property.images ?? (property.image ? [property.image] : []);
  const facts = propertyFacts(property);
  const highlights = property.highlights.filter(Boolean);
  const location = [property.location, property.city].filter(Boolean).join(" · ");
  const price = priceText(property);

  if (modelId === "direct-sale") {
    return [
      {
        kind: "cover",
        title: headline,
        subtitle: `${price} · ${location}`,
        image: images[0],
      },
      {
        kind: "facts",
        title: "Por que vale conhecer",
        items: [...highlights, ...facts].slice(0, 4),
      },
      {
        kind: "photo",
        title: "Conheça os ambientes",
        image: images[1],
      },
      {
        kind: "photo",
        title: "Mais detalhes do imóvel",
        subtitle: location,
        image: images[2],
      },
      {
        kind: "cta",
        title: cta,
        subtitle: price,
      },
    ];
  }

  if (modelId === "rent-practical") {
    return [
      {
        kind: "cover",
        title: headline,
        subtitle: `${price} · ${location}`,
        image: images[0],
      },
      {
        kind: "facts",
        title: "Características",
        items: facts.slice(0, 4),
      },
      {
        kind: "photo",
        title: "Veja por dentro",
        image: images[1],
      },
      {
        kind: "facts",
        title: "Localização e diferenciais",
        items: [location, ...highlights].filter(Boolean).slice(0, 4),
        image: images[2],
      },
      {
        kind: "cta",
        title: cta,
        subtitle: "Consulte disponibilidade e condições.",
      },
    ];
  }

  return [
    {
      kind: "cover",
      title: headline,
      subtitle: `${price} · ${location}`,
      image: images[0],
    },
    {
      kind: "facts",
      title: "Destaques do imóvel",
      items: [...highlights, ...facts].slice(0, 4),
    },
    {
      kind: "photo",
      title: "Ambientes para conhecer",
      image: images[1],
    },
    {
      kind: "photo",
      title: "Mais um olhar sobre o imóvel",
      image: images[2],
    },
    {
      kind: "facts",
      title: "Localização e características",
      items: [location, ...facts].filter(Boolean).slice(0, 4),
      image: images[3],
    },
    {
      kind: "cta",
      title: cta,
      subtitle: price,
    },
  ];
}

function visualTreatment(templateId: CampaignTemplateId) {
  if (templateId === "opportunity") return "opportunity";
  if (templateId === "brand-frame") return "branding";
  if (templateId === "commercial" || templateId === "info-card") {
    return "commercial";
  }
  return "clean";
}

function SlideArtwork({
  slide,
  brand,
  templateId,
  index,
  total,
}: {
  slide: Slide;
  brand: CarouselBrand;
  templateId: CampaignTemplateId;
  index: number;
  total: number;
}) {
  const brandColor = safeBrandColor(brand.primaryColor);
  const brandText = contrastText(brandColor);
  const treatment = visualTreatment(templateId);
  const accent = treatment === "opportunity" ? "#F79009" : brandColor;
  const accentText = contrastText(accent);

  return (
    <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#EAECF0]">
      {slide.kind !== "cta" && slide.kind !== "facts" && slide.image && (
        <img
          src={slide.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      )}

      {slide.kind === "cover" && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/20" />
          {treatment === "branding" && (
            <div
              className="absolute inset-0 border-[10px]"
              style={{ borderColor: brandColor }}
            />
          )}
          <div className="absolute inset-x-5 bottom-6 text-white">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
              {brand.professionalName}
            </div>
            <div className="mt-2 text-3xl font-black leading-[1.04]">
              {slide.title}
            </div>
            <div
              className="mt-4 inline-flex rounded-full px-3 py-1.5 text-xs font-black"
              style={{
                backgroundColor: treatment === "clean" ? "#FFFFFF" : accent,
                color: treatment === "clean" ? "#18202A" : accentText,
              }}
            >
              {slide.subtitle}
            </div>
          </div>
        </>
      )}

      {slide.kind === "facts" && (
        <>
          {slide.image ? (
            <>
              <img
                src={slide.image}
                alt=""
                className="absolute inset-x-0 top-0 h-[38%] w-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-x-0 bottom-0 top-[36%] rounded-t-3xl bg-white p-5">
                <div
                  className="mb-3 h-1.5 w-12 rounded-full"
                  style={{ backgroundColor: accent }}
                />
                <div className="text-2xl font-black leading-tight text-[#18202A]">
                  {slide.title}
                </div>
                <div className="mt-4 space-y-2">
                  {(slide.items.length > 0
                    ? slide.items
                    : ["Consulte os detalhes deste imóvel."]
                  ).map((item) => (
                    <div
                      key={item}
                      className="rounded-xl bg-[#F2F4F7] px-3 py-2 text-sm font-bold text-[#475467]"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="absolute inset-5 flex flex-col justify-end rounded-2xl bg-white p-5 shadow-xl">
              <div
                className="mb-3 h-1.5 w-12 rounded-full"
                style={{ backgroundColor: accent }}
              />
              <div className="text-2xl font-black leading-tight text-[#18202A]">
                {slide.title}
              </div>
              <div className="mt-4 space-y-2">
                {(slide.items.length > 0
                  ? slide.items
                  : ["Consulte os detalhes deste imóvel."]
                ).map((item) => (
                  <div
                    key={item}
                    className="rounded-xl bg-[#F2F4F7] px-3 py-2 text-sm font-bold text-[#475467]"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {slide.kind === "photo" && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
          <div className="absolute inset-x-5 bottom-6 text-white">
            <div className="text-2xl font-black leading-tight">{slide.title}</div>
            {slide.subtitle && (
              <div className="mt-2 text-sm text-white/80">{slide.subtitle}</div>
            )}
          </div>
        </>
      )}

      {slide.kind === "cta" && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
          style={{ backgroundColor: accent, color: accentText }}
        >
          {brand.logoUrl ? (
            <img
              src={brand.logoUrl}
              alt={brand.professionalName}
              className="mb-6 max-h-12 max-w-40 object-contain"
            />
          ) : (
            <div className="mb-5 text-xs font-black uppercase tracking-[0.18em]">
              {brand.professionalName}
            </div>
          )}
          <div className="text-3xl font-black leading-tight">{slide.title}</div>
          <div className="mt-4 text-sm font-bold opacity-80">{slide.subtitle}</div>
        </div>
      )}

      <div className="absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-bold text-white">
        {index + 1}/{total}
      </div>
    </div>
  );
}

export function InstagramCarouselPreview({
  property,
  brand,
  templateId,
  modelId,
  headline,
  cta,
}: {
  property: Property;
  brand: CarouselBrand;
  templateId: CampaignTemplateId;
  modelId: CarouselModelId;
  headline: string;
  cta: string;
}) {
  const slides = useMemo(
    () => buildSlides(property, modelId, headline, cta),
    [property, modelId, headline, cta],
  );
  const [active, setActive] = useState(0);
  const model = getCarouselModel(modelId);

  const safeActive = Math.min(active, slides.length - 1);

  return (
    <div className="mx-auto w-full max-w-[470px]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-[#176B5B]">
            Carrossel · {model.name}
          </div>
          <div className="mt-1 text-xs text-[#667085]">
            {slides.length} páginas montadas automaticamente
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={safeActive === 0}
            onClick={() => setActive((value) => Math.max(0, value - 1))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E4E7EC] bg-white disabled:opacity-40"
            aria-label="Slide anterior"
          >
            <ChevronLeft size={17} />
          </button>
          <button
            type="button"
            disabled={safeActive === slides.length - 1}
            onClick={() =>
              setActive((value) => Math.min(slides.length - 1, value + 1))
            }
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E4E7EC] bg-white disabled:opacity-40"
            aria-label="Próximo slide"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>

      <SlideArtwork
        slide={slides[safeActive]}
        brand={brand}
        templateId={templateId}
        index={safeActive}
        total={slides.length}
      />

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {slides.map((slide, index) => (
          <button
            key={`${slide.kind}-${index}`}
            type="button"
            onClick={() => setActive(index)}
            className={`w-16 shrink-0 overflow-hidden rounded-lg border ${
              safeActive === index
                ? "border-[#176B5B] ring-2 ring-[#176B5B]/10"
                : "border-[#E4E7EC]"
            }`}
          >
            <div className="relative aspect-[4/5] bg-[#EAECF0]">
              {"image" in slide && slide.image ? (
                <img
                  src={slide.image}
                  alt=""
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Images size={16} className="text-[#98A2B3]" />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-center text-[9px] font-bold text-white">
                {index + 1}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
