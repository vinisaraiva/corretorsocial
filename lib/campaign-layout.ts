import type { CampaignTemplateId } from "@/lib/campaign-templates";
import type { VerticalTemplateId, VerticalPlatform } from "@/lib/vertical-templates";

export type BlockPosition = "auto" | "left" | "right";

export const blockPositionLabels: Record<BlockPosition, string> = {
  auto: "Automática",
  left: "Esquerda",
  right: "Direita",
};

export function normalizeBlockPosition(value?: string | null): BlockPosition {
  return value === "left" || value === "right" ? value : "auto";
}

export function campaignTemplateToVertical(
  templateId: CampaignTemplateId,
): VerticalTemplateId {
  switch (templateId) {
    case "commercial":
    case "info-card":
      return "vertical-commercial";
    case "opportunity":
      return "vertical-opportunity";
    case "brand-frame":
      return "vertical-branding";
    case "clean-base":
    case "clean-top":
    default:
      return "vertical-clean";
  }
}

export function allowedBlockPositions(
  platform?: VerticalPlatform,
): BlockPosition[] {
  if (platform === "tiktok") {
    return ["auto", "left"];
  }

  return ["auto", "left", "right"];
}

export function resolveBlockPosition(
  position: BlockPosition,
  platform?: VerticalPlatform,
): Exclude<BlockPosition, "auto"> {
  if (position === "right" && platform === "tiktok") return "left";
  if (position === "auto") return "left";
  return position;
}
