"use server";

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import * as cheerio from "cheerio";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type PropertyDraftInput = {
  title: string;
  purpose: "Venda" | "Aluguel";
  price: number;
  neighborhood: string;
  city: string;
  state?: string;
  bedrooms: number;
  suites: number;
  bathrooms: number;
  parking: number;
  area: number;
  description: string;
  highlights: string[];
  sourceUrl?: string;
  images?: string[];
};

export type ExtractedProperty = PropertyDraftInput & {
  sourceUrl: string;
  sourceDomain: string;
  confidence: "high" | "medium" | "low";
};

function isPrivateIpv4(address: string) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return true;

  const [a, b] = parts;

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isPrivateIpv6(address: string) {
  const normalized = address.toLowerCase();

  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb") ||
    normalized.startsWith("::ffff:127.") ||
    normalized.startsWith("::ffff:10.") ||
    normalized.startsWith("::ffff:192.168.") ||
    normalized.startsWith("::ffff:169.254.")
  );
}

function isPrivateAddress(address: string) {
  const version = isIP(address);
  if (version === 4) return isPrivateIpv4(address);
  if (version === 6) return isPrivateIpv6(address);
  return true;
}

async function assertPublicUrl(rawUrl: string) {
  let url: URL;

  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("O link informado não é válido.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Use apenas links HTTP ou HTTPS.");
  }

  if (url.username || url.password) {
    throw new Error("Links com usuário ou senha não são permitidos.");
  }

  const hostname = url.hostname.toLowerCase();

  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw new Error("Esse endereço não pode ser acessado.");
  }

  const directIpVersion = isIP(hostname);
  if (directIpVersion && isPrivateAddress(hostname)) {
    throw new Error("Esse endereço não pode ser acessado.");
  }

  if (!directIpVersion) {
    let resolved;

    try {
      resolved = await lookup(hostname, { all: true });
    } catch {
      throw new Error("Não foi possível localizar o servidor desse link.");
    }

    if (
      resolved.length === 0 ||
      resolved.some((entry) => isPrivateAddress(entry.address))
    ) {
      throw new Error("Esse endereço não pode ser acessado.");
    }
  }

  return url;
}

async function fetchHtmlWithSafeRedirects(rawUrl: string) {
  let currentUrl = await assertPublicUrl(rawUrl);

  for (let redirectCount = 0; redirectCount <= 3; redirectCount += 1) {
    const response = await fetch(currentUrl, {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; CorretorSocial/0.1; property-import)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(12_000),
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");

      if (!location) {
        throw new Error("O site redirecionou a página sem informar o destino.");
      }

      currentUrl = await assertPublicUrl(
        new URL(location, currentUrl).toString(),
      );
      continue;
    }

    if (!response.ok) {
      throw new Error(
        `O site respondeu com o código ${response.status}. Tente o cadastro manual.`,
      );
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (
      contentType &&
      !contentType.includes("text/html") &&
      !contentType.includes("application/xhtml+xml")
    ) {
      throw new Error("O link não parece apontar para uma página de imóvel.");
    }

    const declaredLength = Number(response.headers.get("content-length") ?? 0);
    const maxBytes = 5_000_000;

    if (declaredLength > maxBytes) {
      throw new Error("A página é grande demais para a leitura automática.");
    }

    if (!response.body) {
      throw new Error("O site não retornou conteúdo.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let received = 0;
    let html = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      received += value.byteLength;

      if (received > maxBytes) {
        await reader.cancel();
        throw new Error("A página é grande demais para a leitura automática.");
      }

      html += decoder.decode(value, { stream: true });
    }

    html += decoder.decode();

    return {
      html,
      finalUrl: currentUrl.toString(),
    };
  }

  throw new Error("O link possui redirecionamentos demais.");
}

function collectJsonLd(value: unknown, output: Record<string, unknown>[]) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectJsonLd(item, output));
    return;
  }

  if (!value || typeof value !== "object") return;

  const object = value as Record<string, unknown>;
  output.push(object);

  if ("@graph" in object) collectJsonLd(object["@graph"], output);
  if ("mainEntity" in object) collectJsonLd(object.mainEntity, output);
  if ("itemListElement" in object) collectJsonLd(object.itemListElement, output);
}

function textValue(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function parseMoney(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return 0;

  const cleaned = value
    .replace(/[^0-9.,]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");

  const number = Number(cleaned);
  return Number.isFinite(number) ? number : 0;
}

function numericValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const match = value.replace(",", ".").match(/\d+(?:\.\d+)?/);
    if (match) return Number(match[0]);
  }

  if (value && typeof value === "object" && "value" in value) {
    return numericValue((value as Record<string, unknown>).value);
  }

  return 0;
}

