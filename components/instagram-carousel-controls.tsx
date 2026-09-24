"use client";

import { Check } from "lucide-react";
import {
  getAvailableCarouselModels,
  type CarouselModelId,
} from "@/lib/carousel-templates";

export function InstagramCarouselControls({
  purpose,
  modelId,
  headline,
  cta,
  onModelChange,
  onHeadlineChange,
  onCtaChange,
}: {
  purpose: "Venda" | "Aluguel";
  modelId: CarouselModelId;
  headline: string;
  cta: string;
  onModelChange: (value: CarouselModelId) => void;
  onHeadlineChange: (value: string) => void;
  onCtaChange: (value: string) => void;
}) {
  const models = getAvailableCarouselModels(purpose);

  return (
    <div className="mt-5 border-t border-[#E4E7EC] pt-5">
      <div className="text-sm font-extrabold">Modelo do Carrossel</div>
      <p className="mt-1 text-xs leading-5 text-[#667085]">
        O estilo visual continua vindo da campanha. Aqui muda apenas a narrativa
        dos slides.
      </p>

      <div className="mt-3 space-y-2">
        {models.map((model) => (
          <button
            key={model.id}
            type="button"
            aria-pressed={modelId === model.id}
            onClick={() => onModelChange(model.id)}
            className={`flex w-full items-start justify-between gap-3 rounded-xl border p-3 text-left transition ${
              modelId === model.id
                ? "border-[#176B5B] bg-[#E9F4F1]"
                : "border-[#E4E7EC] bg-white hover:border-[#98A2B3]"
            }`}
          >
            <div>
              <div className="text-sm font-extrabold">{model.name}</div>
              <div className="mt-1 text-xs leading-5 text-[#667085]">
                {model.description}
              </div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[#98A2B3]">
                {model.slideCount} páginas
              </div>
            </div>
            {modelId === model.id && (
              <Check size={16} className="mt-0.5 shrink-0 text-[#176B5B]" />
            )}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-4">
        <label className="block text-sm font-bold">
          Headline da capa
          <input
            className="app-input mt-2"
            maxLength={60}
            value={headline}
            onChange={(event) => onHeadlineChange(event.target.value)}
          />
        </label>

        <label className="block text-sm font-bold">
          CTA final
          <input
            className="app-input mt-2"
            maxLength={36}
            value={cta}
            onChange={(event) => onCtaChange(event.target.value)}
          />
        </label>
      </div>
    </div>
  );
}
