import type { PropertyMedia } from "@/types";

export type MediaFormat = "feed_4x5" | "story_9x16" | "tiktok_9x16";

const targetRatios: Record<MediaFormat, number> = {
  feed_4x5: 4 / 5,
  story_9x16: 9 / 16,
  tiktok_9x16: 9 / 16,
};

function normalizeAiScore(value?: number | null) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return 0;
  }

  if (value >= 0 && value <= 1) return value * 30;
  return Math.max(0, Math.min(100, value)) * 0.3;
}

function dimensionScore(
  media: PropertyMedia,
  targetRatio: number,
) {
  if (!media.width || !media.height || media.width <= 0 || media.height <= 0) {
    return 0;
  }

  const pixels = media.width * media.height;
  const referencePixels = 1080 * 1350;
  const resolution = Math.min(1, pixels / referencePixels) * 20;

  const ratio = media.width / media.height;
  const ratioDistance = Math.abs(Math.log(ratio / targetRatio));
  const aspect = Math.max(0, 1 - ratioDistance) * 12;

  const lowResolutionPenalty =
    media.width < 640 || media.height < 640 ? -20 : 0;

  return resolution + aspect + lowResolutionPenalty;
}

export function scoreMediaForFormat(
  media: PropertyMedia,
  format: MediaFormat,
) {
  const coverBonus = media.isCover ? 35 : 0;
  const orderBonus = Math.max(0, 12 - media.sortOrder * 0.75);
  const ai = normalizeAiScore(media.aiScore);
  const dimensions = dimensionScore(media, targetRatios[format]);

  return coverBonus + orderBonus + ai + dimensions;
}

export function rankMediaForFormat(
  media: PropertyMedia[],
  format: MediaFormat,
) {
  return [...media].sort((a, b) => {
    const scoreDiff =
      scoreMediaForFormat(b, format) - scoreMediaForFormat(a, format);

    if (Math.abs(scoreDiff) > 0.001) return scoreDiff;
    return a.sortOrder - b.sortOrder;
  });
}

function primaryTag(media: PropertyMedia) {
  return media.aiTags?.find((tag) => tag && !tag.startsWith("quality:")) ?? null;
}

export function selectCarouselMedia(
  media: PropertyMedia[],
  limit = 6,
) {
  const ranked = rankMediaForFormat(media, "feed_4x5");
  const selected: PropertyMedia[] = [];
  const deferred: PropertyMedia[] = [];
  const usedTags = new Set<string>();

  for (const item of ranked) {
    const tag = primaryTag(item);

    if (tag && usedTags.has(tag)) {
      deferred.push(item);
      continue;
    }

    selected.push(item);
    if (tag) usedTags.add(tag);

    if (selected.length >= limit) return selected;
  }

  for (const item of deferred) {
    selected.push(item);
    if (selected.length >= limit) break;
  }

  return selected;
}

export function buildMediaSelection(
  media: PropertyMedia[],
  manualCoverSelected = false,
) {
  const unique = Array.from(
    new Map(media.map((item) => [item.url, item])).values(),
  );

  const manualCover = manualCoverSelected
    ? unique.find((item) => item.isCover)
    : undefined;

  const carousel = selectCarouselMedia(unique, 6);

  if (manualCover) {
    const withoutCover = carousel.filter((item) => item.url !== manualCover.url);

    return {
      feedCover: manualCover,
      storyCover: manualCover,
      tiktokCover: manualCover,
      carousel: [manualCover, ...withoutCover].slice(0, 6),
    };
  }

  return {
    feedCover: rankMediaForFormat(unique, "feed_4x5")[0],
    storyCover: rankMediaForFormat(unique, "story_9x16")[0],
    tiktokCover: rankMediaForFormat(unique, "tiktok_9x16")[0],
    carousel,
  };
}
