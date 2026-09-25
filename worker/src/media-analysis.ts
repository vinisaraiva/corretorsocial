import { config } from "./config.js";
import { supabase, type WorkerJob } from "./queue.js";

type MediaAnalysisPayload = {
  property_id: string;
};

type AnalysisItem = {
  media_id: string;
  room_type:
    | "exterior"
    | "living_room"
    | "kitchen"
    | "bedroom"
    | "bathroom"
    | "balcony"
    | "leisure"
    | "pool"
    | "view"
    | "floorplan"
    | "other";
  quality_score: number;
  cover_score: number;
  text_space: "left" | "right" | "top" | "bottom" | "center" | "none";
  flags: Array<
    | "blurry"
    | "dark"
    | "overexposed"
    | "watermark"
    | "screenshot"
    | "text_heavy"
    | "duplicate_candidate"
  >;
};

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    analyses: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          media_id: { type: "string" },
          room_type: {
            type: "string",
            enum: [
              "exterior",
              "living_room",
              "kitchen",
              "bedroom",
              "bathroom",
              "balcony",
              "leisure",
              "pool",
              "view",
              "floorplan",
              "other",
            ],
          },
          quality_score: {
            type: "integer",
            minimum: 0,
            maximum: 100,
          },
          cover_score: {
            type: "integer",
            minimum: 0,
            maximum: 100,
          },
          text_space: {
            type: "string",
            enum: ["left", "right", "top", "bottom", "center", "none"],
          },
          flags: {
            type: "array",
            maxItems: 7,
            items: {
              type: "string",
              enum: [
                "blurry",
                "dark",
                "overexposed",
                "watermark",
                "screenshot",
                "text_heavy",
                "duplicate_candidate",
              ],
            },
          },
        },
        required: [
          "media_id",
          "room_type",
          "quality_score",
          "cover_score",
          "text_space",
          "flags",
        ],
      },
    },
  },
  required: ["analyses"],
} as const;

function parsePayload(payload: unknown): MediaAnalysisPayload {
  if (
    !payload ||
    typeof payload !== "object" ||
    !("property_id" in payload) ||
    typeof (payload as Record<string, unknown>).property_id !== "string"
  ) {
    throw new Error("Invalid media_analysis payload.");
  }

  return {
    property_id: (payload as Record<string, string>).property_id,
  };
}

function collectOutputText(response: unknown) {
  if (!response || typeof response !== "object") return "";

  const object = response as Record<string, unknown>;
  if (typeof object.output_text === "string") return object.output_text;

  if (!Array.isArray(object.output)) return "";

  const parts: string[] = [];

  for (const item of object.output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as Record<string, unknown>).content;
    if (!Array.isArray(content)) continue;

    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const value = part as Record<string, unknown>;
      if (value.type === "output_text" && typeof value.text === "string") {
        parts.push(value.text);
      }
    }
  }

  return parts.join("\n");
}

function clampScore(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function validateAnalyses(value: unknown, allowedIds: Set<string>) {
  if (!value || typeof value !== "object") {
    throw new Error("Vision response is not an object.");
  }

  const analyses = (value as Record<string, unknown>).analyses;
  if (!Array.isArray(analyses)) {
    throw new Error("Vision response is missing analyses.");
  }

  const output: AnalysisItem[] = [];

  for (const raw of analyses) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const mediaId = typeof item.media_id === "string" ? item.media_id : "";

    if (!allowedIds.has(mediaId)) continue;

    const roomType = String(item.room_type) as AnalysisItem["room_type"];
    const textSpace = String(item.text_space) as AnalysisItem["text_space"];
    const flags = Array.isArray(item.flags)
      ? item.flags.filter((flag): flag is AnalysisItem["flags"][number] =>
          typeof flag === "string",
        )
      : [];

    output.push({
      media_id: mediaId,
      room_type: roomType,
      quality_score: clampScore(item.quality_score),
      cover_score: clampScore(item.cover_score),
      text_space: textSpace,
      flags,
    });
  }

  return output;
}

