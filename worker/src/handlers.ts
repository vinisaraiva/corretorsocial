import type { WorkerJob } from "./queue.js";
import { handleMediaAnalysis } from "./media-analysis.js";
import { handleSocialPublish } from "./social-publish.js";

export async function handleJob(job: WorkerJob) {
  switch (job.type) {
    case "media_analysis":
      return handleMediaAnalysis(job);
    case "social_publish":
      return handleSocialPublish(job);
    default:
      throw new Error(`Unsupported job type: ${job.type}`);
  }
}
