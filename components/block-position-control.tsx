"use client";

import {
  allowedBlockPositions,
  blockPositionLabels,
  type BlockPosition,
} from "@/lib/campaign-layout";
import type { VerticalPlatform } from "@/lib/vertical-templates";

export function BlockPositionControl({
  value,
  onChange,
  platform,
}: {
  value: BlockPosition;
  onChange: (value: BlockPosition) => void;
  platform?: VerticalPlatform;
}) {
  const options = allowedBlockPositions(platform);

  return (
    <div>
      <div className="text-sm font-bold">Posição da chamada</div>
      <p className="mt-1 text-xs leading-5 text-[#667085]">
        Move o bloco completo. O layout interno continua protegido.
      </p>

      <div className="mt-2 grid grid-cols-3 gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            onClick={() => onChange(option)}
            className={`min-h-10 rounded-lg border px-3 text-xs font-bold transition ${
              value === option
                ? "border-[#176B5B] bg-[#E9F4F1] text-[#176B5B]"
                : "border-[#E4E7EC] bg-white text-[#475467] hover:border-[#98A2B3]"
            }`}
          >
            {blockPositionLabels[option]}
          </button>
        ))}
      </div>

      {platform === "tiktok" && (
        <p className="mt-2 text-[11px] leading-4 text-[#667085]">
          No TikTok, a direita fica reservada para os controles da plataforma.
        </p>
      )}
    </div>
  );
}
