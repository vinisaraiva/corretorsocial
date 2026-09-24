import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

type JobRow = {
  id: string;
  user_id: string;
  type: string;
  status: string;
  payload: unknown;
  attempts: number;
  max_attempts: number;
  run_after: string;
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
  flags: string[];
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
          quality_score: { type: "integer", minimum: 0, maximum: 100 },
          cover_score: { type: "integer", minimum: 0, maximum: 100 },
          text_space: {
            type: "string",
            enum: ["left", "right", "top", "bottom", "center", "none"],
          },
          flags: {
            type: "array",
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

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function readSecretKey() {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;

  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (!raw) throw new Error("Supabase secret key is unavailable.");

  const parsed = JSON.parse(raw) as Record<string, string>;
  if (!parsed.default) throw new Error("Default Supabase secret key is unavailable.");
  return parsed.default;
}

function readPublishableKey() {
  const legacy = Deno.env.get("SUPABASE_ANON_KEY");
  if (legacy) return legacy;

  const raw = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  if (!raw) throw new Error("Supabase publishable key is unavailable.");

  const parsed = JSON.parse(raw) as Record<string, string>;
  if (!parsed.default) throw new Error("Default Supabase publishable key is unavailable.");
  return parsed.default;
}

function clamp(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
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

    output.push({
      media_id: mediaId,
      room_type: String(item.room_type) as AnalysisItem["room_type"],
      quality_score: clamp(item.quality_score),
      cover_score: clamp(item.cover_score),
      text_space: String(item.text_space) as AnalysisItem["text_space"],
      flags: Array.isArray(item.flags)
        ? item.flags.filter((flag): flag is string => typeof flag === "string")
        : [],
    });
  }

  return output;
}

async function processJob(job: JobRow, workerId: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(supabaseUrl, readSecretKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    if (job.type !== "media_analysis") {
      throw new Error(`Unsupported job type: ${job.type}`);
    }

    const payload =
      job.payload && typeof job.payload === "object"
        ? (job.payload as Record<string, unknown>)
        : null;
    const propertyId =
      typeof payload?.property_id === "string" ? payload.property_id : "";

    if (!propertyId) throw new Error("Invalid media_analysis payload.");

    const { data: property, error: propertyError } = await admin
      .from("properties")
      .select("id,user_id")
      .eq("id", propertyId)
      .eq("user_id", job.user_id)
      .maybeSingle();

    if (propertyError || !property) {
      throw new Error("Property not found for media analysis.");
    }

    const { data: mediaRows, error: mediaError } = await admin
      .from("property_media")
      .select("id,original_url,storage_path,sort_order")
      .eq("property_id", property.id)
      .eq("media_type", "image")
      .order("sort_order", { ascending: true })
      .limit(20);

    if (mediaError) throw mediaError;

    if (!mediaRows || mediaRows.length === 0) {
      await admin
        .from("jobs")
        .update({
          status: "completed",
          result: { analyzed: 0 },
          locked_at: null,
          locked_by: null,
          last_error: null,
        })
        .eq("id", job.id)
        .eq("locked_by", workerId);
      return;
    }

    const content: Array<Record<string, unknown>> = [
      {
        type: "input_text",
        text:
          "Analyze these real-estate property photos for creative selection. " +
          "For each image, return exactly one analysis using the media_id immediately preceding it. " +
          "cover_score measures suitability as the main advertising photo, not property value. " +
          "quality_score measures photographic clarity, exposure and composition. " +
          "text_space is the safest broad area for overlay text without covering the main subject. " +
          "Classify only what is visually supported. Do not infer location, price, luxury, safety, value, or amenities outside the image.",
      },
    ];

    const validRows: typeof mediaRows = [];

    for (const media of mediaRows) {
      let imageUrl: string | null = null;

      if (media.storage_path) {
        const { data } = await admin.storage
          .from("property-media")
          .createSignedUrl(media.storage_path, 10 * 60);
        imageUrl = data?.signedUrl ?? null;
      } else if (media.original_url && /^https?:\/\//i.test(media.original_url)) {
        imageUrl = media.original_url;
      }

      if (!imageUrl) continue;

      validRows.push(media);
      content.push({ type: "input_text", text: `media_id: ${media.id}` });
      content.push({ type: "input_image", image_url: imageUrl, detail: "low" });
    }

    if (validRows.length === 0) {
      throw new Error("No accessible images were available for analysis.");
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");

    const model = Deno.env.get("OPENAI_VISION_MODEL")?.trim() || "gpt-5.6-luna";

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        store: false,
        reasoning: { effort: "none" },
        max_output_tokens: 4000,
        input: [{ role: "user", content }],
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
      signal: AbortSignal.timeout(120_000),
    });

    const responseBody = (await response.json()) as unknown;

    if (!response.ok) {
      throw new Error(
        `OpenAI vision request failed: ${response.status} ${JSON.stringify(responseBody).slice(0, 1200)}`,
      );
    }

    const outputText = collectOutputText(responseBody);
    if (!outputText) throw new Error("Vision response did not contain output text.");

    const analyses = validateAnalyses(
      JSON.parse(outputText),
      new Set(validRows.map((row) => row.id)),
    );

    for (const analysis of analyses) {
      const tags = [
        `room:${analysis.room_type}`,
        `text-space:${analysis.text_space}`,
        `quality:${analysis.quality_score}`,
        ...analysis.flags.map((flag) => `flag:${flag}`),
      ];

      const { error } = await admin
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
      responseBody && typeof responseBody === "object"
        ? (responseBody as Record<string, unknown>).usage ?? null
        : null;

    const { error: completeError } = await admin
      .from("jobs")
      .update({
        status: "completed",
        result: {
          analyzed: analyses.length,
          requested: validRows.length,
          model,
          usage,
        },
        locked_at: null,
        locked_by: null,
        last_error: null,
      })
      .eq("id", job.id)
      .eq("locked_by", workerId)
      .eq("status", "processing");

    if (completeError) throw completeError;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const shouldRetry = job.attempts < job.max_attempts;
    const retryDelayMinutes = Math.min(
      30,
      Math.max(1, 2 ** Math.max(0, job.attempts - 1)),
    );

    await admin
      .from("jobs")
      .update({
        status: shouldRetry ? "retrying" : "failed",
        run_after: shouldRetry
          ? new Date(Date.now() + retryDelayMinutes * 60_000).toISOString()
          : job.run_after,
        locked_at: null,
        locked_by: null,
        last_error: message.slice(0, 4000),
      })
      .eq("id", job.id)
      .eq("locked_by", workerId)
      .eq("status", "processing");
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.slice("Bearer ".length);
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const userClient = createClient(supabaseUrl, readPublishableKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser(token);

  if (userError || !user) return json({ error: "Unauthorized" }, 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const jobId =
    body && typeof body === "object" && typeof (body as Record<string, unknown>).job_id === "string"
      ? (body as Record<string, string>).job_id
      : "";

  if (!jobId) return json({ error: "job_id is required" }, 400);

  const admin = createClient(supabaseUrl, readSecretKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const workerId = `edge-media-analysis:${crypto.randomUUID()}`;

  const { data, error } = await admin.rpc("claim_job_by_id", {
    p_job_id: jobId,
    p_user_id: user.id,
    p_worker_id: workerId,
  });

  if (error) return json({ error: "Could not claim job" }, 500);

  const job = (data?.[0] ?? null) as JobRow | null;

  if (!job) {
    const { data: existing } = await userClient
      .from("jobs")
      .select("id,status")
      .eq("id", jobId)
      .maybeSingle();

    if (!existing) return json({ error: "Job not found" }, 404);

    return json({
      accepted: false,
      job_id: existing.id,
      status: existing.status,
    });
  }

  EdgeRuntime.waitUntil(processJob(job, workerId));

  return json(
    {
      accepted: true,
      job_id: job.id,
      status: "processing",
    },
    202,
  );
});
