import {
  ChannelType,
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
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

const adminPerms = PermissionFlagsBits.ManageGuild;

const slashCommands = [
  new SlashCommandBuilder().setName("ping").setDescription("Health check"),
  new SlashCommandBuilder().setName("help").setDescription("Cómo usar Michi"),
  new SlashCommandBuilder().setName("about").setDescription("Información sobre esta instancia"),

  new SlashCommandBuilder()
    .setName("status")
    .setDescription("Ver el estado de Michi"),
  new SlashCommandBuilder().setName("feed").setDescription("Dale comida a Michi"),
  new SlashCommandBuilder().setName("play").setDescription("Juega con Michi"),
  new SlashCommandBuilder().setName("sleep").setDescription("Deja que Michi descanse"),
  new SlashCommandBuilder().setName("pet").setDescription("Hazle caricias a Michi"),

  new SlashCommandBuilder()
    .setName("heal")
    .setDescription("Dale medicina a Michi (admin)")
    .setDefaultMemberPermissions(adminPerms),
  new SlashCommandBuilder()
    .setName("revive")
    .setDescription("Revive a Michi cuando muere (admin)")
    .setDefaultMemberPermissions(adminPerms),

  new SlashCommandBuilder()
    .setName("chat")
    .setDescription("Chatea con Michi")
    .addSubcommand((s) =>
      s
        .setName("ask")
        .setDescription("Hazle una pregunta")
        .addStringOption((o) =>
          o.setName("prompt").setDescription("¿Qué le quieres decir?").setRequired(true)
        )
    ),

  new SlashCommandBuilder()
    .setName("rules")
    .setDescription("Gestiona la personalidad de Michi")
    .addSubcommand((s) => s.setName("list").setDescription("Ver reglas activas"))
    .addSubcommand((s) =>
      s
        .setName("add")
        .setDescription("Añadir una regla (admin)")
        .addStringOption((o) =>
          o.setName("text").setDescription("Texto de la regla").setRequired(true)
        )
    )
    .addSubcommand((s) =>
      s
        .setName("remove")
        .setDescription("Desactivar una regla (admin)")
        .addStringOption((o) =>
          o.setName("id").setDescription("Id de la regla a desactivar").setRequired(true)
        )
    ),

  new SlashCommandBuilder()
    .setName("config")
    .setDescription("Configura Michi en este servidor (admin)")
    .setDefaultMemberPermissions(adminPerms)
    .addSubcommandGroup((g) =>
      g
        .setName("channels")
        .setDescription("Canales donde Michi responde")
        .addSubcommand((s) =>
          s
            .setName("add")
            .setDescription("Permitir un canal")
            .addChannelOption((o) =>
              o
                .setName("channel")
                .setDescription("Canal de texto")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
            )
        )
        .addSubcommand((s) =>
          s
            .setName("remove")
            .setDescription("Quitar un canal de la lista")
            .addChannelOption((o) =>
              o
                .setName("channel")
                .setDescription("Canal de texto")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
            )
        )
        .addSubcommand((s) => s.setName("list").setDescription("Ver canales permitidos"))
    ),
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
