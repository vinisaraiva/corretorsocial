import { createClient } from "@supabase/supabase-js";
import { config } from "./config.js";

export type WorkerJob = {
  id: string;
  user_id: string;
  type: string;
  status: string;
  priority: number;
  payload: unknown;
  result: unknown;
  attempts: number;
  max_attempts: number;
  run_after: string;
  locked_at: string | null;
  locked_by: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

export const supabase = createClient(
  config.supabaseUrl,
  config.serviceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);

export async function requeueStaleJobs() {
  const { data, error } = await supabase.rpc("requeue_stale_jobs", {
    p_stale_minutes: config.staleJobMinutes,
  });

  if (error) throw error;
  return Number(data ?? 0);
}

export async function claimJob() {
  const { data, error } = await supabase.rpc("claim_jobs", {
    p_worker_id: config.workerId,
    p_limit: 1,
  });

  if (error) throw error;

  const rows = (data ?? []) as WorkerJob[];
  return rows[0] ?? null;
}

export async function completeJob(job: WorkerJob, result: unknown) {
  const { error } = await supabase
    .from("jobs")
    .update({
      status: "completed",
      result,
      locked_at: null,
      locked_by: null,
      last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", job.id)
    .eq("locked_by", config.workerId)
    .eq("status", "processing");

  if (error) throw error;
}

export async function failJob(job: WorkerJob, error: unknown) {
  const message =
    error instanceof Error ? error.message : String(error ?? "Unknown worker error");
  const shouldRetry = job.attempts < job.max_attempts;
  const retryDelayMinutes = Math.min(30, Math.max(1, 2 ** Math.max(0, job.attempts - 1)));

  const { error: updateError } = await supabase
    .from("jobs")
    .update({
      status: shouldRetry ? "retrying" : "failed",
      run_after: shouldRetry
        ? new Date(Date.now() + retryDelayMinutes * 60_000).toISOString()
        : job.run_after,
      locked_at: null,
      locked_by: null,
      last_error: message.slice(0, 4000),
      updated_at: new Date().toISOString(),
    })
    .eq("id", job.id)
    .eq("locked_by", config.workerId)
    .eq("status", "processing");

  if (updateError) throw updateError;
}
