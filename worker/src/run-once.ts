import { config } from "./config.js";
import { claimAndProcessOne, recoverStaleJobs } from "./runner.js";

function positiveInteger(name: string, fallback: number) {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;

  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

const maxJobs = positiveInteger("CRON_MAX_JOBS", 5);

async function runOnce() {
  console.log(
    `[${config.workerId}] cron worker started; max jobs: ${maxJobs}`,
  );

  await recoverStaleJobs();

  let processed = 0;

  while (processed < maxJobs) {
    const result = await claimAndProcessOne();

    if (!result) break;

    processed += 1;
  }

  console.log(
    `[${config.workerId}] cron worker finished; processed: ${processed}`,
  );
}

runOnce().catch((error) => {
  console.error(
    `[${config.workerId}] cron worker fatal error`,
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
