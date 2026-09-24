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
      <img
        src={brand.logoUrl}
        alt={brand.professionalName}
        className="max-h-8 max-w-32 object-contain"
      />
    );
  }

  return (
    <span
      className={`text-xs font-black uppercase tracking-[0.16em] ${
        inverse ? "text-white" : "text-[#18202A]"
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
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
            inverse
              ? "bg-white/15 text-white"
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
}) {
  const brandColor = safeBrandColor(brand.primaryColor);
  const brandText = contrastText(brandColor);
  const price = priceText(property);
  const locality = [property.location, property.city]
    .filter(Boolean)
    .join(" · ");
  const safeZone = verticalSafeZones[platform];
  const template = getVerticalTemplate(templateId);
  const resolvedPosition = template.supportsBlockPosition
    ? resolveBlockPosition(blockPosition, platform, suggestedBlockPosition)
    : "left";
  const contentWidth =
    platform === "tiktok" ? "w-[72%]" : "w-[82%]";
  const blockPlacement =
    resolvedPosition === "right"
      ? `right-5 left-auto ${contentWidth} text-right`
      : `left-5 right-auto ${contentWidth} text-left`;
  const ctaJustify =
    resolvedPosition === "right" ? "justify-end" : "justify-start";

  return (
    <div className="mx-auto w-full max-w-[330px] overflow-hidden rounded-2xl border border-[#E4E7EC] bg-[#EAECF0] shadow-sm">
      <div
        className="relative aspect-[9/16] overflow-hidden"
        data-render-target={
          platform === "instagram_story" ? "story" : undefined
        }
      >
        <PropertyImage property={property} />

        {templateId === "vertical-clean" && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30" />
            <div className="absolute inset-x-5 top-[12%]">
              <BrandMark brand={brand} inverse />
            </div>
            <div className={`absolute bottom-[19%] ${blockPlacement} text-white`}>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/75">
                {locality}
              </div>
              <div className="mt-2 text-3xl font-black leading-[1.02]">
                {headline}
              </div>
              {subheadline && (
                <div className="mt-2 max-w-[90%] text-sm leading-5 text-white/85">
                  {subheadline}
                </div>
              )}
            </div>
            <div className={`absolute bottom-[11%] flex ${blockPlacement} ${ctaJustify}`}>
              <div className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-black text-[#18202A] shadow">
                {cta}
              </div>
            </div>
          </>
        )}

        {templateId === "vertical-commercial" && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
            <div
              className="absolute left-5 top-[12%] rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] shadow"
              style={{ backgroundColor: brandColor, color: brandText }}
            >
              {property.purpose}
            </div>
            <div className={`absolute bottom-[17%] ${blockPlacement} rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur`}>
              <div className="text-xl font-black leading-tight text-[#18202A]">
                {headline}
              </div>
              <div
                className="mt-3 text-3xl font-black"
                style={{ color: brandColor }}
              >
                {price}
              </div>
              <FeaturePills items={verticalFeatures(property, 3)} />
              <div
                className="mt-4 rounded-xl px-3 py-2 text-center text-xs font-black"
                style={{ backgroundColor: brandColor, color: brandText }}
              >
                {cta}
              </div>
            </div>
          </>
        )}

        {templateId === "vertical-opportunity" && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-transparent" />
            <div className="absolute left-0 top-[13%] rounded-r-full bg-[#F79009] px-5 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow">
              Oportunidade
            </div>
            <div className={`absolute bottom-[18%] ${blockPlacement} text-white`}>
              <div className="text-2xl font-black leading-tight">{headline}</div>
              <FeaturePills items={verticalFeatures(property, 2)} inverse />
              <div className="mt-4 text-4xl font-black leading-none text-[#FDB022]">
                {price}
              </div>
              <div className="mt-4 inline-flex rounded-full bg-[#F79009] px-4 py-2 text-xs font-black text-white">
                {cta}
              </div>
            </div>
          </>
        )}

        {templateId === "vertical-branding" && (
          <>
            <div
              className="absolute inset-0 border-[10px]"
              style={{ borderColor: brandColor }}
            />
            <div className="absolute left-6 top-[12%] rounded-xl bg-white/95 px-3 py-2 shadow">
              <BrandMark brand={brand} />
            </div>
            <div className={`absolute bottom-[16%] ${resolvedPosition === "right" ? "right-6 left-auto" : "left-6 right-auto"} ${contentWidth} rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur ${resolvedPosition === "right" ? "text-right" : "text-left"}`}>
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#667085]">
                {locality}
              </div>
              <div className="mt-2 text-2xl font-black leading-tight text-[#18202A]">
                {headline}
              </div>
              {subheadline && (
                <div className="mt-1.5 text-sm leading-5 text-[#667085]">
                  {subheadline}
                </div>
              )}
              <div className="mt-4 flex items-center justify-between gap-3">
                <div
                  className="text-lg font-black"
                  style={{ color: brandColor }}
                >
                  {price}
                </div>
                <div
                  className="rounded-full px-3 py-1.5 text-[10px] font-black"
                  style={{ backgroundColor: brandColor, color: brandText }}
                >
                  {cta}
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
            className="pointer-events-none absolute right-0 top-0 bottom-0 border-l border-dashed border-white/20"
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
          <div className="absolute inset-x-2 bottom-[20%]">
            <div className="h-2 w-4/5 rounded bg-white" />
            <div className="mt-1 h-1.5 w-2/3 rounded bg-white/70" />
          </div>
        </>
      )}

      {templateId === "vertical-commercial" && (
        <>
          <div
            className="absolute left-2 top-[12%] h-3 w-1/3 rounded-full"
            style={{ backgroundColor: brandColor }}
          />
          <div className="absolute inset-x-2 bottom-[18%] rounded bg-white/95 p-2">
            <div className="h-2 w-3/4 rounded bg-[#18202A]" />
            <div
              className="mt-1.5 h-3 w-1/2 rounded"
              style={{ backgroundColor: brandColor }}
            />
            <div className="mt-2 h-3 rounded" style={{ backgroundColor: brandColor }} />
          </div>
        </>
      )}

      {templateId === "vertical-opportunity" && (
        <>
          <div className="absolute left-0 top-[13%] h-3 w-1/2 rounded-r-full bg-[#F79009]" />
          <div className="absolute inset-x-2 bottom-[20%]">
            <div className="h-2 w-3/4 rounded bg-white" />
            <div className="mt-2 h-4 w-2/3 rounded bg-[#FDB022]" />
          </div>
        </>
      )}

      {templateId === "vertical-branding" && (
        <>
          <div
            className="absolute inset-0 border-[4px]"
            style={{ borderColor: brandColor }}
          />
          <div className="absolute left-2 top-[12%] h-4 w-1/3 rounded bg-white/95" />
          <div className="absolute inset-x-2 bottom-[18%] rounded bg-white/95 p-2">
            <div className="h-2 w-4/5 rounded bg-[#18202A]" />
            <div className="mt-1 h-1.5 w-2/3 rounded bg-[#98A2B3]" />
            <div
              className="mt-2 h-3 w-1/2 rounded"
              style={{ backgroundColor: brandColor }}
            />
          </div>
        </>
      )}
    </div>
  );
}
