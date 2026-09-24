"use client";

import { toBlob } from "html-to-image";
import { createClient } from "@/lib/supabase/client";

type RenderProvider = "instagram" | "facebook" | "google_business";

async function waitForImages(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll("img"));

  await Promise.all(
    images.map(async (image) => {
      if (image.complete && image.naturalWidth > 0) {
        try {
          await image.decode();
        } catch {
          // A loaded image can still be rendered when decode is unavailable.
        }
        return;
      }

      await new Promise<void>((resolve) => {
        const finish = () => resolve();
        image.addEventListener("load", finish, { once: true });
        image.addEventListener("error", finish, { once: true });
      });
    }),
  );
}

async function renderNode(
  node: HTMLElement,
  targetWidth: number,
  targetHeight: number,
) {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  await waitForImages(node);

  const rect = node.getBoundingClientRect();

  if (rect.width <= 0 || rect.height <= 0) {
    throw new Error("A arte não está disponível para renderização.");
  }

  const expectedRatio = targetWidth / targetHeight;
  const actualRatio = rect.width / rect.height;

  if (Math.abs(expectedRatio - actualRatio) > 0.02) {
    throw new Error("A proporção da arte não corresponde ao formato final.");
  }

  const pixelRatio = targetWidth / rect.width;

  const blob = await toBlob(node, {
    cacheBust: true,
    pixelRatio,
    backgroundColor: "#FFFFFF",
    filter: (currentNode) => {
      if (!(currentNode instanceof HTMLElement)) return true;
      return currentNode.dataset.renderIgnore !== "true";
    },
  });

  if (!blob) {
    throw new Error("Não foi possível gerar o arquivo PNG.");
  }

  return blob;
}

export async function renderAndUploadCampaignAssets(input: {
  campaignId: string;
  provider: RenderProvider;
  format: string;
  selector: string;
  width: number;
  height: number;
}) {
  const nodes = Array.from(
    document.querySelectorAll<HTMLElement>(input.selector),
  );

  if (nodes.length === 0) {
    throw new Error("Não encontramos a arte pronta para gerar o arquivo.");
  }

  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Sua sessão expirou. Entre novamente.");
  }

  const timestamp = Date.now();
  const paths: string[] = [];

  try {
    for (const [index, node] of nodes.entries()) {
      const blob = await renderNode(node, input.width, input.height);
      const page = String(index + 1).padStart(2, "0");
      const path =
        `${user.id}/${input.campaignId}/${input.provider}-${input.format}/` +
        `${timestamp}-${page}.png`;

      const { error } = await supabase.storage
        .from("campaign-assets")
        .upload(path, blob, {
          contentType: "image/png",
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        throw error;
      }

      paths.push(path);
    }

    return paths;
  } catch (error) {
    if (paths.length > 0) {
      await supabase.storage.from("campaign-assets").remove(paths);
    }

    throw error instanceof Error
      ? error
      : new Error("Não foi possível gerar os arquivos da campanha.");
  }
}
