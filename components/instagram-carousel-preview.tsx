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
  type CarouselFinalCardDecoration,
  type CarouselFinalCardTheme,
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

function finalCardPalette(
  theme: CarouselFinalCardTheme,
  brandColor: string,
) {
  if (theme === "dark") {
    return {
      background: "#17384A",
      foreground: "#FFFFFF",
      detail:
        contrastText(brandColor) === "#FFFFFF"
          ? brandAccent(brandColor)
          : brandColor,
      contactBackground: "rgba(255,255,255,0.10)",
      contactBorder: "rgba(255,255,255,0.20)",
      iconBackground: "rgba(255,255,255,0.14)",
      muted: "rgba(255,255,255,0.72)",
    };
  }

  if (theme === "light") {
    return {
      background: "#F3F0E8",
      foreground: "#18202A",
      detail: brandColor,
      contactBackground: "#FFFFFF",
      contactBorder: "rgba(24,32,42,0.10)",
      iconBackground: "rgba(24,32,42,0.06)",
      muted: "rgba(24,32,42,0.64)",
    };
  }

  const foreground = contrastText(brandColor);

  return {
    background: brandColor,
    foreground,
    detail: brandAccent(brandColor),
    contactBackground:
      foreground === "#FFFFFF"
        ? "rgba(255,255,255,0.12)"
        : "rgba(255,255,255,0.72)",
    contactBorder:
      foreground === "#FFFFFF"
        ? "rgba(255,255,255,0.22)"
        : "rgba(24,32,42,0.10)",
    iconBackground:
      foreground === "#FFFFFF"
        ? "rgba(255,255,255,0.16)"
        : "rgba(24,32,42,0.07)",
    muted:
      foreground === "#FFFFFF"
        ? "rgba(255,255,255,0.72)"
        : "rgba(24,32,42,0.64)",
  };
}

