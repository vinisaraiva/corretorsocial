function required(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function positiveInteger(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) return fallback;

  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

export const config = {
  supabaseUrl: required("SUPABASE_URL"),
  serviceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
  workerId: process.env.WORKER_ID?.trim() || "corretor-social-worker",
  pollIntervalMs: positiveInteger("POLL_INTERVAL_MS", 3000),
  staleJobMinutes: positiveInteger("STALE_JOB_MINUTES", 15),
  openaiApiKey: required("OPENAI_API_KEY"),
  openaiVisionModel:
    process.env.OPENAI_VISION_MODEL?.trim() || "gpt-5.6-luna",
};
