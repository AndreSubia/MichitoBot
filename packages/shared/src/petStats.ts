export type PetStateName = "ALIVE" | "SLEEPING" | "SICK" | "DEAD";

export type CauseOfDeath = "HUNGER" | "EXHAUSTION";

export interface PetStats {
  state: PetStateName;
  hunger: number;
  energy: number;
  health: number;
  mood: number;
}

export interface ApplyDecayInput extends PetStats {
  deathCount?: number;
}

export interface ApplyDecayResult extends PetStats {
  deathCount: number;
  diedAt: Date | null;
  causeOfDeath: CauseOfDeath | null;
  transitionedToDead: boolean;
}

export const RATES = {
  hungerPerMin: 0.20,
  energyDecayPerMin: 0.15,
  energyRegenPerMin: 0.50,
  healthDecayHungry: 0.10,
  healthDecayDrained: 0.08,
  healthRegenSafe: 0.02,
} as const;

export const STAT_MIN = 0;
export const STAT_MAX = 100;

export function clamp(value: number, lo: number, hi: number): number {
  if (Number.isNaN(value)) return lo;
  return Math.max(lo, Math.min(hi, value));
}

export function computeMood(p: Pick<PetStats, "hunger" | "energy" | "health">): number {
  return Math.round(0.4 * (100 - p.hunger) + 0.3 * p.energy + 0.3 * p.health);
}

export function applyDecay(
  pet: ApplyDecayInput,
  deltaMin: number,
  now: Date = new Date(),
): ApplyDecayResult {
  const baseDeathCount = pet.deathCount ?? 0;

  if (pet.state === "DEAD") {
    return {
      state: "DEAD",
      hunger: pet.hunger,
      energy: pet.energy,
      health: pet.health,
      mood: pet.mood,
      deathCount: baseDeathCount,
      diedAt: null,
      causeOfDeath: null,
      transitionedToDead: false,
    };
  }

  const dt = Math.max(0, deltaMin);

  const hunger = clamp(pet.hunger + RATES.hungerPerMin * dt, STAT_MIN, STAT_MAX);
  const energy = clamp(
    pet.state === "SLEEPING"
      ? pet.energy + RATES.energyRegenPerMin * dt
      : pet.energy - RATES.energyDecayPerMin * dt,
    STAT_MIN,
    STAT_MAX,
  );

  let healthDelta = 0;
  if (hunger >= 90) healthDelta -= RATES.healthDecayHungry * dt;
  if (energy <= 5) healthDelta -= RATES.healthDecayDrained * dt;
  if (hunger < 70 && energy > 30 && healthDelta === 0) {
    healthDelta += RATES.healthRegenSafe * dt;
  }
  const health = clamp(pet.health + healthDelta, STAT_MIN, STAT_MAX);

  const mood = clamp(computeMood({ hunger, energy, health }), STAT_MIN, STAT_MAX);

  if (health <= 0) {
    return {
      state: "DEAD",
      hunger,
      energy,
      health,
      mood,
      deathCount: baseDeathCount + 1,
      diedAt: now,
      causeOfDeath: hunger >= 90 ? "HUNGER" : "EXHAUSTION",
      transitionedToDead: true,
    };
  }

  return {
    state: pet.state,
    hunger,
    energy,
    health,
    mood,
    deathCount: baseDeathCount,
    diedAt: null,
    causeOfDeath: null,
    transitionedToDead: false,
  };
}

export interface DeltaIntent {
  hunger?: number;
  energy?: number;
  health?: number;
  mood?: number;
}

export function applyIntent(pet: PetStats, delta: DeltaIntent): PetStats {
  const hunger = clamp(pet.hunger + (delta.hunger ?? 0), STAT_MIN, STAT_MAX);
  const energy = clamp(pet.energy + (delta.energy ?? 0), STAT_MIN, STAT_MAX);
  const health = clamp(pet.health + (delta.health ?? 0), STAT_MIN, STAT_MAX);
  const moodCandidate =
    delta.mood !== undefined
      ? pet.mood + delta.mood
      : computeMood({ hunger, energy, health });
  const mood = clamp(moodCandidate, STAT_MIN, STAT_MAX);
  return { state: pet.state, hunger, energy, health, mood };
}
