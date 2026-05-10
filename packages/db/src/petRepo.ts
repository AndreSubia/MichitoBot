import { applyDecay, applyIntent, type DeltaIntent } from "@michito/shared";
import { prisma } from "./index.js";

export const TICK_INTERVAL_MIN = Number(process.env.TICK_INTERVAL_MIN ?? 10);

export async function getPetByGuild(guildId: string) {
  return prisma.pet.findUnique({ where: { guildId } });
}

export async function ensurePet(guildId: string) {
  return prisma.pet.upsert({
    where: { guildId },
    create: { guildId },
    update: {},
  });
}

export interface ApplyDeltaResult {
  pet: Awaited<ReturnType<typeof prisma.pet.update>>;
  applied: boolean;
}

export async function applyDelta(
  guildId: string,
  userId: string,
  kind: string,
  delta: DeltaIntent,
): Promise<ApplyDeltaResult> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.pet.upsert({
      where: { guildId },
      create: { guildId },
      update: {},
    });

    if (existing.state === "DEAD") {
      return { pet: existing, applied: false };
    }

    const next = applyIntent(existing, delta);
    const pet = await tx.pet.update({
      where: { id: existing.id },
      data: {
        hunger: next.hunger,
        energy: next.energy,
        health: next.health,
        mood: next.mood,
      },
    });

    await tx.activityLog.create({
      data: {
        guildId,
        petId: pet.id,
        userId,
        kind,
        delta: delta as object,
      },
    });

    return { pet, applied: true };
  });
}

export interface ReviveOptions {
  hunger?: number;
  energy?: number;
  health?: number;
  mood?: number;
}

export async function markAlive(
  guildId: string,
  actorUserId: string,
  options: ReviveOptions = {},
) {
  const now = new Date();
  return prisma.$transaction(async (tx) => {
    const existing = await tx.pet.findUnique({ where: { guildId } });
    if (!existing) {
      throw new Error(`No pet exists in guild ${guildId}`);
    }
    if (existing.state !== "DEAD") {
      return existing;
    }

    const revived = await tx.pet.update({
      where: { id: existing.id },
      data: {
        state: "ALIVE",
        hunger: options.hunger ?? 50,
        energy: options.energy ?? 50,
        health: options.health ?? 30,
        mood: options.mood ?? 50,
        diedAt: null,
        causeOfDeath: null,
        lastTickAt: now,
        nextTickAt: new Date(now.getTime() + TICK_INTERVAL_MIN * 60_000),
      },
    });

    await tx.activityLog.create({
      data: {
        guildId,
        petId: existing.id,
        userId: actorUserId,
        kind: "REVIVE",
        delta: { health: revived.health - existing.health, energy: revived.energy - existing.energy },
      },
    });

    await tx.auditLog.create({
      data: {
        guildId,
        actorUserId,
        action: "PET_REVIVE",
        metadata: { previousDeathCount: existing.deathCount, previousCauseOfDeath: existing.causeOfDeath },
      },
    });

    return revived;
  });
}

export async function claimDuePets(now: Date = new Date(), limit = 100) {
  return prisma.pet.findMany({
    where: {
      nextTickAt: { lte: now },
      state: { not: "DEAD" },
    },
    orderBy: { nextTickAt: "asc" },
    take: limit,
  });
}

export interface TickResult {
  petId: string;
  guildId: string;
  applied: boolean;
  transitionedToDead: boolean;
  causeOfDeath: "HUNGER" | "EXHAUSTION" | null;
}

export async function tickPet(petId: string, now: Date = new Date()): Promise<TickResult> {
  return prisma.$transaction(async (tx) => {
    const pet = await tx.pet.findUnique({ where: { id: petId } });
    if (!pet || pet.state === "DEAD") {
      return {
        petId,
        guildId: pet?.guildId ?? "",
        applied: false,
        transitionedToDead: false,
        causeOfDeath: null,
      };
    }

    const deltaMin = (now.getTime() - pet.lastTickAt.getTime()) / 60_000;
    if (deltaMin < TICK_INTERVAL_MIN - 0.5) {
      return {
        petId,
        guildId: pet.guildId,
        applied: false,
        transitionedToDead: false,
        causeOfDeath: null,
      };
    }

    const result = applyDecay(pet, deltaMin, now);

    const update = await tx.pet.updateMany({
      where: { id: pet.id, lastTickAt: pet.lastTickAt },
      data: {
        state: result.state,
        hunger: Math.round(result.hunger),
        energy: Math.round(result.energy),
        health: Math.round(result.health),
        mood: Math.round(result.mood),
        deathCount: result.deathCount,
        diedAt: result.diedAt,
        causeOfDeath: result.causeOfDeath,
        lastTickAt: now,
        nextTickAt: new Date(now.getTime() + TICK_INTERVAL_MIN * 60_000),
      },
    });

    if (update.count === 0) {
      return {
        petId,
        guildId: pet.guildId,
        applied: false,
        transitionedToDead: false,
        causeOfDeath: null,
      };
    }

    if (result.transitionedToDead) {
      await tx.activityLog.create({
        data: {
          guildId: pet.guildId,
          petId: pet.id,
          userId: "system",
          kind: "DEATH",
          delta: { causeOfDeath: result.causeOfDeath },
        },
      });
      await tx.auditLog.create({
        data: {
          guildId: pet.guildId,
          actorUserId: "system",
          action: "PET_DEATH",
          metadata: { causeOfDeath: result.causeOfDeath, deltaMin },
        },
      });
    } else {
      await tx.activityLog.create({
        data: {
          guildId: pet.guildId,
          petId: pet.id,
          userId: "system",
          kind: "TICK",
          delta: {
            hunger: Math.round(result.hunger - pet.hunger),
            energy: Math.round(result.energy - pet.energy),
            health: Math.round(result.health - pet.health),
          },
        },
      });
    }

    return {
      petId,
      guildId: pet.guildId,
      applied: true,
      transitionedToDead: result.transitionedToDead,
      causeOfDeath: result.causeOfDeath,
    };
  });
}
