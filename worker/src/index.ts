import { config } from "./config.js";
import {
  claimJob,
  completeJob,
  failJob,
  requeueStaleJobs,
} from "./queue.js";
import { handleJob } from "./handlers.js";

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

let lastStaleSweep = 0;

async function loop() {
  console.log(`[${config.workerId}] worker started`);

  while (true) {
    try {
      const now = Date.now();

      if (now - lastStaleSweep >= 60_000) {
        const recovered = await requeueStaleJobs();
        if (recovered > 0) {
          console.log(`[${config.workerId}] recovered ${recovered} stale job(s)`);
        }
        lastStaleSweep = now;
      }

      const job = await claimJob();

      if (!job) {
        await sleep(config.pollIntervalMs);
        continue;
      }

      console.log(
        `[${config.workerId}] processing ${job.type} ${job.id} attempt ${job.attempts}/${job.max_attempts}`,
      );

      try {
        const result = await handleJob(job);
        await completeJob(job, result ?? {});
        console.log(`[${config.workerId}] completed ${job.id}`);
      } catch (error) {
        await failJob(job, error);
        console.error(
          `[${config.workerId}] failed ${job.id}`,
          error instanceof Error ? error.message : error,
        );
      }
    } catch (error) {
      console.error(
        `[${config.workerId}] queue loop error`,
        error instanceof Error ? error.message : error,
      );
      await sleep(Math.max(config.pollIntervalMs, 5000));
    }
  }
}

void loop();
