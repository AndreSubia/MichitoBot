import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { Worker } from "bullmq";
import { Redis } from "ioredis";
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
        jobId: `death:notify:${petId}:${Date.now()}`,
        removeOnComplete: 50,
        removeOnFail: 100,
      },
    );
  },
});

const deathWorker = startDeathWorker({ connection });

tickWorker.on("error", (err) => console.error("worker.tick error", err));
deathWorker.on("error", (err) => console.error("worker.death error", err));

new Worker(
  "embeddings",
  async (job) => ({ jobId: job.id ?? null, status: "noop" }),
  { connection },
);

console.log(`worker started · redis=${redisUrl}`);
