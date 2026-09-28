import { Building2 } from "lucide-react";
import type { Property } from "@/types";
import { formatBRL } from "@/lib/utils";
import {
  getVerticalTemplate,
  type VerticalPlatform,
  type VerticalTemplateId,
  verticalSafeZones,
} from "@/lib/vertical-templates";
import {
  resolveBlockPosition,
  type BlockPosition,
} from "@/lib/campaign-layout";

type VerticalBrand = {
  professionalName: string;
  logoUrl?: string | null;
  primaryColor: string;
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

function priceText(property: Property) {
  if (property.price <= 0) return "Preço sob consulta";

  return `${formatBRL(property.price)}${property.purpose === "Aluguel" ? "/mês" : ""}`;
}

function verticalFeatures(property: Property, limit = 3) {
  return [
    property.bedrooms ? `${property.bedrooms} quartos` : null,
    property.suites ? `${property.suites} suítes` : null,
    property.area ? `${property.area} m²` : null,
    property.parking ? `${property.parking} vagas` : null,
  ]
    .filter((item): item is string => Boolean(item))
    .slice(0, limit);
}

function BrandMark({
  brand,
  inverse = false,
}: {
  brand: VerticalBrand;
  inverse?: boolean;
}) {
  if (brand.logoUrl) {
    return (
      <span className={inverse ? "inline-flex rounded bg-white/[0.92] px-2.5 py-1.5" : ""}>
        <img
          src={brand.logoUrl}
          alt={brand.professionalName}
          className="max-h-8 max-w-32 object-contain"
        />
      </span>
    );
  }

  return (
    <span
      className={`text-[10px] font-black uppercase tracking-[0.18em] ${
        inverse ? "text-white/85" : "text-[#18202A]"
      }`}
    >
      {brand.professionalName}
    </span>
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
    <div className="absolute inset-0 flex items-center justify-center bg-[#EAECF0] text-[#98A2B3]">
      <div className="text-center">
        <Building2 size={44} className="mx-auto" />
        <div className="mt-2 text-xs font-bold">Sem foto de capa</div>
      </div>
    </div>
  );
}

function FeaturePills({
  items,
  inverse = false,
}: {
  items: string[];
  inverse?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className={`px-2.5 py-1 text-[10px] font-bold ${
            inverse
              ? "border border-white/25 bg-white/10 text-white"
              : "bg-[#F2F4F7] text-[#475467]"
          }`}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export function VerticalCreativePreview({
  property,
  brand,
  platform,
  templateId,
  headline,
  subheadline,
  cta,
  blockPosition,
  suggestedBlockPosition,
  renderTarget,
}: {
  property: Property;
  brand: VerticalBrand;
  platform: VerticalPlatform;
  templateId: VerticalTemplateId;
  headline: string;
  subheadline: string;
  cta: string;
  blockPosition: BlockPosition;
  suggestedBlockPosition?: "left" | "right" | null;
  renderTarget?: string;
}) {
  const brandColor = safeBrandColor(brand.primaryColor);
  const brandText = contrastText(brandColor);
  const accent = supportingAccent(brandColor);
  const premiumDetail = premiumAccent(brandColor);
  const price = priceText(property);
  const locality = [property.location, property.city]
    .filter(Boolean)
    .join(" · ");
  const safeZone = verticalSafeZones[platform];
  const images = propertyImages(property);
  const template = getVerticalTemplate(templateId);
  const resolvedPosition = template.supportsBlockPosition
    ? resolveBlockPosition(blockPosition, platform, suggestedBlockPosition)
    : "left";
  const contentWidth = platform === "tiktok" ? "w-[72%]" : "w-[82%]";
  const blockPlacement =
    resolvedPosition === "right"
      ? `right-5 left-auto ${contentWidth} text-right`
      : `left-5 right-auto ${contentWidth} text-left`;

  return (
    <div className="mx-auto w-full max-w-[330px] overflow-hidden rounded-2xl border border-[#E4E7EC] bg-[#EAECF0] shadow-sm">
      <div
        className="relative aspect-[9/16] overflow-hidden"
        data-render-target={
          renderTarget ??
          (platform === "instagram_story" ? "story" : undefined)
        }
      >
        <PropertyImage property={property} />

        {templateId === "vertical-clean" && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/5 to-black/15" />
            <div className="absolute inset-x-5 top-[12%]">
              <BrandMark brand={brand} inverse />
            </div>
            <div className={`absolute bottom-[17%] ${blockPlacement} text-white`}>
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/65">
                {property.purpose} · {locality}
              </div>
              <div className="font-display mt-2 text-[34px] font-black leading-[0.94]">
                {headline}
              </div>
              {subheadline && (
                <div className="mt-3 max-w-[92%] text-sm leading-5 text-white/78">
                  {subheadline}
                </div>
              )}
              <div className="mt-5 flex items-center gap-3">
                <span className="h-px w-10 bg-white/55" />
                <span className="text-sm font-black">{price}</span>
              </div>
              <div className="mt-5 inline-flex border border-white/35 bg-white/10 px-4 py-2 text-xs font-black backdrop-blur-sm">
                {cta}
              </div>
            </div>
          </>
        )}

        {templateId === "vertical-commercial" && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div
              className="absolute left-0 top-[11%] h-12 w-[58%]"
              style={{ backgroundColor: brandColor }}
            />
            <div
              className="absolute right-0 top-[11%] h-24 w-12"
              style={{ backgroundColor: accent }}
            />
            <div
              className="absolute left-5 top-[13%] text-[9px] font-black uppercase tracking-[0.18em]"
              style={{ color: brandText }}
            >
              {property.purpose}
            </div>
            <div className={`absolute bottom-[16%] ${blockPlacement} bg-white p-4 shadow-xl`}>
              <div className="font-display text-[24px] font-black leading-[0.96] text-[#18202A]">
                {headline}
              </div>
              <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#667085]">
                {locality}
              </div>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div
                  className="text-[25px] font-black leading-none"
                  style={{ color: brandColor }}
                >
                  {price}
                </div>
              </div>
              <FeaturePills items={verticalFeatures(property, 3)} />
              <div
                className="mt-4 inline-flex px-3 py-2 text-xs font-black"
                style={{ backgroundColor: brandColor, color: brandText }}
              >
                {cta}
              </div>
            </div>
          </>
        )}

        {templateId === "vertical-opportunity" && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/10 to-transparent" />
            <div className="absolute left-0 top-[13%] bg-[#F79009] px-5 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow">
              Oportunidade
            </div>
            <div className={`absolute bottom-[18%] ${blockPlacement} text-white`}>
              <div className="font-display text-[30px] font-black leading-[0.95]">
                {headline}
              </div>
              <FeaturePills items={verticalFeatures(property, 2)} inverse />
              <div className="mt-5 flex items-center gap-3">
                <span className="h-px w-8 bg-[#FDB022]" />
                <span className="text-[28px] font-black leading-none text-[#FDB022]">
                  {price}
                </span>
              </div>
              <div className="mt-5 inline-flex bg-[#F79009] px-4 py-2 text-xs font-black text-white">
                {cta}
              </div>
            </div>
          </>
        )}

        {templateId === "vertical-branding" && (
          <>
            <div className="absolute inset-0 bg-[#0F2633]/58" />
            <div className="absolute inset-x-5 top-[11%]">
              <BrandMark brand={brand} inverse />
            </div>
            <div className="absolute inset-5 border border-white/30" />
            <div className={`absolute bottom-[17%] ${blockPlacement} text-white`}>
              <div
                className="mb-4 h-1 w-12"
                style={{ backgroundColor: accent }}
              />
              <div className="text-[9px] font-black uppercase tracking-[0.18em] text-white/65">
                {locality}
              </div>
              <div className="font-editorial mt-2 text-[35px] font-semibold leading-[0.92]">
                {headline}
              </div>
              {subheadline && (
                <div className="mt-3 max-w-[90%] text-sm leading-5 text-white/75">
                  {subheadline}
                </div>
              )}
              <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/25 pt-4">
                <span className="text-lg font-black">{price}</span>
                <span
                  className="px-3 py-2 text-[10px] font-black"
                  style={{ backgroundColor: accent, color: contrastText(accent) }}
                >
                  {cta}
                </span>
              </div>
            </div>
          </>
        )}

        {templateId === "vertical-photo-grid" && (
          <>
            <div className="absolute inset-x-0 top-0 h-[72%] grid grid-cols-[1.7fr_1fr] gap-1 bg-white">
              {images[0] ? (
                <img
                  src={images[0]}
                  alt={property.title}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : null}
              <div className="grid grid-rows-2 gap-1">
                {(images[1] ?? images[0]) ? (
                  <img
                    src={images[1] ?? images[0]}
                    alt=""
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : null}
                {(images[2] ?? images[1] ?? images[0]) ? (
                  <img
                    src={images[2] ?? images[1] ?? images[0]}
                    alt=""
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : null}
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-[15%] min-h-[20%] bg-[#F5F1E8] px-5 py-4 text-[#18202A]">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#667085]">
                  {property.purpose} · {locality}
                </div>
                <BrandMark brand={brand} />
              </div>
              <div className="mt-3 flex items-end justify-between gap-4">
                <div className="font-display max-w-[66%] text-[26px] font-black leading-[0.96]">
                  {headline}
                </div>
                <div className="shrink-0 text-lg font-black">{price}</div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <FeaturePills items={verticalFeatures(property, 2)} />
                <span className="text-[10px] font-black" style={{ color: brandColor }}>
                  {cta} →
                </span>
              </div>
            </div>
          </>
        )}

        {templateId === "vertical-editorial" && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-[15%] min-h-[31%] bg-[#FAF8F4]/96 px-5 py-5 text-[#18202A] backdrop-blur-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div
                    className="h-1 w-10"
                    style={{ backgroundColor: brandColor }}
                  />
                  <div className="mt-3 text-[9px] font-black uppercase tracking-[0.17em] text-[#667085]">
                    {property.purpose} · {locality}
                  </div>
                </div>
                <BrandMark brand={brand} />
              </div>
              <div className="font-editorial mt-3 max-w-[88%] text-[34px] font-semibold leading-[0.94]">
                {headline}
              </div>
              {subheadline && (
                <div className="mt-2 max-w-[90%] text-xs leading-5 text-[#667085]">
                  {subheadline}
                </div>
              )}
              <div className="mt-4 flex items-center justify-between border-t border-[#DED8CF] pt-3">
                <span className="text-lg font-black">{price}</span>
                <span className="text-[10px] font-black" style={{ color: brandColor }}>
                  {cta} →
                </span>
              </div>
            </div>
          </>
        )}

        {templateId === "vertical-minimal" && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/48 via-transparent to-black/5" />
            <div className="absolute inset-x-5 top-[12%]">
              <BrandMark brand={brand} inverse />
            </div>
            <div className={`absolute bottom-[17%] ${blockPlacement} bg-[#FAF8F4]/95 px-4 py-4 text-[#18202A] shadow-sm backdrop-blur-sm`}>
              <div className="flex gap-3">
                <span
                  className="mt-1 h-12 w-0.5 shrink-0"
                  style={{ backgroundColor: brandColor }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#667085]">
                    {property.purpose} · {locality}
                  </div>
                  <div className="font-display mt-2 text-[27px] font-black leading-[0.96]">
                    {headline}
                  </div>
                  {subheadline && (
                    <div className="mt-2 text-xs leading-5 text-[#667085]">
                      {subheadline}
                    </div>
                  )}
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-base font-black">{price}</span>
                    <span className="text-[10px] font-black" style={{ color: brandColor }}>
                      {cta} →
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <div
          data-render-ignore="true"
          className="pointer-events-none absolute inset-x-0 top-0 border-b border-dashed border-white/20"
          style={{ height: `${safeZone.topPercent}%` }}
        />
        <div
          data-render-ignore="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 border-t border-dashed border-white/20"
          style={{ height: `${safeZone.bottomPercent}%` }}
        />
        {safeZone.rightPercent > 0 && (
          <div
            data-render-ignore="true"
            className="pointer-events-none absolute bottom-0 right-0 top-0 border-l border-dashed border-white/20"
            style={{ width: `${safeZone.rightPercent}%` }}
          />
        )}
      </div>
      <div className="bg-white px-3 py-2 text-center text-[10px] font-semibold text-[#667085]">
        Prévia 9:16 · zonas seguras adaptadas para {safeZone.label}
      </div>
    </div>
  );
}

export function VerticalTemplateThumbnail({
  property,
  brand,
  templateId,
}: {
  property: Property;
  brand: VerticalBrand;
  templateId: VerticalTemplateId;
}) {
  const brandColor = safeBrandColor(brand.primaryColor);
  const accent = supportingAccent(brandColor);

  return (
    <div className="relative aspect-[9/16] overflow-hidden bg-[#EAECF0]">
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

      {templateId === "vertical-clean" && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute inset-x-2 bottom-[20%]">
            <div className="h-2 w-4/5 bg-white" />
            <div className="mt-2 h-px w-8 bg-white/60" />
            <div className="mt-1.5 h-1.5 w-1/3 bg-white/80" />
          </div>
        </>
      )}

      {templateId === "vertical-commercial" && (
        <>
          <div className="absolute left-0 top-[12%] h-5 w-1/2" style={{ backgroundColor: brandColor }} />
          <div className="absolute right-0 top-[12%] h-10 w-5" style={{ backgroundColor: accent }} />
          <div className="absolute inset-x-2 bottom-[18%] bg-white p-2">
            <div className="h-2 w-3/4 bg-[#18202A]" />
            <div className="mt-2 h-3 w-1/2" style={{ backgroundColor: brandColor }} />
            <div className="mt-2 flex gap-1">
              <div className="h-2 flex-1 bg-[#F2F4F7]" />
              <div className="h-2 flex-1 bg-[#F2F4F7]" />
            </div>
          </div>
        </>
      )}

      {templateId === "vertical-opportunity" && (
        <>
          <div className="absolute left-0 top-[13%] h-4 w-1/2 bg-[#F79009]" />
          <div className="absolute inset-x-2 bottom-[20%]">
            <div className="h-2 w-3/4 bg-white" />
            <div className="mt-2 h-4 w-2/3 bg-[#FDB022]" />
          </div>
        </>
      )}

      {templateId === "vertical-branding" && (
        <>
          <div className="absolute inset-0 bg-[#0F2633]/55" />
          <div className="absolute inset-2 border border-white/40" />
          <div className="absolute inset-x-3 bottom-[20%]">
            <div className="mb-2 h-1 w-8" style={{ backgroundColor: accent }} />
            <div className="h-2 w-4/5 bg-white" />
            <div className="mt-2 h-px w-full bg-white/30" />
          </div>
        </>
      )}

      {templateId === "vertical-photo-grid" && (
        <>
          <div className="absolute inset-x-0 top-0 h-[72%] grid grid-cols-[1.7fr_1fr] gap-px bg-white">
            <div className="bg-black/5" />
            <div className="grid grid-rows-2 gap-px">
              <div className="bg-black/10" />
              <div className="bg-black/15" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-[15%] h-[20%] bg-[#F5F1E8] p-2">
            <div className="h-2 w-3/4 bg-[#18202A]" />
            <div className="mt-2 h-1.5 w-1/3" style={{ backgroundColor: brandColor }} />
          </div>
        </>
      )}

      {templateId === "vertical-editorial" && (
        <div className="absolute inset-x-0 bottom-[15%] h-[31%] bg-[#FAF8F4]/95 p-2">
          <div className="h-1 w-1/4" style={{ backgroundColor: brandColor }} />
          <div className="mt-2 h-2 w-4/5 bg-[#18202A]" />
          <div className="mt-2 h-px w-full bg-[#DED8CF]" />
          <div className="mt-2 h-2 w-1/3 bg-[#98A2B3]" />
        </div>
      )}

      {templateId === "vertical-minimal" && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
          <div className="absolute bottom-[18%] left-3 w-[72%] bg-[#FAF8F4]/95 p-2">
            <div className="flex gap-2">
              <div className="h-8 w-0.5" style={{ backgroundColor: brandColor }} />
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
