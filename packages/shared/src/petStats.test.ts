import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applyDecay,
  applyIntent,
  clamp,
  computeMood,
  RATES,
  STAT_MAX,
  STAT_MIN,
  type ApplyDecayInput,
  type PetStats,
} from "./petStats.js";

const fresh = (over: Partial<PetStats & { deathCount: number }> = {}): ApplyDecayInput => ({
  state: "ALIVE",
  hunger: 50,
  energy: 80,
  health: 100,
  mood: 70,
  deathCount: 0,
  ...over,
});

describe("clamp", () => {
  it("returns lo for values below lo", () => {
    assert.equal(clamp(-5, 0, 100), 0);
  });
  it("returns hi for values above hi", () => {
    assert.equal(clamp(150, 0, 100), 100);
  });
  it("returns the value when within range", () => {
    assert.equal(clamp(42, 0, 100), 42);
  });
  it("clamps NaN to lo defensively", () => {
    assert.equal(clamp(Number.NaN, 0, 100), 0);
  });
});

describe("computeMood", () => {
  it("is high when full, rested, and healthy", () => {
    assert.equal(computeMood({ hunger: 0, energy: 100, health: 100 }), 100);
  });
  it("is low when starving, exhausted, and hurt", () => {
    assert.equal(computeMood({ hunger: 100, energy: 0, health: 0 }), 0);
  });
});

describe("applyDecay — basic invariants", () => {
  it("does not change stats over zero minutes", () => {
    const pet = fresh();
    const next = applyDecay(pet, 0);
    assert.equal(next.hunger, pet.hunger);
    assert.equal(next.energy, pet.energy);
    assert.equal(next.health, pet.health);
    assert.equal(next.state, "ALIVE");
    assert.equal(next.transitionedToDead, false);
  });

  it("treats negative deltaMin as zero", () => {
    const pet = fresh();
    const next = applyDecay(pet, -10);
    assert.equal(next.hunger, pet.hunger);
    assert.equal(next.energy, pet.energy);
  });

  it("never returns stats below 0 or above 100", () => {
    for (const minutes of [1, 60, 60 * 24, 60 * 24 * 7]) {
      const next = applyDecay(fresh({ hunger: 0, energy: 0, health: 1 }), minutes);
      assert.ok(next.hunger >= STAT_MIN && next.hunger <= STAT_MAX);
      assert.ok(next.energy >= STAT_MIN && next.energy <= STAT_MAX);
      assert.ok(next.health >= STAT_MIN && next.health <= STAT_MAX);
      assert.ok(next.mood >= STAT_MIN && next.mood <= STAT_MAX);
    }
  });
});

describe("applyDecay — hunger", () => {
  it("rises proportionally with elapsed minutes", () => {
    const pet = fresh({ hunger: 0 });
    const oneMin = applyDecay(pet, 1);
    const sixtyMin = applyDecay(pet, 60);
    assert.equal(oneMin.hunger, RATES.hungerPerMin * 1);
    assert.equal(sixtyMin.hunger, RATES.hungerPerMin * 60);
  });

  it("clamps at 100", () => {
    const next = applyDecay(fresh({ hunger: 99 }), 600);
    assert.equal(next.hunger, 100);
  });
});

describe("applyDecay — energy", () => {
  it("decays while ALIVE / awake", () => {
    const next = applyDecay(fresh({ energy: 100 }), 60);
    assert.equal(next.energy, 100 - RATES.energyDecayPerMin * 60);
  });

  it("regenerates while SLEEPING", () => {
    const next = applyDecay(fresh({ state: "SLEEPING", energy: 0 }), 60);
    assert.equal(next.energy, RATES.energyRegenPerMin * 60);
  });
});

describe("applyDecay — health & death", () => {
  it("does not decay health when stats are safe", () => {
    const next = applyDecay(fresh({ hunger: 50, energy: 60, health: 50 }), 30);
    assert.ok(next.health > 50, "health should regen slightly when safe");
    assert.equal(next.state, "ALIVE");
  });

  it("decays health when starving (hunger >= 90)", () => {
    const next = applyDecay(fresh({ hunger: 95, energy: 60, health: 100 }), 60);
    assert.equal(next.health, 100 - RATES.healthDecayHungry * 60);
  });

  it("decays health when drained (energy <= 5)", () => {
    const next = applyDecay(fresh({ hunger: 50, energy: 3, health: 100 }), 60);
    assert.equal(next.health, 100 - RATES.healthDecayDrained * 60);
  });

  it("transitions to DEAD when health hits 0", () => {
    const before = fresh({ hunger: 95, energy: 50, health: 1, deathCount: 2 });
    const next = applyDecay(before, 60);
    assert.equal(next.state, "DEAD");
    assert.equal(next.health, 0);
    assert.equal(next.transitionedToDead, true);
    assert.equal(next.causeOfDeath, "HUNGER");
    assert.equal(next.deathCount, 3);
    assert.ok(next.diedAt instanceof Date);
  });

  it("attributes EXHAUSTION when only energy is the killer", () => {
    const before = fresh({ hunger: 60, energy: 1, health: 1 });
    const next = applyDecay(before, 60);
    assert.equal(next.state, "DEAD");
    assert.equal(next.causeOfDeath, "EXHAUSTION");
  });

  it("does not double-decay or re-kill once DEAD", () => {
    const dead = fresh({ state: "DEAD", health: 0, hunger: 100, energy: 0, deathCount: 1 });
    const next = applyDecay(dead, 1000);
    assert.equal(next.state, "DEAD");
    assert.equal(next.transitionedToDead, false);
    assert.equal(next.deathCount, 1, "deathCount should not increase on subsequent ticks");
    assert.equal(next.diedAt, null, "diedAt should not be re-set");
    assert.equal(next.hunger, 100, "stats stay frozen");
  });
});

describe("applyDecay — drift catch-up", () => {
  it("two 30-minute ticks ≈ one 60-minute tick (catch-up after worker outage)", () => {
    const start = fresh({ hunger: 0, energy: 100, health: 100 });
    const stepwise = applyDecay(applyDecay(start, 30), 30);
    const oneShot = applyDecay(start, 60);
    assert.equal(stepwise.hunger, oneShot.hunger);
    assert.equal(stepwise.energy, oneShot.energy);
    assert.equal(stepwise.health, oneShot.health);
  });
});

describe("applyIntent — interaction-driven nudges", () => {
  it("recomputes mood from stats when no mood delta is given", () => {
    const after = applyIntent({ state: "ALIVE", hunger: 50, energy: 80, health: 100, mood: 70 }, { hunger: -25 });
    assert.equal(after.hunger, 25);
    assert.equal(after.mood, computeMood({ hunger: 25, energy: 80, health: 100 }));
  });

  it("applies an explicit mood delta when provided", () => {
    const after = applyIntent({ state: "ALIVE", hunger: 50, energy: 80, health: 100, mood: 50 }, { mood: 12 });
    assert.equal(after.mood, 62);
  });

  it("clamps every stat to [0, 100]", () => {
    const after = applyIntent({ state: "ALIVE", hunger: 90, energy: 5, health: 50, mood: 20 }, { hunger: 50, energy: -50, health: 200 });
    assert.equal(after.hunger, 100);
    assert.equal(after.energy, 0);
    assert.equal(after.health, 100);
  });
});
