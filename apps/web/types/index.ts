export type Message = {
  role: "user" | "assistant";
  content: string;
};

export type Rule = {
  id: string;
  createdAt: string;
  text: string;
  title?: string;
  ruleType?: string;
  isActive?: boolean;
};

export type PetState = "ALIVE" | "SLEEPING" | "SICK" | "DEAD";

export type Pet = {
  id: string;
  name: string;
  state: PetState;
  hunger: number;
  energy: number;
  health: number;
  mood: number;
  level: number;
  xp: number;
  bornAt: string;
  diedAt: string | null;
  causeOfDeath: string | null;
  deathCount: number;
  lastTickAt: string;
  nextTickAt: string;
};