async function imageUrlForMedia(media: {
  original_url: string | null;
  storage_path: string | null;
}) {
  if (media.storage_path) {
    const { data, error } = await supabase.storage
      .from("property-media")
      .createSignedUrl(media.storage_path, 10 * 60);

    if (error || !data?.signedUrl) {
      throw new Error("Could not create signed media URL.");
    }

    return data.signedUrl;
  }

  if (media.original_url && /^https?:\/\//i.test(media.original_url)) {
    return media.original_url;
  }

  return null;
}

export async function handleMediaAnalysis(job: WorkerJob) {
  if (!config.openaiApiKey) {
    throw new Error(
      "Missing required environment variable for media analysis: OPENAI_API_KEY",
    );
  }

  const payload = parsePayload(job.payload);

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id,user_id")
    .eq("id", payload.property_id)
    .eq("user_id", job.user_id)
    .maybeSingle();

  if (propertyError || !property) {
    throw new Error("Property not found for media analysis.");
  }

  const { data: mediaRows, error: mediaError } = await supabase
    .from("property_media")
    .select("id,original_url,storage_path,sort_order")
    .eq("property_id", property.id)
    .eq("media_type", "image")
    .order("sort_order", { ascending: true })
    .limit(20);

  if (mediaError) throw mediaError;
  if (!mediaRows || mediaRows.length === 0) {
    return { analyzed: 0, model: config.openaiVisionModel };
  }

  const content: Array<Record<string, unknown>> = [
    {
      type: "input_text",
      text:
        "Analyze these real-estate property photos for creative selection. " +
        "For each image, return exactly one analysis using the media_id immediately preceding it. " +
        "cover_score measures suitability as the main advertising photo, not property value. " +
        "quality_score measures photographic clarity/exposure/composition. " +
        "text_space is the safest broad area for an overlay without covering the main subject. " +
        "Classify only what is visually supported. Do not infer neighborhood, price, luxury, safety, or amenities outside the image.",
    },
  ];

  const validRows: typeof mediaRows = [];

  for (const media of mediaRows) {
    const imageUrl = await imageUrlForMedia(media);
    if (!imageUrl) continue;

    validRows.push(media);
    content.push({
      type: "input_text",
      text: `media_id: ${media.id}`,
    });
    content.push({
      type: "input_image",
      image_url: imageUrl,
      detail: "low",
    });
  }

  if (validRows.length === 0) {
    return { analyzed: 0, model: config.openaiVisionModel };
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.openaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.openaiVisionModel,
      store: false,
      reasoning: { effort: "none" },
      max_output_tokens: 4000,
      input: [
        {
          role: "user",
          content,
        },
      ],
      text: {
        verbosity: "low",
        format: {
          type: "json_schema",
          name: "property_media_analysis",
          strict: true,
          schema,
        },
      },
    }),
    signal: AbortSignal.timeout(90_000),
  });

  const body = (await response.json()) as unknown;

  if (!response.ok) {
    const summary =
      body && typeof body === "object"
        ? JSON.stringify(body).slice(0, 1200)
        : String(body);
    throw new Error(`OpenAI vision request failed: ${response.status} ${summary}`);
  }

  const outputText = collectOutputText(body);
  if (!outputText) {
    throw new Error("OpenAI vision response did not contain output text.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(outputText);
  } catch {
    throw new Error("OpenAI vision response was not valid JSON.");
  }

  const allowedIds = new Set(validRows.map((row) => row.id));
  const analyses = validateAnalyses(parsed, allowedIds);

  for (const analysis of analyses) {
    const tags = [
      `room:${analysis.room_type}`,
      `text-space:${analysis.text_space}`,
      `quality:${analysis.quality_score}`,
      ...analysis.flags.map((flag) => `flag:${flag}`),
    ];

    const { error } = await supabase
      .from("property_media")
      .update({
        ai_score: analysis.cover_score,
        ai_tags: tags,
      })
      .eq("id", analysis.media_id)
      .eq("property_id", property.id);

    if (error) throw error;
  }

  const usage =
    body && typeof body === "object"
      ? (body as Record<string, unknown>).usage ?? null
      : null;

  return {
    analyzed: analyses.length,
    requested: validRows.length,
    model: config.openaiVisionModel,
    usage,
  };
}
