import type { WorkerJob } from "./queue.js";
import { handleMediaAnalysis } from "./media-analysis.js";

export async function handleJob(job: WorkerJob) {
  switch (job.type) {
    case "media_analysis":
      return handleMediaAnalysis(job);
    default:
      throw new Error(`Unsupported job type: ${job.type}`);
  }
}
