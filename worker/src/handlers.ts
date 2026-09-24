import type { WorkerJob } from "./queue.js";

export async function handleJob(job: WorkerJob) {
  switch (job.type) {
    default:
      throw new Error(`Unsupported job type: ${job.type}`);
  }
}
