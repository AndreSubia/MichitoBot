import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { Worker } from "bullmq";
import { Redis } from "ioredis";
import { prisma } from "@michito/db";
import {
  bootstrapTickRepeatJob,
  createTickQueue,
  startTickWorker,
} from "./jobs/tick.js";
import { createDeathQueue, startDeathWorker } from "./jobs/death.js";

const here = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(here, "../../../.env") });

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

connection.on("error", (err) => {
  console.error("worker.redis error", err);
});

const tickQueue = createTickQueue(connection);
const deathQueue = createDeathQueue(connection);

await bootstrapTickRepeatJob(tickQueue);

const tickWorker = startTickWorker({
  connection,
  tickQueue,
  async onDeath(petId, guildId, causeOfDeath) {
    await deathQueue.add(
      "notify",
      { petId, guildId, causeOfDeath },
      {
        jobId: `death_notify_${petId}_${Date.now()}`,
        removeOnComplete: 50,
        removeOnFail: 100,
      },
    );
  },
});

const deathWorker = startDeathWorker({ connection });

tickWorker.on("error", (err) => console.error("worker.tick error", err));
tickWorker.on("active", (job) => console.log(`worker.tick active: name=${job.name} id=${job.id}`));
tickWorker.on("completed", (job, result) =>
  console.log(`worker.tick completed: name=${job.name} id=${job.id} result=${JSON.stringify(result)}`),
);
tickWorker.on("failed", (job, err) =>
  console.error(`worker.tick failed: name=${job?.name} id=${job?.id} err=${err.message}\n${err.stack}`),
);

deathWorker.on("error", (err) => console.error("worker.death error", err));
deathWorker.on("failed", (job, err) =>
  console.error(`worker.death failed: id=${job?.id} err=${err.message}\n${err.stack}`),
);

new Worker(
  "embeddings",
  async (job) => ({ jobId: job.id ?? null, status: "noop" }),
  { connection },
);

try {
  const petCount = await prisma.pet.count();
  console.log(`worker: db sanity ok (${petCount} pets)`);
} catch (err) {
  console.error("worker: db sanity FAILED", err);
}

console.log(`worker started · redis=${redisUrl}`);
