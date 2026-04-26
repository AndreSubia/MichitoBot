import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { Worker } from "bullmq";
import { Redis } from "ioredis";

const here = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(here, "../../../.env") });

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null
});

new Worker(
  "embeddings",
  async (job) => {
    return {
      jobId: job.id ?? null,
      status: "noop"
    };
  },
  { connection }
);
