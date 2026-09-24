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

export function suggestedBlockPositionFromTags(
  tags?: string[] | null,
): Exclude<BlockPosition, "auto"> | null {
  if (tags?.includes("text-space:left")) return "left";
  if (tags?.includes("text-space:right")) return "right";
  return null;
}

export function resolveBlockPosition(
  position: BlockPosition,
  platform?: VerticalPlatform,
  suggested?: Exclude<BlockPosition, "auto"> | null,
): Exclude<BlockPosition, "auto"> {
  const requested = position === "auto" ? suggested ?? "left" : position;

  if (requested === "right" && platform === "tiktok") return "left";
  return requested;
}
