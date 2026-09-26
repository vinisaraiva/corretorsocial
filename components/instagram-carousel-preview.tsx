"use client";

import { useMemo, useState } from "react";
import {
  Bath,
  BedDouble,
  CarFront,
  ChevronLeft,
  ChevronRight,
  Images,
  KeyRound,
  MessageCircle,
  Ruler,
  type LucideIcon,
} from "lucide-react";
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
  whatsapp?: string | null;
};

type StructuredFactKind =
  | "bedrooms"
  | "suites"
  | "bathrooms"
  | "parking"
  | "area";

type StructuredFact = {
  kind: StructuredFactKind;
  label: string;
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
      structuredItems?: StructuredFact[];
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

function brandAccent(hex: string) {
  const color = hex.replace("#", "");
  const r = Number.parseInt(color.slice(0, 2), 16);
  const g = Number.parseInt(color.slice(2, 4), 16);
  const b = Number.parseInt(color.slice(4, 6), 16);

  const warm = r > g * 1.12 && r > b * 1.12;
  return warm ? "#163B4D" : "#F6A623";
}

function priceText(property: Property) {
  if (property.price <= 0) return "Preço sob consulta";
  return `${formatBRL(property.price)}${property.purpose === "Aluguel" ? "/mês" : ""}`;
}

function formatWhatsapp(value?: string | null) {
  const digits = (value ?? "").replace(/\D/g, "");
  if (!digits) return "";

  const local = digits.startsWith("55") ? digits.slice(2) : digits;

  if (local.length === 11) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  }

  if (local.length === 10) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  }

  return value ?? "";
}

function plural(value: number, singular: string, pluralForm: string) {
  return `${value} ${value === 1 ? singular : pluralForm}`;
}

function propertyStructuredFacts(property: Property): StructuredFact[] {
  return [
    property.bedrooms
      ? {
          kind: "bedrooms" as const,
          label: plural(property.bedrooms, "quarto", "quartos"),
        }
      : null,
    property.suites
      ? {
          kind: "suites" as const,
          label: plural(property.suites, "suíte", "suítes"),
        }
      : null,
    property.bathrooms
      ? {
          kind: "bathrooms" as const,
          label: plural(property.bathrooms, "banheiro", "banheiros"),
        }
      : null,
    property.parking
      ? {
          kind: "parking" as const,
          label: plural(property.parking, "vaga", "vagas"),
        }
      : null,
    property.area
      ? {
          kind: "area" as const,
          label: `${property.area} m²`,
        }
      : null,
  ].filter((item): item is StructuredFact => Boolean(item));
}

function structuredFactIcon(kind: StructuredFactKind): LucideIcon {
  switch (kind) {
    case "bedrooms":
      return BedDouble;
    case "suites":
      return KeyRound;
    case "bathrooms":
      return Bath;
    case "parking":
      return CarFront;
    case "area":
      return Ruler;
  }
}

