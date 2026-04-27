import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(here, "../../../.env") });

export const config = {
  token: process.env.DISCORD_BOT_TOKEN!,
  clientId: process.env.DISCORD_CLIENT_ID,
  devGuildId: process.env.DISCORD_DEV_GUILD_ID,
  syncScope: (process.env.DISCORD_COMMANDS_SCOPE || (process.env.NODE_ENV === "production" ? "global" : "guild")).toLowerCase() as "global" | "guild" | "both",
  clearCommands: process.env.DISCORD_CLEAR_COMMANDS === "1",
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
  ollamaModel: process.env.OLLAMA_MODEL ?? "tinyllama",
  triggerWords: parseTriggerWords(process.env.BOT_TRIGGER_WORDS),
  logMessages: process.env.BOT_LOG_MESSAGES === "1",
  logMessageContent: process.env.BOT_LOG_MESSAGES_CONTENT === "1",
  logMessageVerbose: process.env.BOT_LOG_MESSAGES_VERBOSE === "1",
  paths: {
    dataDir: resolve(here, "../../../data"),
    rulesPath: resolve(here, "../../../data/style_rules.jsonl"),
    examplesPath: resolve(here, "../../../data/train_examples.jsonl"),
    finetunePath: resolve(here, "../../../data/finetune_chat.jsonl")
  }
};

function parseTriggerWords(raw: string | undefined): string[] {
  const base = raw ?? "michi,michito,gato";
  const items = base
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);
  return Array.from(new Set(items)).slice(0, 50);
}

if (!config.token) {
  throw new Error("DISCORD_BOT_TOKEN is required");
}