function FinalCardDecoration({
  variant,
  detail,
  foreground,
}: {
  variant: CarouselFinalCardDecoration;
  detail: string;
  foreground: string;
}) {
  const lineColor =
    foreground === "#FFFFFF"
      ? "rgba(255,255,255,0.42)"
      : "rgba(24,32,42,0.22)";

  if (variant === "lines") {
    return (
      <>
        <div
          className="absolute left-8 top-8 h-10 w-2 rounded-sm"
          style={{ backgroundColor: detail }}
        />
        <div className="absolute right-7 top-9 space-y-2">
          <div className="h-px w-20" style={{ backgroundColor: lineColor }} />
          <div className="ml-5 h-px w-14" style={{ backgroundColor: lineColor }} />
          <div className="ml-10 h-px w-8" style={{ backgroundColor: detail }} />
        </div>
        <div
          className="absolute bottom-8 right-8 h-px w-28"
          style={{ backgroundColor: lineColor }}
        />
      </>
    );
  }

  if (variant === "frame") {
    return (
      <>
        <div
          className="absolute left-7 top-7 h-14 w-px"
          style={{ backgroundColor: detail }}
        />
        <div
          className="absolute left-7 top-7 h-px w-16"
          style={{ backgroundColor: detail }}
        />
        <div
          className="absolute bottom-7 right-7 h-14 w-px"
          style={{ backgroundColor: lineColor }}
        />
        <div
          className="absolute bottom-7 right-7 h-px w-16"
          style={{ backgroundColor: lineColor }}
        />
      </>
    );
  }

  if (variant === "blocks") {
    return (
      <>
        <div
          className="absolute right-0 top-0 h-24 w-16"
          style={{ backgroundColor: detail }}
        />
        <div
          className="absolute right-16 top-0 h-10 w-10"
          style={{ backgroundColor: lineColor }}
        />
        <div
          className="absolute bottom-0 left-0 h-16 w-24"
          style={{ backgroundColor: detail }}
        />
        <div
          className="absolute bottom-16 left-0 h-8 w-8"
          style={{ backgroundColor: lineColor }}
        />
      </>
    );
  }

  return (
    <>
      <div
        className="absolute -right-7 -top-10 h-36 w-36 rounded-bl-[92px]"
        style={{ backgroundColor: detail }}
      />
      <div
        className="absolute -bottom-14 -left-12 h-28 w-28 rounded-tr-[72px]"
        style={{ backgroundColor: detail }}
      />
      <div
        className="absolute bottom-8 right-7 h-px w-24"
        style={{ backgroundColor: lineColor }}
      />
    </>
  );
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
  return templateId;
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
  finalCardDecoration,
  finalCardTheme,
  index,
  total,
  exportMode = false,
}: {
  slide: Slide;
  brand: CarouselBrand;
  templateId: CampaignTemplateId;
  modelId: CarouselModelId;
  finalCardDecoration: CarouselFinalCardDecoration;
  finalCardTheme: CarouselFinalCardTheme;
  index: number;
  total: number;
  exportMode?: boolean;
}) {
  const brandColor = safeBrandColor(brand.primaryColor);
  const brandText = contrastText(brandColor);
  const treatment = visualTreatment(templateId);
  const accent = brandColor;
  const accentText = contrastText(accent);
  const factsLayout =
    slide.kind === "facts" ? factSlideImageHeight(slide, modelId) : null;
  const directSale = modelId === "direct-sale";
  const resolvedFinalTheme: CarouselFinalCardTheme =
    treatment === "dark-premium"
      ? "dark"
      : treatment === "property-editorial" ||
          treatment === "minimal-contemporary" ||
          treatment === "photo-grid"
        ? "light"
        : treatment === "geometric-direct"
          ? "brand"
          : finalCardTheme;
  const finalPalette = finalCardPalette(resolvedFinalTheme, brandColor);

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
          {treatment === "editorial-clean" && (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/10 to-black/10" />
              <div className="absolute left-5 top-5 text-[10px] font-black uppercase tracking-[0.18em] text-white/75">
                {brand.professionalName}
              </div>
              <div className="absolute inset-x-5 bottom-6 text-white">
                <div className="font-display max-w-[88%] text-[34px] font-black leading-[0.94]">
                  {slide.title}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <span className="h-px w-10 bg-white/60" />
                  <span className="text-xs font-black">{slide.subtitle}</span>
                </div>
              </div>
            </>
          )}

          {treatment === "geometric-direct" && (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
              <div
                className="absolute left-0 top-0 h-16 w-[58%]"
                style={{ backgroundColor: brandColor }}
              />
              <div
                className="absolute right-0 top-0 h-28 w-20"
                style={{ backgroundColor: brandAccent(brandColor) }}
              />
              <div
                className="absolute left-5 top-5 text-[10px] font-black uppercase tracking-[0.18em]"
                style={{ color: brandText }}
              >
                {brand.professionalName}
              </div>
              <div className="absolute inset-x-5 bottom-6 text-white">
                <div className="font-display max-w-[88%] text-[34px] font-black leading-[0.94]">
                  {slide.title}
                </div>
                <div className="mt-4 inline-flex bg-white px-3 py-2 text-xs font-black text-[#18202A]">
                  {slide.subtitle}
                </div>
              </div>
            </>
          )}

          {treatment === "dark-premium" && (
            <>
              <div className="absolute inset-0 bg-[#0F2633]/58" />
              <div className="absolute inset-5 border border-white/35" />
              <div className="absolute left-7 top-7 text-[10px] font-black uppercase tracking-[0.18em] text-white/70">
                {brand.professionalName}
              </div>
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <div
                  className="mb-4 h-1 w-12"
                  style={{ backgroundColor: brandAccent(brandColor) }}
                />
                <div className="font-editorial max-w-[90%] text-[40px] font-semibold leading-[0.91]">
                  {slide.title}
                </div>
                <div className="mt-5 border-t border-white/25 pt-4 text-xs font-bold text-white/75">
                  {slide.subtitle}
                </div>
              </div>
            </>
          )}

          {treatment === "photo-grid" && (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute left-5 top-5 flex items-center gap-2">
                <span
                  className="h-8 w-2"
                  style={{ backgroundColor: brandColor }}
                />
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white">
                  {brand.professionalName}
                </span>
              </div>
              <div className="absolute inset-x-5 bottom-6 text-white">
                <div className="font-display max-w-[84%] text-[34px] font-black leading-[0.94]">
                  {slide.title}
                </div>
                <div className="mt-4 inline-flex border border-white/45 bg-black/25 px-3 py-2 text-xs font-black backdrop-blur-sm">
                  {slide.subtitle}
                </div>
              </div>
            </>
          )}

          {treatment === "property-editorial" && (
            <>
              <div className="absolute inset-x-0 bottom-0 min-h-[34%] bg-[#F5F1E8] px-5 pb-5 pt-4 text-[#18202A]">
                <div
                  className="mb-3 h-1 w-10"
                  style={{ backgroundColor: brandColor }}
                />
                <div className="text-[9px] font-black uppercase tracking-[0.17em] text-[#667085]">
                  {brand.professionalName}
                </div>
                <div className="font-editorial mt-2 max-w-[90%] text-[32px] font-semibold leading-[0.94]">
                  {slide.title}
                </div>
                <div className="mt-3 text-xs font-bold text-[#667085]">
                  {slide.subtitle}
                </div>
              </div>
            </>
          )}

          {treatment === "minimal-contemporary" && (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-black/42 via-transparent to-transparent" />
              <div className="absolute left-5 top-5 text-[9px] font-black uppercase tracking-[0.18em] text-white/80">
                {brand.professionalName}
              </div>
              <div className="absolute bottom-5 left-5 w-[76%] bg-[#FAF8F4]/95 px-4 py-4 text-[#18202A] shadow-sm backdrop-blur-sm">
                <div className="flex gap-3">
                  <span
                    className="mt-1 h-11 w-0.5 shrink-0"
                    style={{ backgroundColor: brandColor }}
                  />
                  <div>
                    <div className="font-display text-[28px] font-black leading-[0.96]">
                      {slide.title}
                    </div>
                    <div className="mt-3 text-[10px] font-bold text-[#667085]">
                      {slide.subtitle}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
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
                  } ${
                    treatment === "dark-premium" || treatment === "property-editorial"
                      ? "font-editorial font-semibold"
                      : "font-display font-black"
                  } leading-[1.02] text-[#18202A]`}
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
              <div
                className={`text-2xl leading-[1.02] text-[#18202A] ${
                  treatment === "dark-premium" || treatment === "property-editorial"
                    ? "font-editorial font-semibold"
                    : "font-display font-black"
                }`}
              >
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-transparent to-transparent" />

          {treatment === "dark-premium" && (
            <div className="absolute inset-5 border border-white/30" />
          )}

          {treatment === "geometric-direct" && (
            <>
              <div
                className="absolute left-0 top-0 h-10 w-[42%]"
                style={{ backgroundColor: brandColor }}
              />
              <div
                className="absolute right-0 top-0 h-16 w-8"
                style={{ backgroundColor: brandAccent(brandColor) }}
              />
            </>
          )}

          {treatment === "property-editorial" && (
            <div className="absolute bottom-0 left-0 h-[30%] w-2 bg-white" />
          )}

          <div className="absolute inset-x-5 bottom-6 text-white">
            <div
              className="mb-3 h-1 w-10"
              style={{
                backgroundColor:
                  treatment === "dark-premium"
                    ? brandAccent(brandColor)
                    : brandColor,
              }}
            />
            <div
              className={`max-w-[86%] text-[28px] leading-[0.98] ${
                treatment === "dark-premium" || treatment === "property-editorial"
                  ? "font-editorial font-semibold"
                  : "font-display font-black"
              }`}
            >
              {slide.title}
            </div>
            {slide.subtitle && (
              <div className="mt-2 max-w-[82%] text-sm text-white/80">
                {slide.subtitle}
              </div>
            )}
          </div>
        </>
      )}

      {slide.kind === "cta" && (
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            backgroundColor: finalPalette.background,
            color: finalPalette.foreground,
          }}
        >
          <FinalCardDecoration
            variant={finalCardDecoration}
            detail={finalPalette.detail}
            foreground={finalPalette.foreground}
          />

          <div className="relative flex h-full flex-col px-8 pb-7 pt-8 text-left">
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
                <div
                  className="text-[10px] font-black uppercase tracking-[0.18em]"
                  style={{ color: finalPalette.muted }}
                >
                  {brand.professionalName}
                </div>
              )}

              <div
                className="mt-1 h-8 w-2 rounded-sm"
                style={{ backgroundColor: finalPalette.detail }}
              />
            </div>

            <div className="mt-10 max-w-[82%]">
              <div
                className={`text-[42px] leading-[0.94] ${
                  treatment === "dark-premium" || treatment === "property-editorial"
                    ? "font-editorial font-semibold"
                    : "font-display font-black"
                }`}
              >
                {slide.title}
              </div>
            </div>

            <div className="mt-auto">
              {brand.whatsapp ? (
                <div
                  className="inline-flex min-w-[78%] items-center gap-4 rounded-lg border px-4 py-3"
                  style={{
                    backgroundColor: finalPalette.contactBackground,
                    borderColor: finalPalette.contactBorder,
                  }}
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: finalPalette.iconBackground }}
                  >
                    <MessageCircle size={23} strokeWidth={2.35} />
                  </span>

                  <span className="min-w-0">
                    <span
                      className="block text-[9px] font-black uppercase tracking-[0.18em]"
                      style={{ color: finalPalette.muted }}
                    >
                      WhatsApp
                    </span>
                    <span className="font-display mt-1 block text-[24px] font-black leading-none tracking-[-0.02em]">
                      {formatWhatsapp(brand.whatsapp)}
                    </span>
                    <span
                      className="mt-2 block text-[10px] font-semibold leading-4"
                      style={{ color: finalPalette.muted }}
                    >
                      {slide.subtitle}
                    </span>
                  </span>
                </div>
              ) : (
                <div className="text-sm font-bold" style={{ color: finalPalette.muted }}>
                  Entre em contato para mais informações.
                </div>
              )}


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
  finalCardDecoration,
  finalCardTheme,
  renderGroup,
}: {
  property: Property;
  brand: CarouselBrand;
  templateId: CampaignTemplateId;
  modelId: CarouselModelId;
  headline: string;
  cta: string;
  finalCardDecoration: CarouselFinalCardDecoration;
  finalCardTheme: CarouselFinalCardTheme;
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
            finalCardDecoration={finalCardDecoration}
            finalCardTheme={finalCardTheme}
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
  finalCardDecoration,
  finalCardTheme,
  renderGroup = "true",
}: {
  property: Property;
  brand: CarouselBrand;
  templateId: CampaignTemplateId;
  modelId: CarouselModelId;
  headline: string;
  cta: string;
  finalCardDecoration: CarouselFinalCardDecoration;
  finalCardTheme: CarouselFinalCardTheme;
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
        finalCardDecoration={finalCardDecoration}
        finalCardTheme={finalCardTheme}
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
              finalCardDecoration={finalCardDecoration}
              finalCardTheme={finalCardTheme}
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
