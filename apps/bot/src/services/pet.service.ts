import { EmbedBuilder } from "discord.js";
import { petRepo } from "@michito/db";
import type { DeltaIntent } from "@michito/shared";

export interface PetActionDef {
  kind: string;
  delta: DeltaIntent;
  flavor: string;
}

export const PET_ACTIONS: Record<string, PetActionDef> = {
  FEED: {
    kind: "FEED",
    delta: { hunger: -25, mood: 5 },
    flavor: "🍤 Michi devoró tus croquetas.",
  },
  PLAY: {
    kind: "PLAY",
    delta: { energy: -15, mood: 12, hunger: 3 },
    flavor: "🎾 Michi te persiguió toda la sala.",
  },
  SLEEP: {
    kind: "SLEEP",
    delta: { energy: 20, mood: 5 },
    flavor: "😴 Michi se acurrucó un rato.",
  },
  PET: {
    kind: "PET",
    delta: { mood: 3 },
    flavor: "🐱 Michi ronronea.",
  },
  HEAL: {
    kind: "HEAL",
    delta: { health: 20, mood: 4 },
    flavor: "💊 Le diste medicina.",
  },
};

export async function performAction(
  guildId: string,
  userId: string,
  action: PetActionDef,
) {
  return petRepo.applyDelta(guildId, userId, action.kind, action.delta);
}

const BAR_LENGTH = 10;

const renderBar = (value: number): string => {
  const v = Math.max(0, Math.min(100, value));
  const filled = Math.round((v / 100) * BAR_LENGTH);
  return "▰".repeat(filled) + "▱".repeat(BAR_LENGTH - filled);
};

const stateBadge = (state: string): string => {
  switch (state) {
    case "DEAD":
      return "💀 muerto";
    case "SLEEPING":
      return "😴 durmiendo";
    case "SICK":
      return "🤒 enfermo";
    default:
      return "🟢 vivo";
  }
};

const STATE_COLORS: Record<string, number> = {
  ALIVE: 0xc97b1e,
  SLEEPING: 0x7cace8,
  SICK: 0xb86b1c,
  DEAD: 0x3a2a1e,
};

export interface PetSummary {
  name: string;
  state: string;
  hunger: number;
  energy: number;
  health: number;
  mood: number;
  level: number;
  xp: number;
  bornAt: Date;
  diedAt: Date | null;
  causeOfDeath: string | null;
  deathCount: number;
}

const formatRelative = (date: Date): string => {
  const ts = Math.floor(date.getTime() / 1000);
  return `<t:${ts}:R>`;
};

export function buildStatusEmbed(pet: PetSummary): EmbedBuilder {
  const color = STATE_COLORS[pet.state] ?? 0xc97b1e;
  const embed = new EmbedBuilder()
    .setTitle(`${pet.name} · ${stateBadge(pet.state)}`)
    .setColor(color)
    .addFields(
      { name: "Hambre", value: `${renderBar(100 - pet.hunger)} ${pet.hunger}/100`, inline: true },
      { name: "Energía", value: `${renderBar(pet.energy)} ${pet.energy}/100`, inline: true },
      { name: "Salud", value: `${renderBar(pet.health)} ${pet.health}/100`, inline: true },
      { name: "Ánimo", value: `${renderBar(pet.mood)} ${pet.mood}/100`, inline: true },
      { name: "Nivel", value: `${pet.level} · ${pet.xp} XP`, inline: true },
      { name: "Nacido", value: formatRelative(pet.bornAt), inline: true },
    );
  if (pet.state === "DEAD" && pet.diedAt) {
    embed.addFields({
      name: "Última muerte",
      value: `${formatRelative(pet.diedAt)}${pet.causeOfDeath ? ` (${pet.causeOfDeath.toLowerCase()})` : ""}`,
      inline: true,
    });
    embed.setDescription(`Michi descansa en paz. Murió ${pet.deathCount} ${pet.deathCount === 1 ? "vez" : "veces"}. Un admin puede revivirlo con \`/revive\`.`);
  }
  return embed;
}

export function summarizeAction(action: PetActionDef, pet: PetSummary): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`${action.flavor}`)
    .setColor(STATE_COLORS[pet.state] ?? 0xc97b1e);

  const lines: string[] = [];
  if (action.delta.hunger !== undefined) lines.push(`Hambre ${signed(action.delta.hunger)} → ${pet.hunger}/100`);
  if (action.delta.energy !== undefined) lines.push(`Energía ${signed(action.delta.energy)} → ${pet.energy}/100`);
  if (action.delta.health !== undefined) lines.push(`Salud ${signed(action.delta.health)} → ${pet.health}/100`);
  if (action.delta.mood !== undefined) lines.push(`Ánimo ${signed(action.delta.mood)} → ${pet.mood}/100`);
  embed.setDescription(lines.join("\n"));
  return embed;
}

const signed = (n: number) => (n >= 0 ? `+${n}` : `${n}`);
