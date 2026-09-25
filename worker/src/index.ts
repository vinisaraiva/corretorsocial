import { config } from "./config.js";
import { claimAndProcessOne, recoverStaleJobs } from "./runner.js";

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

let lastStaleSweep = 0;

async function loop() {
  console.log(`[${config.workerId}] worker started`);

  while (true) {
    try {
      const now = Date.now();

      if (now - lastStaleSweep >= 60_000) {
        await recoverStaleJobs();
        lastStaleSweep = now;
      }

      const result = await claimAndProcessOne();

      if (!result) {
        await sleep(config.pollIntervalMs);
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
