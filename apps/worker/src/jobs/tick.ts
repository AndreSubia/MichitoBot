import { Queue, Worker, type ConnectionOptions } from "bullmq";
import { petRepo } from "@michito/db";

export const TICK_QUEUE = "tick";

export interface TickApplyData {
  petId: string;
  enqueuedAt: string;
}

export const createTickQueue = (connection: ConnectionOptions) =>
  new Queue<TickApplyData | Record<string, never>>(TICK_QUEUE, { connection });

export interface StartTickWorkerOptions {
  connection: ConnectionOptions;
  tickQueue: Queue;
  /** Callback fired when a pet just transitioned to DEAD (used to enqueue death:notify). */
  onDeath: (petId: string, guildId: string, causeOfDeath: string | null) => Promise<void>;
  /** Maximum pets to process per scan. */
  scanBatchSize?: number;
}

export async function bootstrapTickRepeatJob(tickQueue: Queue) {
  const repeatPattern = process.env.TICK_SCAN_PATTERN ?? "*/1 * * * *";
  await tickQueue.add(
    "scan",
    {},
    {
      repeat: { pattern: repeatPattern },
      jobId: "tick_scan_repeat",
      removeOnComplete: 50,
      removeOnFail: 100,
    },
  );
  console.log(`worker.tick: scan repeat job registered (pattern=${repeatPattern})`);
}

export function startTickWorker(options: StartTickWorkerOptions) {
  const { connection, tickQueue, onDeath, scanBatchSize = 100 } = options;

  return new Worker(
    TICK_QUEUE,
    async (job) => {
      if (job.name === "scan") {
        const due = await petRepo.claimDuePets(new Date(), scanBatchSize);
        console.log(`tick.scan: due=${due.length}`);
        if (due.length === 0) return { picked: 0 };
        await Promise.all(
          due.map((pet) =>
            tickQueue.add(
              "apply",
              { petId: pet.id, enqueuedAt: new Date().toISOString() },
              {
                jobId: `tick_apply_${pet.id}_${pet.lastTickAt.getTime()}`,
                removeOnComplete: 100,
                removeOnFail: 200,
              },
            ),
          ),
        );
        return { picked: due.length };
      }

      if (job.name === "apply") {
        const data = job.data as TickApplyData;
        const result = await petRepo.tickPet(data.petId);
        console.log(
          `tick.apply: pet=${data.petId.slice(0, 8)} applied=${result.applied} dead=${result.transitionedToDead}`,
        );
        if (result.transitionedToDead) {
          await onDeath(data.petId, result.guildId, result.causeOfDeath);
        }
        return result;
      }

      return { skipped: job.name };
    },
    { connection, concurrency: 5 },
  );
}
