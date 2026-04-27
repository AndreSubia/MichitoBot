import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder
} from "discord.js";
import { registerInteractionRouter } from "@michito/discord";
import { config } from "./config.js";
import { exportFineTuneDataset } from "./services/training.service.js";
import { commands } from "./commands/index.js";
import { registerMessageCreate } from "./events/messageCreate.js";
import { registerReady } from "./events/ready.js";

if (process.argv.includes("--export-finetune")) {
  await exportFineTuneDataset({
    systemPrompt: ""
  });
  process.exit(0);
}

process.on("unhandledRejection", (reason) => {
  console.error("unhandledRejection", reason);
});

process.on("uncaughtException", (err) => {
  console.error("uncaughtException", err);
});

const slashCommands = [
  new SlashCommandBuilder().setName("ping").setDescription("Health check"),
  new SlashCommandBuilder().setName("help").setDescription("How to use Michito"),
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
    ),
  new SlashCommandBuilder()
    .setName("train")
    .setDescription("Train Michito (local data only)")
    .addSubcommand((s) =>
      s
        .setName("rule")
        .setDescription("Save a style or preference rule")
        .addStringOption((o) =>
          o.setName("text").setDescription("Rule text").setRequired(true)
        )
        .addUserOption((o) =>
          o
            .setName("user")
            .setDescription("Apply this rule only when replying to this user")
            .setRequired(false)
        )
    )
    .addSubcommand((s) =>
      s
        .setName("add")
        .setDescription("Save a supervised example (prompt -> ideal)")
        .addStringOption((o) =>
          o.setName("prompt").setDescription("User prompt").setRequired(true)
        )
        .addStringOption((o) =>
          o.setName("ideal").setDescription("Ideal assistant response").setRequired(true)
        )
        .addStringOption((o) =>
          o.setName("tags").setDescription("Comma-separated tags").setRequired(false)
        )
    )
    .addSubcommand((s) => s.setName("profile").setDescription("Show current rules"))
    .addSubcommand((s) =>
      s
        .setName("forget")
        .setDescription("Remove rules that match a query")
        .addStringOption((o) =>
          o.setName("query").setDescription("Text to match (case-insensitive)").setRequired(true)
        )
    )
].map((c) => c.toJSON());

if (config.clientId) {
  const rest = new REST({ version: "10" }).setToken(config.token);
  try {
    console.log(
      `discord commands: scope=${config.syncScope} clear=${config.clearCommands ? "yes" : "no"} devGuildId=${
        config.devGuildId ?? "none"
      }`
    );

    if (config.clearCommands) {
      if (config.devGuildId) {
        await rest.put(Routes.applicationGuildCommands(config.clientId, config.devGuildId), { body: [] });
        console.log("discord commands: cleared guild commands");
      }
      await rest.put(Routes.applicationCommands(config.clientId), { body: [] });
      console.log("discord commands: cleared global commands");
    }

    if (config.syncScope === "global" || config.syncScope === "both") {
      await rest.put(Routes.applicationCommands(config.clientId), { body: slashCommands });
      console.log("discord commands: synced global");
    }
    if (config.syncScope === "guild" || config.syncScope === "both") {
      if (config.devGuildId) {
        await rest.put(Routes.applicationGuildCommands(config.clientId, config.devGuildId), {
          body: slashCommands
        });
        console.log("discord commands: synced guild");
      } else if (config.syncScope === "guild") {
        await rest.put(Routes.applicationCommands(config.clientId), { body: slashCommands });
        console.log("discord commands: dev guild missing; synced global instead");
      }
    }
  } catch (err) {
    console.error("discord commands: sync failed", err);
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.on("error", (err) => console.error("discord client error", err));
client.on("warn", (message) => console.warn("discord client warn", message));

registerReady(client);
registerMessageCreate(client);
registerInteractionRouter({
  client,
  commands
});

await client.login(config.token);