function resolveImage(raw: string, baseUrl: string) {
  try {
    const url = new URL(raw, baseUrl);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

function imagesFromJsonLd(value: unknown, baseUrl: string) {
  const rawImages: string[] = [];

  const add = (entry: unknown) => {
    if (typeof entry === "string") {
      rawImages.push(entry);
      return;
    }

    if (entry && typeof entry === "object") {
      const object = entry as Record<string, unknown>;
      const url = textValue(object.url) || textValue(object.contentUrl);
      if (url) rawImages.push(url);
    }
  };

  if (Array.isArray(value)) value.forEach(add);
  else add(value);

  return rawImages
    .map((item) => resolveImage(item, baseUrl))
    .filter((item): item is string => Boolean(item));
}

function firstNonEmpty(...values: unknown[]) {
  for (const value of values) {
    const text = textValue(value);
    if (text) return text;
  }
  return "";
}

export async function extractPropertyFromUrl(
  rawUrl: string,
): Promise<ExtractedProperty> {
  const { html, finalUrl } = await fetchHtmlWithSafeRedirects(rawUrl);
  const $ = cheerio.load(html);
  const jsonLdObjects: Record<string, unknown>[] = [];

  $('script[type="application/ld+json"]').each((_, element) => {
    const raw = $(element).text().trim();
    if (!raw) return;

    try {
      collectJsonLd(JSON.parse(raw), jsonLdObjects);
    } catch {
      // Ignore invalid JSON-LD blocks and continue with metadata.
    }
  });

  const candidate =
    jsonLdObjects.find((object) => {
      const type = object["@type"];
      const types = Array.isArray(type) ? type.map(String) : [String(type ?? "")];

      return types.some((item) =>
        /RealEstate|Apartment|House|Residence|Accommodation|Product|Offer/i.test(
          item,
        ),
      );
    }) ??
    jsonLdObjects.find((object) => object.offers || object.address) ??
    {};

  const offers =
    candidate.offers && typeof candidate.offers === "object"
      ? (candidate.offers as Record<string, unknown>)
      : {};

  const address =
    candidate.address && typeof candidate.address === "object"
      ? (candidate.address as Record<string, unknown>)
      : {};

  const ogTitle = $('meta[property="og:title"]').attr("content");
  const metaDescription =
    $('meta[property="og:description"]').attr("content") ??
    $('meta[name="description"]').attr("content");

  const title = firstNonEmpty(candidate.name, candidate.headline, ogTitle, $("title").text());
  const description = firstNonEmpty(candidate.description, metaDescription);

  const price = parseMoney(
    offers.price ??
      candidate.price ??
      $('meta[property="product:price:amount"]').attr("content"),
  );

  const city = firstNonEmpty(
    address.addressLocality,
    candidate.addressLocality,
  );
  const state = firstNonEmpty(address.addressRegion);
  const neighborhood = firstNonEmpty(
    address.addressSubLocality,
    candidate.addressSubLocality,
  );

  const pageText = $("body").text().replace(/\s+/g, " ").slice(0, 80_000);
  const purpose: "Venda" | "Aluguel" =
    /aluguel|alugar|loca(?:ç|c)[aã]o/i.test(
      `${title} ${description} ${pageText.slice(0, 15_000)}`,
    )
      ? "Aluguel"
      : "Venda";

  const images = [
    ...imagesFromJsonLd(candidate.image, finalUrl),
    ...imagesFromJsonLd(candidate.photo, finalUrl),
  ];

  const ogImage = $('meta[property="og:image"]').attr("content");
  if (ogImage) {
    const resolved = resolveImage(ogImage, finalUrl);
    if (resolved) images.push(resolved);
  }

  if (images.length < 4) {
    $("img[src]").each((_, element) => {
      if (images.length >= 20) return false;
      const src = $(element).attr("src");
      if (!src) return;
      const resolved = resolveImage(src, finalUrl);
      if (resolved) images.push(resolved);
    });
  }

  const uniqueImages = [...new Set(images)].slice(0, 20);

  const bedrooms = numericValue(
    candidate.numberOfBedrooms ?? candidate.numberOfRooms,
  );
  const bathrooms = numericValue(candidate.numberOfBathroomsTotal);
  const parking = numericValue(
    candidate.numberOfParkingSpaces ?? candidate.parking,
  );
  const area = numericValue(
    candidate.floorSize ?? candidate.area ?? candidate.floorArea,
  );

  const knownFields = [
    title,
    description,
    price,
    city,
    uniqueImages.length,
    area,
  ].filter(Boolean).length;

  const confidence: "high" | "medium" | "low" =
    knownFields >= 5 ? "high" : knownFields >= 3 ? "medium" : "low";

  if (!title && !description && uniqueImages.length === 0) {
    throw new Error(
      "Não conseguimos identificar informações do imóvel nessa página. Use o cadastro manual.",
    );
  }

  const final = new URL(finalUrl);

  return {
    title: title || "Imóvel sem título",
    purpose,
    price,
    neighborhood,
    city,
    state,
    bedrooms,
    suites: numericValue(candidate.numberOfSuites),
    bathrooms,
    parking,
    area,
    description,
    highlights: [],
    sourceUrl: finalUrl,
    sourceDomain: final.hostname,
    images: uniqueImages,
    confidence,
  };
}

export async function createProperty(input: PropertyDraftInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!input.title.trim()) {
    throw new Error("Informe um título para o imóvel.");
  }

  const sourceDomain = input.sourceUrl
    ? new URL(input.sourceUrl).hostname
    : null;

  const { data: property, error } = await supabase
    .from("properties")
    .insert({
      user_id: user.id,
      source_url: input.sourceUrl?.trim() || null,
      source_domain: sourceDomain,
      purpose: input.purpose === "Aluguel" ? "rent" : "sale",
      title: input.title.trim(),
      price: input.price || null,
      neighborhood: input.neighborhood.trim() || null,
      city: input.city.trim() || null,
      state: input.state?.trim() || null,
      public_location:
        [input.neighborhood, input.city].filter(Boolean).join(", ") || null,
      bedrooms: input.bedrooms || null,
      suites: input.suites || null,
      bathrooms: input.bathrooms || null,
      parking: input.parking || null,
      area_m2: input.area || null,
      description: input.description.trim() || null,
      highlights: input.highlights,
      imported_at: input.sourceUrl ? new Date().toISOString() : null,
      status: "active",
    })
    .select("id")
    .single();

  if (error || !property) {
    throw new Error("Não foi possível salvar o imóvel.");
  }

  const images = (input.images ?? []).slice(0, 20);

  if (images.length > 0) {
    const { error: mediaError } = await supabase.from("property_media").insert(
      images.map((image, index) => ({
        property_id: property.id,
        original_url: image,
        sort_order: index,
        is_cover: index === 0,
      })),
    );

    if (mediaError) {
      // The property is still valid; image import can be retried later.
      console.error("Failed to store imported image references", mediaError);
    }
  }

  return property.id;
}


export async function deletePropertyDraft(propertyId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("properties")
    .delete()
    .eq("id", propertyId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error("Não foi possível desfazer o cadastro incompleto.");
  }
}


export async function queuePropertyMediaAnalysis(propertyId: string) {
  if (process.env.MEDIA_ANALYSIS_ENABLED !== "true") {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: property } = await supabase
    .from("properties")
    .select("id")
    .eq("id", propertyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!property) {
    throw new Error("Imóvel não encontrado para análise de fotos.");
  }

  const { data: media } = await supabase
    .from("property_media")
    .select("id")
    .eq("property_id", property.id)
    .eq("media_type", "image")
    .limit(1);

  if (!media || media.length === 0) {
    return null;
  }

  const { data: existing } = await supabase
    .from("jobs")
    .select("id,status")
    .eq("user_id", user.id)
    .eq("type", "media_analysis")
    .in("status", ["queued", "processing", "retrying"])
    .contains("payload", { property_id: property.id })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    if (existing.status !== "processing") {
      const { error: invokeError } = await supabase.functions.invoke(
        "media-analysis",
        {
          body: {
            job_id: existing.id,
          },
        },
      );

      if (invokeError) {
        console.error(
          "Failed to re-invoke media-analysis Edge Function",
          invokeError,
        );
      }
    }

    return existing.id;
  }

  const { data: job, error } = await supabase
    .from("jobs")
    .insert({
      user_id: user.id,
      type: "media_analysis",
      priority: 80,
      payload: {
        property_id: property.id,
      },
      max_attempts: 3,
    })
    .select("id")
    .single();

  if (error || !job) {
    throw new Error("Não foi possível iniciar a análise das fotos.");
  }

  const { error: invokeError } = await supabase.functions.invoke(
    "media-analysis",
    {
      body: {
        job_id: job.id,
      },
    },
  );

  if (invokeError) {
    console.error("Failed to invoke media-analysis Edge Function", invokeError);
  }

  return job.id;
}
