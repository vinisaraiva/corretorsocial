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
        data-render-target={renderTarget}
      >
        <PropertyImage property={property} />

        {templateId === "clean-base" && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent p-5 pt-28 text-white">
            <div className={`max-w-[78%] ${innerAlignment}`}>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/75">
                {locality}
              </div>
              <div className="font-display mt-2 text-3xl font-black leading-[0.98]">
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
              <div className="font-display mt-3 text-2xl font-black leading-[1.02] text-[#18202A]">
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
              <div className="font-display text-xl font-black leading-[1.02] text-[#18202A]">
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
                <div className="font-display text-xl font-black leading-[1.02]">
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
              <div className="font-display mt-3 text-xl font-black leading-[1.02]">
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
              <div className="font-display text-2xl font-black leading-[1.02] text-[#18202A]">
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
