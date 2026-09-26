import {
  CreativePreview,
  type CampaignBrand,
} from "@/components/campaign/creative-preview";
import { InstagramCarouselRenderSet } from "@/components/instagram-carousel-preview";
import { VerticalCreativePreview } from "@/components/vertical-creative-preview";
import { suggestedBlockPositionFromTags, type BlockPosition } from "@/lib/campaign-layout";
import type { CampaignTemplateId } from "@/lib/campaign-templates";
import type {
  CarouselFinalCardDecoration,
  CarouselFinalCardTheme,
  CarouselModelId,
} from "@/lib/carousel-templates";
import type { VerticalTemplateId } from "@/lib/vertical-templates";
import type { Property } from "@/types";

type NonVerticalRenderInput = {
  property: Property;
  caption: string;
  blockPosition: BlockPosition;
  aiTags?: string[];
};

type StoryRenderInput = {
  property: Property;
  templateId: VerticalTemplateId;
  headline: string;
  subheadline: string;
  cta: string;
  blockPosition: BlockPosition;
  aiTags?: string[];
};

type CarouselRenderInput = {
  property: Property;
  modelId: CarouselModelId;
  headline: string;
  cta: string;
  finalCardDecoration: CarouselFinalCardDecoration;
  finalCardTheme: CarouselFinalCardTheme;
};

export function CampaignRenderWorkspace({
  brand,
  templateId,
  headline,
  subheadline,
  cta,
  instagramFeed,
  story,
  facebook,
  google,
  carousel,
}: {
  brand: CampaignBrand;
  templateId: CampaignTemplateId;
  headline: string;
  subheadline: string;
  cta: string;
  instagramFeed: NonVerticalRenderInput;
  story: StoryRenderInput;
  facebook: NonVerticalRenderInput;
  google: NonVerticalRenderInput;
  carousel?: CarouselRenderInput;
}) {
  const nonVertical = [
    {
      key: "instagram-feed",
      renderTarget: "schedule-instagram-feed",
      input: instagramFeed,
    },
    {
      key: "facebook",
      renderTarget: "schedule-facebook",
      input: facebook,
    },
    {
      key: "google",
      renderTarget: "schedule-google",
      input: google,
    },
  ] as const;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-[-30000px] top-0 z-[-1]"
    >
      {nonVertical.map(({ key, renderTarget, input }) => (
        <div key={key} className="w-[430px]">
          <CreativePreview
            property={input.property}
            brand={brand}
            templateId={templateId}
            headline={headline}
            subheadline={subheadline}
            copy={input.caption}
            cta={cta}
            blockPosition={input.blockPosition}
            suggestedBlockPosition={suggestedBlockPositionFromTags(
              input.aiTags,
            )}
            renderTarget={renderTarget}
          />
        </div>
      ))}

      <div className="w-[330px]">
        <VerticalCreativePreview
          property={story.property}
          brand={brand}
          platform="instagram_story"
          templateId={story.templateId}
          headline={story.headline}
          subheadline={story.subheadline}
          cta={story.cta}
          blockPosition={story.blockPosition}
          suggestedBlockPosition={suggestedBlockPositionFromTags(story.aiTags)}
          renderTarget="schedule-story"
        />
      </div>

      {carousel && (
        <InstagramCarouselRenderSet
          property={carousel.property}
          brand={brand}
          templateId={templateId}
          modelId={carousel.modelId}
          headline={carousel.headline}
          cta={carousel.cta}
          finalCardDecoration={carousel.finalCardDecoration}
          finalCardTheme={carousel.finalCardTheme}
          renderGroup="schedule-carousel"
        />
      )}
    </div>
  );
}
