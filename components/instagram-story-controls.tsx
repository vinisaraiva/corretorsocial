"use client";

import { Check } from "lucide-react";
import type { Property } from "@/types";
import {
  getInstagramStoryTemplate,
  instagramStoryTemplates,
  type InstagramStoryTemplateId,
} from "@/lib/instagram-story-templates";
import { InstagramStoryThumbnail } from "@/components/instagram-story-preview";

type StoryBrand = {
  professionalName: string;
  logoUrl?: string | null;
  primaryColor: string;
};

export function InstagramStoryControls({
  property,
  brand,
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
  brand: StoryBrand;
  templateId: InstagramStoryTemplateId;
  headline: string;
  subheadline: string;
  cta: string;
  onTemplateChange: (value: InstagramStoryTemplateId) => void;
  onHeadlineChange: (value: string) => void;
  onSubheadlineChange: (value: string) => void;
  onCtaChange: (value: string) => void;
}) {
  const template = getInstagramStoryTemplate(templateId);

  return (
    <>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {instagramStoryTemplates.map((item) => (
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
            <InstagramStoryThumbnail
              property={property}
              brand={brand}
              templateId={item.id}
            />
            <div className="p-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold">{item.name}</span>
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
          <div className="text-sm font-extrabold">Textos do Story</div>
          <p className="mt-1 text-xs leading-5 text-[#667085]">
            O sistema controla posição e área segura. Você edita apenas o
            conteúdo.
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
            <span className="mt-1 block text-xs font-normal text-[#667085]">
              Mantido dentro da área segura inferior do Story.
            </span>
          </label>
        </div>
      </div>
    </>
  );
}
