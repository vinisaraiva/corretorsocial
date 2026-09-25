import { config } from "./config.js";
import { handleJob } from "./handlers.js";
import {
  claimJob,
  completeJob,
  failJob,
  requeueStaleJobs,
  type WorkerJob,
} from "./queue.js";

export async function recoverStaleJobs() {
  const recovered = await requeueStaleJobs();

  if (recovered > 0) {
    console.log(
      `[${config.workerId}] recovered ${recovered} stale job(s)`,
    );
  }

  return recovered;
}

export async function processClaimedJob(job: WorkerJob) {
  console.log(
    `[${config.workerId}] processing ${job.type} ${job.id} attempt ${job.attempts}/${job.max_attempts}`,
  );

  try {
    const result = await handleJob(job);
    await completeJob(job, result ?? {});
    console.log(`[${config.workerId}] completed ${job.id}`);
    return { ok: true as const, job };
  } catch (error) {
    await failJob(job, error);
    console.error(
      `[${config.workerId}] failed ${job.id}`,
      error instanceof Error ? error.message : error,
    );
    return { ok: false as const, job, error };
  }
}

export async function claimAndProcessOne() {
  const job = await claimJob();

  if (!job) return null;

  return processClaimedJob(job);
}
