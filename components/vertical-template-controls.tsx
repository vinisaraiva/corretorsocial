"use client";

import { BlockPositionControl } from "@/components/block-position-control";
import {
  getVerticalTemplate,
  type VerticalPlatform,
  type VerticalTemplateId,
} from "@/lib/vertical-templates";
import type { BlockPosition } from "@/lib/campaign-layout";

export function VerticalTemplateControls({
  platform,
  templateId,
  blockPosition,
  headline,
  subheadline,
  cta,
  onBlockPositionChange,
  onHeadlineChange,
  onSubheadlineChange,
  onCtaChange,
}: {
  platform: VerticalPlatform;
  templateId: VerticalTemplateId;
  blockPosition: BlockPosition;
  headline: string;
  subheadline: string;
  cta: string;
  onBlockPositionChange: (value: BlockPosition) => void;
  onHeadlineChange: (value: string) => void;
  onSubheadlineChange: (value: string) => void;
  onCtaChange: (value: string) => void;
}) {
  const template = getVerticalTemplate(templateId);

  return (
    <div className="mt-5 border-t border-[#E4E7EC] pt-5">
      <div className="mb-4">
        <div className="text-sm font-extrabold">Ajustes desta versão</div>
        <p className="mt-1 text-xs leading-5 text-[#667085]">
          O estilo vem da campanha. Aqui você ajusta apenas esta mídia.
        </p>
      </div>

      <div className="space-y-4">
        {template.supportsBlockPosition && (
          <BlockPositionControl
            value={blockPosition}
            onChange={onBlockPositionChange}
            platform={platform}
          />
        )}

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
  );
}
