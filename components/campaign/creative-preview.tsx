import { Building2, MessageCircle } from "lucide-react";
import {
  getCampaignTemplate,
  type CampaignTemplateId,
} from "@/lib/campaign-templates";
import {
  resolveBlockPosition,
  type BlockPosition,
} from "@/lib/campaign-layout";
import { formatBRL } from "@/lib/utils";
import type { Property } from "@/types";

export type CampaignBrand = {
  professionalName: string;
  logoUrl?: string | null;
  primaryColor: string;
  whatsapp?: string | null;
};

export function safeBrandColor(value: string) {
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

function premiumAccent(hex: string) {
  const color = hex.replace("#", "");
  const channels = [0, 2, 4].map((offset) =>
    Number.parseInt(color.slice(offset, offset + 2), 16),
  );
  const mixed = channels.map((channel) =>
    Math.round(channel + (255 - channel) * 0.38),
  );

  return `#${mixed.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function supportingAccent(hex: string) {
  const color = hex.replace("#", "");
  const r = Number.parseInt(color.slice(0, 2), 16);
  const g = Number.parseInt(color.slice(2, 4), 16);
  const b = Number.parseInt(color.slice(4, 6), 16);
  const warm = r > g * 1.15 && r > b * 1.15;

  return warm ? "#17384A" : "#F4A340";
}

function propertyImages(property: Property) {
  return Array.from(
    new Set(
      [property.image, ...(property.images ?? [])]
        .filter((item): item is string => Boolean(item))
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

export function CreativePreview({
  property,
  brand,
  templateId,
  headline,
  subheadline,
  copy,
  cta,
  blockPosition,
  suggestedBlockPosition,
  renderTarget = "feed",
  artOnly = false,
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
  renderTarget?: string;
  artOnly?: boolean;
}) {
  const brandColor = safeBrandColor(brand.primaryColor);
  const accent = supportingAccent(brandColor);
  const premiumDetail = premiumAccent(brandColor);
  const locality = [property.location, property.city]
    .filter(Boolean)
    .join(" · ");
  const features = featureItems(property);
  const price = priceText(property);
  const resolvedPosition = selectedTemplateSupportsPosition(templateId)
    ? resolveBlockPosition(blockPosition, undefined, suggestedBlockPosition)
    : "left";
  const alignRight = resolvedPosition === "right";
  const images = propertyImages(property);

  return (
    <div className="mx-auto max-w-[430px] overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white shadow-sm">
      <div
        className="relative aspect-[4/5] overflow-hidden bg-[#EAECF0]"
        data-render-target={renderTarget}
      >
        {templateId === "photo-grid" ? (
          <PhotoGrid property={property} images={images} />
        ) : (
          <PropertyImage property={property} />
        )}

        {templateId === "editorial-clean" && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/10 to-black/10" />
            <div
              className={`absolute top-5 ${alignRight ? "right-5" : "left-5"}`}
            >
              <BrandMark brand={brand} inverse />
            </div>
            <div
              className={`absolute bottom-5 max-w-[82%] ${alignRight ? "right-5 text-right" : "left-5 text-left"} text-white`}
            >
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/70">
                {property.purpose} · {locality}
              </div>
              <div className="font-display mt-2 text-[34px] font-black leading-[0.94]">
                {headline}
              </div>
              <div className={`mt-4 flex items-center gap-3 ${alignRight ? "justify-end" : ""}`}>
                <span className="h-px w-10 bg-white/60" />
                <span className="text-base font-black">{price}</span>
              </div>
            </div>
          </>
        )}

        {templateId === "geometric-direct" && (
          <>
            <div className="absolute left-5 top-5 flex items-center gap-2">
              <span
                className="h-8 w-1.5"
                style={{ backgroundColor: brandColor }}
              />
              <span className="rounded-sm bg-white/90 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-[#18202A] shadow-sm backdrop-blur-sm">
                {property.purpose}
              </span>
            </div>

            <div
              className="absolute right-0 top-[18%] h-16 w-2"
              style={{ backgroundColor: accent }}
            />

            <div className="absolute bottom-4 left-4 w-[74%] bg-white/[0.94] px-4 py-3 shadow-lg backdrop-blur-sm">
              <div
                className="mb-3 h-1 w-10"
                style={{ backgroundColor: brandColor }}
              />
              <div className="font-display text-[22px] font-black leading-[0.97] text-[#18202A]">
                {headline}
              </div>
              <div className="mt-2 text-[9px] font-bold uppercase tracking-[0.14em] text-[#667085]">
                {locality}
              </div>
              <div className="mt-3 flex items-end justify-between gap-3 border-t border-[#EAECF0] pt-3">
                <div className="min-w-0 text-[9px] font-bold leading-4 text-[#667085]">
                  {features.slice(0, 3).join(" · ")}
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[8px] font-black uppercase tracking-[0.14em] text-[#98A2B3]">
                    valor
                  </div>
                  <div className="mt-0.5 text-sm font-black" style={{ color: brandColor }}>
                    {price}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {templateId === "dark-premium" && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F2633]/82 via-[#0F2633]/16 to-black/5" />
            <div className="absolute left-5 top-5">
              <BrandMark brand={brand} inverse />
            </div>
            <div
              className="absolute left-5 top-[23%] h-16 w-px"
              style={{ backgroundColor: premiumDetail }}
            />
            <div
              className="absolute left-5 top-[23%] h-px w-16"
              style={{ backgroundColor: premiumDetail }}
            />
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <div className="text-[9px] font-black uppercase tracking-[0.19em] text-white/62">
                {locality}
              </div>
              <div className="font-editorial mt-2 max-w-[84%] text-[37px] font-semibold leading-[0.92]">
                {headline}
              </div>
              <div className="mt-4 flex items-end justify-between gap-5 border-t border-white/20 pt-3">
                <span className="max-w-[58%] text-[11px] font-semibold leading-4 text-white/68">
                  {subheadline || property.purpose}
                </span>
                <span className="text-lg font-black">{price}</span>
              </div>
            </div>
          </>
        )}

        {templateId === "photo-grid" && (
          <>
            <div className="absolute inset-x-0 bottom-0 min-h-[22%] bg-[#F5F1E8] px-5 pb-4 pt-3 text-[#18202A]">
              <div className="flex items-center justify-between gap-4">
                <div className="text-[8px] font-black uppercase tracking-[0.18em] text-[#667085]">
                  {property.purpose} · {locality}
                </div>
                <BrandMark brand={brand} compact />
              </div>
              <div className="mt-2 flex items-end justify-between gap-4">
                <div className="max-w-[64%]">
                  <div className="font-display text-[21px] font-black leading-[0.98]">
                    {headline}
                  </div>
                  <div className="mt-2 text-[9px] font-bold text-[#667085]">
                    {features.slice(0, 2).join(" · ")}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div
                    className="ml-auto h-1 w-7"
                    style={{ backgroundColor: brandColor }}
                  />
                  <div className="mt-2 text-sm font-black">{price}</div>
                </div>
              </div>
            </div>
          </>
        )}

        {templateId === "minimal-contemporary" && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
            <div className={`absolute top-5 ${alignRight ? "right-5" : "left-5"}`}>
              <BrandMark brand={brand} inverse />
            </div>
            <div className={`absolute bottom-5 ${alignRight ? "right-5 text-right" : "left-5 text-left"} w-[76%] bg-[#FAF8F4]/95 px-4 py-4 shadow-sm backdrop-blur-sm`}>
              <div className="flex items-start gap-3">
                <span
                  className="mt-1 h-10 w-0.5 shrink-0"
                  style={{ backgroundColor: brandColor }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#667085]">
                    {property.purpose} · {locality}
                  </div>
                  <div className="font-display mt-2 text-[25px] font-black leading-[0.97] text-[#18202A]">
                    {headline}
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <FeatureRow features={features.slice(0, 2)} compact noMargin />
                    <span className="shrink-0 text-sm font-black text-[#18202A]">{price}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {templateId === "property-editorial" && (
          <>
            {images[1] ? (
              <div className="absolute bottom-[16.5%] right-5 z-10 h-[21%] w-[31%] overflow-hidden rounded-xl border-4 border-[#FAF8F4] bg-[#EAECF0] shadow-lg">
                <img
                  src={images[1]}
                  alt=""
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : null}

            <div className="absolute inset-x-0 bottom-0 h-[20%] overflow-hidden bg-[#FAF8F4] px-5 pb-3 pt-3 text-[#18202A]">
              <div
                className="h-1 w-10"
                style={{ backgroundColor: brandColor }}
              />

              <div className="mt-2 text-[8px] font-black uppercase tracking-[0.17em] text-[#667085]">
                {property.purpose} · {locality}
              </div>

              <div className="font-editorial mt-1.5 line-clamp-1 max-w-[66%] text-[24px] font-semibold leading-[0.95]">
                {headline}
              </div>

              <div className="mt-2 flex items-center justify-between gap-3">
                <FeatureRow
                  features={features.slice(0, 3)}
                  compact
                  noMargin
                />

                <div className="ml-auto flex shrink-0 items-end gap-3 text-right">
                  <div>
                    <div className="text-[7px] font-black uppercase tracking-[0.14em] text-[#98A2B3]">
                      valor
                    </div>
                    <div
                      className="mt-0.5 text-[17px] font-black leading-none"
                      style={{ color: brandColor }}
                    >
                      {price}
                    </div>
                  </div>
                  <span
                    className="text-xl leading-none"
                    style={{ color: brandColor }}
                    aria-hidden="true"
                  >
                    →
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {!artOnly ? (
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
      ) : null}
    </div>
  );
}

function selectedTemplateSupportsPosition(
  templateId: CampaignTemplateId,
) {
  return getCampaignTemplate(templateId).supportsBlockPosition;
}

export function TemplateThumbnail({
  property,
  brand,
  templateId,
}: {
  property: Property;
  brand: CampaignBrand;
  templateId: CampaignTemplateId;
}) {
  const brandColor = safeBrandColor(brand.primaryColor);
  const accent = supportingAccent(brandColor);
  const images = propertyImages(property);

  return (
    <div className="relative aspect-[4/5] overflow-hidden bg-[#EAECF0]">
      {templateId === "photo-grid" ? (
        <PhotoGrid property={property} images={images} thumbnail />
      ) : property.image ? (
        <img
          src={property.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="absolute inset-0 bg-[#D0D5DD]" />
      )}

      {templateId === "editorial-clean" && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/5" />
          <div className="absolute inset-x-3 bottom-3">
            <div className="h-2 w-4/5 rounded bg-white" />
            <div className="mt-2 h-px w-10 bg-white/70" />
            <div className="mt-1.5 h-2 w-1/3 rounded bg-white/85" />
          </div>
        </>
      )}

      {templateId === "geometric-direct" && (
        <>
          <div className="absolute left-3 top-3 flex items-center gap-1.5">
            <div className="h-6 w-1" style={{ backgroundColor: brandColor }} />
            <div className="h-3 w-10 bg-white/90" />
          </div>
          <div className="absolute right-0 top-[20%] h-8 w-1.5" style={{ backgroundColor: accent }} />
          <div className="absolute bottom-2 left-2 w-[72%] bg-white/95 p-2">
            <div className="h-1 w-6" style={{ backgroundColor: brandColor }} />
            <div className="mt-2 h-2 w-4/5 bg-[#18202A]" />
            <div className="mt-2 h-px w-full bg-[#E4E7EC]" />
          </div>
        </>
      )}

      {templateId === "dark-premium" && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F2633]/80 via-[#0F2633]/15 to-transparent" />
          <div className="absolute left-3 top-[24%] h-8 w-px" style={{ backgroundColor: premiumAccent(brandColor) }} />
          <div className="absolute left-3 top-[24%] h-px w-8" style={{ backgroundColor: premiumAccent(brandColor) }} />
          <div className="absolute inset-x-4 bottom-4">
            <div className="h-2 w-4/5 bg-white" />
            <div className="mt-2 h-px w-full bg-white/25" />
          </div>
        </>
      )}

      {templateId === "photo-grid" && (
        <div className="absolute inset-x-0 bottom-0 h-[22%] bg-[#F5F1E8] p-2">
          <div className="h-2 w-3/4 bg-[#18202A]" />
          <div className="mt-2 h-1.5 w-1/3" style={{ backgroundColor: brandColor }} />
        </div>
      )}

      {templateId === "property-editorial" && (
        <>
          {images[1] ? (
            <div className="absolute bottom-[16%] right-2 z-10 h-[21%] w-[30%] overflow-hidden rounded-md border-2 border-[#FAF8F4] bg-[#EAECF0]">
              <img
                src={images[1]}
                alt=""
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : null}
          <div className="absolute inset-x-0 bottom-0 h-[20%] bg-[#FAF8F4] p-2">
            <div className="h-1 w-1/4" style={{ backgroundColor: brandColor }} />
            <div className="mt-1.5 h-1.5 w-2/5 bg-[#98A2B3]" />
            <div className="mt-1.5 h-2 w-3/5 bg-[#18202A]" />
            <div className="mt-1.5 flex gap-1">
              <div className="h-1.5 w-1/5 rounded bg-[#E4E7EC]" />
              <div className="h-1.5 w-1/5 rounded bg-[#E4E7EC]" />
              <div className="h-1.5 w-1/5 rounded bg-[#E4E7EC]" />
            </div>
          </div>
        </>
      )}

      {templateId === "minimal-contemporary" && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 w-[72%] bg-[#FAF8F4]/95 p-2">
            <div className="flex gap-2">
              <div className="h-7 w-0.5" style={{ backgroundColor: brandColor }} />
              <div className="flex-1">
                <div className="h-2 w-4/5 bg-[#18202A]" />
                <div className="mt-2 h-1.5 w-1/3 bg-[#98A2B3]" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function BrandMark({
  brand,
  compact = false,
  inverse = false,
}: {
  brand: CampaignBrand;
  compact?: boolean;
  inverse?: boolean;
}) {
  if (brand.logoUrl) {
    return (
      <span
        className={`inline-flex items-center justify-center ${inverse ? "rounded bg-white/[0.92] px-2.5 py-1.5" : ""}`}
      >
        <img
          src={brand.logoUrl}
          alt={brand.professionalName}
          className={compact ? "max-h-6 max-w-24 object-contain" : "max-h-8 max-w-28 object-contain"}
        />
      </span>
    );
  }

  return (
    <span
      className={`text-[10px] font-black uppercase tracking-[0.16em] ${inverse ? "text-white/85" : "text-[#18202A]"}`}
    >
      {brand.professionalName}
    </span>
  );
}

function FeatureRow({
  features,
  compact = false,
  noMargin = false,
}: {
  features: string[];
  compact?: boolean;
  noMargin?: boolean;
}) {
  if (features.length === 0) return null;

  return (
    <div className={`${noMargin ? "" : compact ? "mt-2" : "mt-3"} flex flex-wrap gap-1.5`}>
      {features.map((feature) => (
        <span
          key={feature}
          className={`${compact ? "px-2 py-1 text-[9px]" : "px-2.5 py-1 text-[10px]"} rounded-full bg-[#F2F4F7] font-bold text-[#475467]`}
        >
          {feature}
        </span>
      ))}
    </div>
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
    .slice(0, 4);
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

function PhotoGrid({
  property,
  images,
  thumbnail = false,
}: {
  property: Property;
  images: string[];
  thumbnail?: boolean;
}) {
  const main = images[0];
  const second = images[1] ?? main;
  const third = images[2] ?? second ?? main;

  if (!main) return <PropertyImage property={property} />;

  return (
    <div className="absolute inset-x-0 top-0 h-[78%] grid grid-cols-[2.1fr_1fr] gap-1 bg-white">
      <img
        src={main}
        alt={property.title}
        className="h-full w-full object-cover"
        referrerPolicy="no-referrer"
      />
      <div className="grid grid-rows-2 gap-1">
        <img
          src={second}
          alt=""
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
        <img
          src={third}
          alt=""
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
      {!thumbnail && images.length > 3 ? (
        <div className="absolute right-3 top-[calc(50%+2px)] rounded bg-black/60 px-2 py-1 text-[9px] font-black text-white">
          +{images.length - 3} fotos
        </div>
      ) : null}
    </div>
  );
}
