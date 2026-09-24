"use client";

import { Check } from "lucide-react";
import type { Property } from "@/types";
import {
  getVerticalTemplate,
  getVerticalTemplateName,
  type VerticalPlatform,
  type VerticalTemplateId,
  verticalTemplates,
} from "@/lib/vertical-templates";
import { VerticalTemplateThumbnail } from "@/components/vertical-creative-preview";

type VerticalBrand = {
  professionalName: string;
  logoUrl?: string | null;
  primaryColor: string;
};

export function VerticalTemplateControls({
  property,
  brand,
  platform,
  templateId,
  headline,
  subheadline,
  cta,
  onTemplateChange,
  onHeadlineChange,
  onSubheadlineChange,
  onCtaChange,
}: {
  property: Property;
  brand: VerticalBrand;
  platform: VerticalPlatform;
  templateId: VerticalTemplateId;
  headline: string;
  subheadline: string;
  cta: string;
  onTemplateChange: (value: VerticalTemplateId) => void;
  onHeadlineChange: (value: string) => void;
  onSubheadlineChange: (value: string) => void;
  onCtaChange: (value: string) => void;
}) {
  const template = getVerticalTemplate(templateId);

  return (
    <>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {verticalTemplates.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={templateId === item.id}
            onClick={() => onTemplateChange(item.id)}
            className={`overflow-hidden rounded-xl border text-left transition ${
              templateId === item.id
                ? "border-[#176B5B] ring-2 ring-[#176B5B]/10"
                : "border-[#E4E7EC] hover:border-[#98A2B3]"
            }`}
          >
            <VerticalTemplateThumbnail
              property={property}
              brand={brand}
              templateId={item.id}
            />
            <div className="p-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold">
                  {getVerticalTemplateName(item.id, platform)}
                </span>
                {templateId === item.id && (
                  <Check size={14} className="text-[#176B5B]" />
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-[#667085]">
                {item.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-5 border-t border-[#E4E7EC] pt-5">
        <div className="mb-4">
          <div className="text-sm font-extrabold">
            Textos da arte vertical
          </div>
          <p className="mt-1 text-xs leading-5 text-[#667085]">
            O sistema controla posição e zonas seguras da plataforma.
          </p>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-bold">
            Headline
            <input
              className="app-input mt-2"
              maxLength={template.headlineLimit}
              value={headline}
              onChange={(event) => onHeadlineChange(event.target.value)}
            />
            <span className="mt-1 block text-right text-[10px] font-normal text-[#98A2B3]">
              {headline.length}/{template.headlineLimit}
            </span>
          </label>

          {template.supportsSubheadline && (
            <label className="block text-sm font-bold">
              Subheadline
              <input
                className="app-input mt-2"
                maxLength={template.subheadlineLimit}
                value={subheadline}
                onChange={(event) => onSubheadlineChange(event.target.value)}
              />
              <span className="mt-1 block text-right text-[10px] font-normal text-[#98A2B3]">
                {subheadline.length}/{template.subheadlineLimit}
              </span>
            </label>
          )}

          <label className="block text-sm font-bold">
            CTA
            <input
              className="app-input mt-2"
              maxLength={template.ctaLimit}
              value={cta}
              onChange={(event) => onCtaChange(event.target.value)}
            />
          </label>
        </div>
      </div>
    </>
  );
}
