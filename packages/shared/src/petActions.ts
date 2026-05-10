import type { DeltaIntent } from "./petStats.js";

export type PetActionKind = "FEED" | "PLAY" | "SLEEP" | "PET" | "HEAL";

export interface PetActionDef {
  kind: PetActionKind;
  delta: DeltaIntent;
  /** Short verb shown in UI buttons. */
  label: string;
  /** Single emoji shown in UI buttons. */
  emoji: string;
  /** Spanish flavor text used by Discord embeds and web feedback toasts. */
  flavor: string;
}

export const PET_ACTIONS: Record<PetActionKind, PetActionDef> = {
  FEED: {
    kind: "FEED",
    delta: { hunger: -25, mood: 5 },
    label: "Alimentar",
    emoji: "🍤",
    flavor: "🍤 Michi devoró tus croquetas.",
  },
  PLAY: {
    kind: "PLAY",
    delta: { energy: -15, mood: 12, hunger: 3 },
    label: "Jugar",
    emoji: "🎾",
    flavor: "🎾 Michi te persiguió toda la sala.",
  },
  SLEEP: {
    kind: "SLEEP",
    delta: { energy: 20, mood: 5 },
    label: "Dormir",
    emoji: "😴",
    flavor: "😴 Michi se acurrucó un rato.",
  },
  PET: {
    kind: "PET",
    delta: { mood: 3 },
    label: "Caricia",
    emoji: "🐱",
    flavor: "🐱 Michi ronronea.",
  },
  HEAL: {
    kind: "HEAL",
    delta: { health: 20, mood: 4 },
    label: "Medicina",
    emoji: "💊",
    flavor: "💊 Le diste medicina.",
  },
};

export const isPetActionKind = (value: unknown): value is PetActionKind =>
  typeof value === "string" && value in PET_ACTIONS;