function buildSlides(
  property: Property,
  modelId: CarouselModelId,
  headline: string,
  cta: string,
): Slide[] {
  const images = property.images ?? (property.image ? [property.image] : []);
  const structuredFacts = propertyStructuredFacts(property);
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
        title: "Informações principais",
        items: [],
        structuredItems: structuredFacts.slice(0, 6),
        image: images[1] ?? images[0],
      },
      {
        kind: "photo",
        title: "Conheça os ambientes",
        image: images[2] ?? images[1] ?? images[0],
      },
      {
        kind: "photo",
        title: "Mais detalhes do imóvel",
        subtitle: location,
        image: images[3] ?? images[2] ?? images[1] ?? images[0],
      },
      {
        kind: "cta",
        title: cta,
        subtitle: "Atendimento rápido e direto.",
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
        items: [],
        structuredItems: structuredFacts.slice(0, 6),
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
        subtitle: "Atendimento rápido e direto.",
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
      title: "Informações principais",
      items: [],
      structuredItems: structuredFacts.slice(0, 6),
      image: images[1],
    },
    {
      kind: "photo",
      title: "Ambientes para conhecer",
      image: images[2],
    },
    {
      kind: "facts",
      title: "Localização e diferenciais",
      items: [location, ...highlights].filter(Boolean).slice(0, 4),
      image: images[3],
    },
    {
      kind: "photo",
      title: "Mais um olhar sobre o imóvel",
      subtitle: location,
      image: images[4],
    },
    {
      kind: "cta",
      title: cta,
      subtitle: "Atendimento rápido e direto.",
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

function factSlideImageHeight(
  slide: Extract<Slide, { kind: "facts" }>,
  modelId: CarouselModelId,
) {
  const structuredCount = slide.structuredItems?.length ?? 0;

  if (modelId === "direct-sale") {
    return structuredCount > 4
      ? {
          imageClass: "h-[78%]",
          panelClass: "top-[72%]",
        }
      : {
          imageClass: "h-[82%]",
          panelClass: "top-[76%]",
        };
  }

  if (structuredCount > 0) {
    if (structuredCount <= 3) {
      return {
        imageClass: "h-[76%]",
        panelClass: "top-[72%]",
      };
    }

    if (structuredCount <= 5) {
      return {
        imageClass: "h-[72%]",
        panelClass: "top-[68%]",
      };
    }

    return {
      imageClass: "h-[68%]",
      panelClass: "top-[64%]",
    };
  }

  const textCount = slide.items.length;

  if (textCount <= 2) {
    return {
      imageClass: "h-[76%]",
      panelClass: "top-[72%]",
    };
  }

  return {
    imageClass: "h-[70%]",
    panelClass: "top-[66%]",
  };
}

function StructuredFactsGrid({
  items,
  accent,
  compact = false,
}: {
  items: StructuredFact[];
  accent: string;
  compact?: boolean;
}) {
  return (
    <div className={`${compact ? "mt-2" : "mt-3"} grid grid-cols-3 gap-1.5`}>
      {items.slice(0, 6).map((item) => {
        const Icon = structuredFactIcon(item.kind);

        return (
          <div
            key={item.kind}
            className={`flex items-center gap-1.5 rounded-xl bg-[#F2F4F7] px-2 ${
              compact ? "min-h-10 py-1" : "min-h-12 py-1.5"
            }`}
          >
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white"
              style={{ color: accent }}
            >
              <Icon size={14} strokeWidth={2} />
            </span>
            <span className="min-w-0 text-[11px] font-extrabold leading-4 text-[#475467]">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function SlideArtwork({
  slide,
  brand,
  templateId,
  modelId,
  index,
  total,
  exportMode = false,
}: {
  slide: Slide;
  brand: CarouselBrand;
  templateId: CampaignTemplateId;
  modelId: CarouselModelId;
  index: number;
  total: number;
  exportMode?: boolean;
}) {
  const brandColor = safeBrandColor(brand.primaryColor);
  const brandText = contrastText(brandColor);
  const treatment = visualTreatment(templateId);
  const accent = treatment === "opportunity" ? "#F79009" : brandColor;
  const accentText = contrastText(accent);
  const factsLayout =
    slide.kind === "facts" ? factSlideImageHeight(slide, modelId) : null;
  const directSale = modelId === "direct-sale";

  return (
    <div
      className={`relative aspect-[4/5] overflow-hidden bg-[#EAECF0] ${
        exportMode ? "" : "rounded-2xl"
      }`}
    >
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
            <div className="font-display mt-2 text-3xl font-black leading-[0.98]">
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
                className={`absolute inset-x-0 top-0 w-full object-cover ${factsLayout?.imageClass}`}
                referrerPolicy="no-referrer"
              />
              <div
                className={`absolute inset-x-0 bottom-0 bg-white ${
                  directSale ? "rounded-t-2xl px-4 pb-3 pt-3" : "rounded-t-3xl"
                } ${
                  directSale
                    ? ""
                    : slide.structuredItems?.length
                      ? "p-4"
                      : "p-5"
                } ${factsLayout?.panelClass}`}
              >
                <div
                  className={`${
                    slide.structuredItems?.length ? "mb-2" : "mb-3"
                  } h-1.5 w-12 rounded-full`}
                  style={{ backgroundColor: accent }}
                />
                <div
                  className={`${
                    slide.structuredItems?.length ? "text-xl" : "text-2xl"
                  } font-display font-black leading-[1.02] text-[#18202A]`}
                >
                  {slide.title}
                </div>
                {slide.structuredItems?.length ? (
                  <StructuredFactsGrid
                    items={slide.structuredItems}
                    accent={accent}
                    compact={directSale}
                  />
                ) : (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {(slide.items.length > 0
                      ? slide.items
                      : ["Consulte os detalhes deste imóvel."]
                    ).map((item) => (
                      <div
                        key={item}
                        className={`rounded-xl bg-[#F2F4F7] px-3 py-2 text-sm font-bold leading-5 text-[#475467] ${
                          item.length > 24 ? "col-span-2" : ""
                        }`}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="absolute inset-5 flex flex-col justify-end rounded-2xl bg-white p-5 shadow-xl">
              <div
                className="mb-3 h-1.5 w-12 rounded-full"
                style={{ backgroundColor: accent }}
              />
              <div className="font-display text-2xl font-black leading-[1.02] text-[#18202A]">
                {slide.title}
              </div>
              {slide.structuredItems?.length ? (
                <StructuredFactsGrid
                  items={slide.structuredItems}
                  accent={accent}
                />
              ) : (
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
              )}
            </div>
          )}
        </>
      )}

      {slide.kind === "photo" && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
          <div className="absolute inset-x-5 bottom-6 text-white">
            <div className="font-display text-2xl font-black leading-[1.02]">{slide.title}</div>
            {slide.subtitle && (
              <div className="mt-2 text-sm text-white/80">{slide.subtitle}</div>
            )}
          </div>
        </>
      )}

      {slide.kind === "cta" && (
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ backgroundColor: accent, color: accentText }}
        >
          <div
            className="absolute -right-7 -top-10 h-36 w-36 rounded-bl-[92px]"
            style={{ backgroundColor: brandAccent(accent) }}
          />
          <div
            className="absolute -bottom-9 -left-8 h-28 w-28 rounded-tr-[72px]"
            style={{ backgroundColor: brandAccent(accent) }}
          />
          <div
            className="absolute bottom-8 right-7 h-px w-24"
            style={{
              backgroundColor:
                accentText === "#FFFFFF"
                  ? "rgba(255,255,255,0.46)"
                  : "rgba(24,32,42,0.26)",
            }}
          />

          <div className="relative flex h-full flex-col px-8 pb-8 pt-8 text-left">
            <div className="flex min-h-12 items-start justify-between gap-5">
              {brand.logoUrl ? (
                <div className="inline-flex rounded-md bg-white px-3 py-2 shadow-sm">
                  <img
                    src={brand.logoUrl}
                    alt={brand.professionalName}
                    className="max-h-8 max-w-32 object-contain"
                  />
                </div>
              ) : (
                <div className="text-[10px] font-black uppercase tracking-[0.18em] opacity-80">
                  {brand.professionalName}
                </div>
              )}

              <div
                className="mt-1 h-8 w-2 rounded-sm"
                style={{ backgroundColor: brandAccent(accent) }}
              />
            </div>

            <div className="mt-10 max-w-[82%]">
              <div className="font-display text-[42px] font-black leading-[0.94]">
                {slide.title}
              </div>
            </div>

            <div className="mt-auto">
              {brand.whatsapp ? (
                <div
                  className="inline-flex min-w-[78%] items-center gap-4 rounded-lg border px-4 py-3"
                  style={{
                    backgroundColor:
                      accentText === "#FFFFFF"
                        ? "rgba(255,255,255,0.12)"
                        : "rgba(255,255,255,0.72)",
                    borderColor:
                      accentText === "#FFFFFF"
                        ? "rgba(255,255,255,0.22)"
                        : "rgba(24,32,42,0.10)",
                  }}
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                    style={{
                      backgroundColor:
                        accentText === "#FFFFFF"
                          ? "rgba(255,255,255,0.16)"
                          : "rgba(24,32,42,0.07)",
                    }}
                  >
                    <MessageCircle size={23} strokeWidth={2.35} />
                  </span>

                  <span className="min-w-0">
                    <span className="block text-[9px] font-black uppercase tracking-[0.18em] opacity-70">
                      WhatsApp
                    </span>
                    <span className="font-display mt-1 block text-[24px] font-black leading-none tracking-[-0.02em]">
                      {formatWhatsapp(brand.whatsapp)}
                    </span>
                  </span>
                </div>
              ) : (
                <div className="text-sm font-bold opacity-80">
                  Entre em contato para mais informações.
                </div>
              )}

              <div className="mt-4 text-[11px] font-semibold tracking-[0.01em] opacity-[0.72]">
                {slide.subtitle}
              </div>
            </div>
          </div>
        </div>
      )}

      {!exportMode && (
        <div className="absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-bold text-white">
          {index + 1}/{total}
        </div>
      )}
    </div>
  );
}

export function InstagramCarouselRenderSet({
  property,
  brand,
  templateId,
  modelId,
  headline,
  cta,
  renderGroup,
}: {
  property: Property;
  brand: CarouselBrand;
  templateId: CampaignTemplateId;
  modelId: CarouselModelId;
  headline: string;
  cta: string;
  renderGroup: string;
}) {
  const slides = useMemo(
    () => buildSlides(property, modelId, headline, cta),
    [property, modelId, headline, cta],
  );

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-[-20000px] top-0 w-[470px]"
    >
      {slides.map((slide, index) => (
        <div
          key={`render-${renderGroup}-${slide.kind}-${index}`}
          data-render-carousel-slide={renderGroup}
          className="w-[470px]"
        >
          <SlideArtwork
            slide={slide}
            brand={brand}
            templateId={templateId}
            modelId={modelId}
            index={index}
            total={slides.length}
            exportMode
          />
        </div>
      ))}
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
  renderGroup = "true",
}: {
  property: Property;
  brand: CarouselBrand;
  templateId: CampaignTemplateId;
  modelId: CarouselModelId;
  headline: string;
  cta: string;
  renderGroup?: string;
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
        modelId={modelId}
        index={safeActive}
        total={slides.length}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-[-10000px] top-0 w-[470px]"
      >
        {slides.map((slide, index) => (
          <div
            key={`export-${slide.kind}-${index}`}
            data-render-carousel-slide={renderGroup}
            className="w-[470px]"
          >
            <SlideArtwork
              slide={slide}
              brand={brand}
              templateId={templateId}
              modelId={modelId}
              index={index}
              total={slides.length}
              exportMode
            />
          </div>
        ))}
      </div>

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
