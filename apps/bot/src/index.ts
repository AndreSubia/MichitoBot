import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder
} from "discord.js";
import { OllamaLlmProvider } from "@michito/ai";
import { registerInteractionRouter } from "@michito/discord";

const here = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(here, "../../../.env") });

process.on("unhandledRejection", (reason) => {
  console.error("unhandledRejection", reason);
});

process.on("uncaughtException", (err) => {
  console.error("uncaughtException", err);
});

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  throw new Error("DISCORD_BOT_TOKEN is required");
}

const clientId = process.env.DISCORD_CLIENT_ID;
const devGuildId = process.env.DISCORD_DEV_GUILD_ID;
const defaultScope =
  process.env.NODE_ENV === "production" ? "global" : "guild";
const syncScope = (process.env.DISCORD_COMMANDS_SCOPE ?? defaultScope).toLowerCase();
const clearCommands = process.env.DISCORD_CLEAR_COMMANDS === "1";

const ollamaBaseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const ollamaModel = process.env.OLLAMA_MODEL ?? "tinyllama";
const llm = new OllamaLlmProvider({ baseUrl: ollamaBaseUrl, model: ollamaModel });
console.log(`Ollama configured: baseUrl=${ollamaBaseUrl} model=${ollamaModel}`);

const slashCommands = [
  new SlashCommandBuilder().setName("ping").setDescription("Health check"),
  new SlashCommandBuilder()
    .setName("chat")
    .setDescription("Chat with Michito")
    .addSubcommand((s) =>
      s
        .setName("ask")
        .setDescription("Ask a question")
        .addStringOption((o) =>
          o.setName("prompt").setDescription("What do you want to ask?").setRequired(true)
        )
    )
].map((c) => c.toJSON());

if (clientId) {
  const rest = new REST({ version: "10" }).setToken(token);

  if (clearCommands) {
    if (devGuildId) {
      await rest.put(Routes.applicationGuildCommands(clientId, devGuildId), { body: [] });
    }
    await rest.put(Routes.applicationCommands(clientId), { body: [] });
  }

  if (syncScope === "global" || syncScope === "both") {
    await rest.put(Routes.applicationCommands(clientId), { body: slashCommands });
  }
  if (syncScope === "guild" || syncScope === "both") {
    if (devGuildId) {
      await rest.put(Routes.applicationGuildCommands(clientId, devGuildId), { body: slashCommands });
    } else if (syncScope === "guild") {
      await rest.put(Routes.applicationCommands(clientId), { body: slashCommands });
    }
  }
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.on("error", (err) => console.error("discord client error", err));
client.on("warn", (message) => console.warn("discord client warn", message));
client.once("ready", () => {
  console.log(`Discord ready: user=${client.user?.tag ?? "unknown"} guilds=${client.guilds.cache.size}`);
});

registerInteractionRouter({
  client,
  commands: [
    {
      name: "ping",
      description: "Health check",
      async handle(interaction) {
        await interaction.reply({ content: "pong" });
      }
    },
    {
      name: "chat",
      description: "Chat with Michito",
      async handle(interaction) {
        console.log(
          `interaction: command=${interaction.commandName} guild=${interaction.guildId ?? "dm"} user=${interaction.user.id}`
        );

        const sub = interaction.options.getSubcommand(false);
        if (sub !== "ask") {
          await interaction.reply({ content: "Unknown subcommand", ephemeral: true });
          return;
        }

        const prompt = interaction.options.getString("prompt", true);
        console.log(`chat.ask: prompt_len=${prompt.length}`);
        const deferred = await safeDefer(interaction);
        if (!deferred) return;

        try {
          const result = await llm.chat({
            messages: [
              {
                role: "system",
                content:
                  "Eres Michito, un asistente felino en español. Responde en 1–2 frases, directo y útil. " +
                  "No menciones reglas, formato, políticas ni entrenamiento. Si falta info, haz 1 sola pregunta corta."
              },
              { role: "user", content: prompt }
            ]
          });

          const content = clampDiscordMessage(result.content);
          await interaction.editReply({ content });
          console.log(`chat.ask: ok response_len=${content.length}`);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          const content = clampDiscordMessage(`LLM error: ${message}`);
          await interaction.editReply({ content }).catch(() => undefined);
          console.error("LLM error", err);
        }
      }
    }
  ]
});

await client.login(token);

function clampDiscordMessage(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= 1900) return trimmed;
  return `${trimmed.slice(0, 1900)}\n…`;
}

async function safeDefer(
  interaction: { deferReply: (opts?: { ephemeral?: boolean }) => Promise<unknown> },
  opts?: { ephemeral?: boolean }
): Promise<boolean> {
  try {
    await interaction.deferReply(opts);
    return true;
  } catch {
    return false;
  }
}
