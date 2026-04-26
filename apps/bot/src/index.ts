import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { existsSync } from "node:fs";
import { mkdir, readFile, appendFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
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

const dataDir = resolve(here, "../../../data");
const rulesPath = resolve(dataDir, "style_rules.jsonl");
const examplesPath = resolve(dataDir, "train_examples.jsonl");

if (process.argv.includes("--export-finetune")) {
  await exportFineTuneDataset({
    examplesPath,
    rulesPath,
    outPath: resolve(dataDir, "finetune_chat.jsonl"),
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

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  throw new Error("DISCORD_BOT_TOKEN is required");
}

const clientId = process.env.DISCORD_CLIENT_ID;
const devGuildId = process.env.DISCORD_DEV_GUILD_ID;
const defaultScope =
  process.env.NODE_ENV === "production" ? "global" : "guild";
const syncScopeRaw = (process.env.DISCORD_COMMANDS_SCOPE ?? defaultScope).toLowerCase();
const syncScope =
  syncScopeRaw === "global" || syncScopeRaw === "guild" || syncScopeRaw === "both"
    ? syncScopeRaw
    : defaultScope;
const clearCommands = process.env.DISCORD_CLEAR_COMMANDS === "1";

const ollamaBaseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const ollamaModel = process.env.OLLAMA_MODEL ?? "tinyllama";
const llm = new OllamaLlmProvider({ baseUrl: ollamaBaseUrl, model: ollamaModel });
console.log(`Ollama configured: baseUrl=${ollamaBaseUrl} model=${ollamaModel}`);

const triggerWords = parseTriggerWords(process.env.BOT_TRIGGER_WORDS);
console.log(`Message triggers: ${triggerWords.length ? triggerWords.join(", ") : "(none)"}`);

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
    )
    ,
  new SlashCommandBuilder()
    .setName("train")
    .setDescription("Train Michito (local data only)")
    .addSubcommand((s) =>
      s
        .setName("rule")
        .setDescription("Save a style or preference rule")
        .addUserOption((o) =>
          o
            .setName("user")
            .setDescription("Apply this rule only when replying to this user")
            .setRequired(false)
        )
        .addStringOption((o) =>
          o.setName("text").setDescription("Rule text").setRequired(true)
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

if (clientId) {
  const rest = new REST({ version: "10" }).setToken(token);
  try {
    console.log(
      `discord commands: scope=${syncScope} clear=${clearCommands ? "yes" : "no"} devGuildId=${
        devGuildId ?? "none"
      }`
    );

    if (clearCommands) {
      if (devGuildId) {
        await rest.put(Routes.applicationGuildCommands(clientId, devGuildId), { body: [] });
        console.log("discord commands: cleared guild commands");
      }
      await rest.put(Routes.applicationCommands(clientId), { body: [] });
      console.log("discord commands: cleared global commands");
    }

    if (syncScope === "global" || syncScope === "both") {
      await rest.put(Routes.applicationCommands(clientId), { body: slashCommands });
      console.log("discord commands: synced global");
    }
    if (syncScope === "guild" || syncScope === "both") {
      if (devGuildId) {
        await rest.put(Routes.applicationGuildCommands(clientId, devGuildId), {
          body: slashCommands
        });
        console.log("discord commands: synced guild");
      } else if (syncScope === "guild") {
        await rest.put(Routes.applicationCommands(clientId), { body: slashCommands });
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
client.once("ready", () => {
  console.log(`Discord ready: user=${client.user?.tag ?? "unknown"} guilds=${client.guilds.cache.size}`);
});

client.on("messageCreate", async (message) => {
  try {
    if (message.author.bot) return;
    if (!message.inGuild()) return;
    const content = (message.content ?? "").trim();
    if (!content) return;
    if (content.startsWith("/")) return;
    if (!containsTrigger(content, triggerWords)) return;

    console.log(
      `chat.listen: triggered guild=${message.guildId} channel=${message.channelId} user=${message.author.id} prompt_len=${content.length}`
    );

    await message.channel.sendTyping().catch(() => undefined);

    const rules = await loadLastRulesForContext({
      path: rulesPath,
      limit: 10,
      guildId: message.guildId,
      targetUserId: message.author.id
    });
    const profileText = buildProfileText(rules);
    const result = await llm.chat({
      messages: [
        ...(profileText
          ? [
              {
                role: "system" as const,
                content: profileText
              }
            ]
          : []),
        { role: "user", content }
      ]
    });

    const reply = clampDiscordMessage(neutralizeMentions(result.content));
    await message.reply({
      content: reply,
      allowedMentions: { parse: [], repliedUser: false }
    });
    console.log(`chat.listen: ok response_len=${reply.length}`);
  } catch (err) {
    console.error("chat.listen error", err);
  }
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
      name: "help",
      description: "How to use Michito",
      async handle(interaction) {
        const triggerList = triggerWords.length ? triggerWords.join(", ") : "(sin triggers)";
        const guide = [
          "Guía completa de Michito",
          "",
          "1) Cómo interactuar",
          "- Mensajes normales: escribe algo que contenga un trigger y te responde.",
          `  Triggers actuales: ${triggerList}`,
          '- Configura triggers con BOT_TRIGGER_WORDS="michi,michito,gato"',
          "- Slash commands: úsalos para acciones específicas (guardar reglas, ver perfil, etc.).",
          "",
          "2) Comandos disponibles",
          "- /ping",
          '- /chat ask prompt:"..."',
          "- /train rule text:\"...\" (regla del server)",
          "- /train rule user:@alguien text:\"...\" (regla para ese usuario, dentro del server)",
          "- /train profile (muestra reglas del server actual)",
          "- /train forget query:\"...\" (borra reglas del server actual que contengan ese texto)",
          "- /train add prompt:\"...\" ideal:\"...\" tags:\"...\" (guarda ejemplos para futuro fine-tune/LoRA)",
          "",
          "3) Cómo usar /train (memoria por server)",
          "- Las reglas y ejemplos se guardan en disco (data/*.jsonl).",
          "- Cada server tiene su propio estilo: las reglas se filtran por guildId.",
          "- Las reglas por usuario aplican solo cuando Michito le responde a esa persona.",
          "",
          "4) Ejemplos recomendados",
          '- /train rule text:"En este server: responde en 1–2 frases, directo y sin relleno."',
          '- /train rule text:"En este server: usa humor felino sutil, sin groserías."',
          '- /train rule user:@alguien text:"Con esta persona sé más sarcástico (suave) y súper breve."',
          '- /train add prompt:"Dame 3 ideas de desayuno rápido" ideal:"Tres ideas: yogur con fruta, tostada con huevo, avena instantánea." tags:"ejemplos,estilo"',
          "- /train profile",
          '- /train forget query:"humor"',
          "",
          "5) Seguridad",
          "- No guardes tokens/contraseñas/claves. /train los rechaza si parece sensible.",
          "- Michito neutraliza @everyone/@here en respuestas."
        ].join("\n");
        const pages = splitDiscordMessages(guide, 1900);
        await replyEphemeralPages(interaction, pages);
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
          const rules = await loadLastRulesForContext({
            path: rulesPath,
            limit: 10,
            guildId: interaction.guildId ?? "dm",
            targetUserId: interaction.user.id
          });
          const profileText = buildProfileText(rules);
          const result = await llm.chat({
            messages: [
              ...(profileText
                ? [
                    {
                      role: "system" as const,
                      content: profileText
                    }
                  ]
                : []),
              { role: "user", content: prompt }
            ]
          });

          const content = clampDiscordMessage(neutralizeMentions(result.content));
          await interaction.editReply({ content });
          console.log(`chat.ask: ok response_len=${content.length}`);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          const content = clampDiscordMessage(`LLM error: ${message}`);
          await interaction.editReply({ content }).catch(() => undefined);
          console.error("LLM error", err);
        }
      }
    },
    {
      name: "train",
      description: "Train Michito (local data only)",
      async handle(interaction) {
        console.log(
          `interaction: command=${interaction.commandName} guild=${interaction.guildId ?? "dm"} user=${interaction.user.id}`
        );

        const sub = interaction.options.getSubcommand(true);
        const deferred = await safeDefer(interaction, { ephemeral: true });
        if (!deferred) return;

        if (sub === "rule") {
          const targetUser = interaction.options.getUser("user", false);
          const text = interaction.options.getString("text", true).trim();
          if (!text) {
            await interaction.editReply({ content: "Falta el texto de la regla." });
            return;
          }
          if (looksSensitive(text)) {
            await interaction.editReply({
              content: "No puedo guardar datos sensibles. Quita tokens/contraseñas/claves y vuelve a intentar."
            });
            return;
          }

          await ensureDataDir();
          await appendJsonl(rulesPath, {
            id: randomUUID(),
            ts: new Date().toISOString(),
            guildId: interaction.guildId ?? "dm",
            userId: interaction.user.id,
            ...(targetUser ? { targetUserId: targetUser.id, targetUserTag: targetUser.tag } : {}),
            text
          });

          await interaction.editReply({
            content: targetUser ? `Regla guardada para @${targetUser.username}.` : "Regla guardada."
          });
          return;
        }

        if (sub === "add") {
          const prompt = interaction.options.getString("prompt", true).trim();
          const ideal = interaction.options.getString("ideal", true).trim();
          const tagsRaw = interaction.options.getString("tags", false) ?? "";

          if (!prompt || !ideal) {
            await interaction.editReply({ content: "Faltan prompt e ideal." });
            return;
          }

          if (looksSensitive(prompt) || looksSensitive(ideal) || looksSensitive(tagsRaw)) {
            await interaction.editReply({
              content: "No puedo guardar datos sensibles. Quita tokens/contraseñas/claves y vuelve a intentar."
            });
            return;
          }

          const tags = tagsRaw
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t.length > 0)
            .slice(0, 10);

          const id = randomUUID();
          const rules = await loadLastRulesForContext({
            path: rulesPath,
            limit: 10,
            guildId: interaction.guildId ?? "dm",
            targetUserId: interaction.user.id
          }).catch(() => []);
          const profile = buildProfileText(rules);
          await ensureDataDir();
          await appendJsonl(examplesPath, {
            id,
            ts: new Date().toISOString(),
            guildId: interaction.guildId ?? "dm",
            userId: interaction.user.id,
            prompt,
            ideal,
            tags,
            profile
          });

          await interaction.editReply({
            content: `Ejemplo guardado. id=${id}${tags.length ? ` tags=${tags.join(",")}` : ""}`
          });
          return;
        }

        if (sub === "profile") {
          const summary = await loadProfileSummary({
            path: rulesPath,
            limit: 10,
            guildId: interaction.guildId ?? "dm"
          });
          await interaction.editReply({ content: summary });
          return;
        }

        if (sub === "forget") {
          const query = interaction.options.getString("query", true).trim();
          if (!query) {
            await interaction.editReply({ content: "Falta el texto para buscar." });
            return;
          }
          if (looksSensitive(query)) {
            await interaction.editReply({
              content: "No puedo procesar ese texto. Quita tokens/contraseñas/claves y vuelve a intentar."
            });
            return;
          }

          const result = await forgetRulesByQuery({
            path: rulesPath,
            query,
            guildId: interaction.guildId ?? "dm"
          });
          if (result.status === "no_file") {
            await interaction.editReply({ content: "No hay reglas guardadas." });
            return;
          }

          await interaction.editReply({
            content: `Listo. Eliminé ${result.removed} regla(s). Quedan ${result.remainingInGuild} en este server.`
          });
          return;
        }

        await interaction.editReply({ content: "Unknown subcommand." });
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

function splitDiscordMessages(text: string, limit = 1900): string[] {
  const cleaned = text.replace(/\r\n/g, "\n").trim();
  if (!cleaned) return [""];
  if (cleaned.length <= limit) return [cleaned];

  const blocks = cleaned.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const pages: string[] = [];
  let current = "";

  const flush = () => {
    if (current.trim().length > 0) pages.push(current.trim());
    current = "";
  };

  for (const block of blocks) {
    if (block.length > limit) {
      flush();
      for (let i = 0; i < block.length; i += limit) {
        pages.push(block.slice(i, i + limit).trim());
      }
      continue;
    }

    const next = current ? `${current}\n\n${block}` : block;
    if (next.length > limit) {
      flush();
      current = block;
    } else {
      current = next;
    }
  }

  flush();
  return pages;
}

async function replyEphemeralPages(
  interaction: {
    reply: (opts: { content: string; ephemeral?: boolean }) => Promise<unknown>;
    followUp: (opts: { content: string; ephemeral?: boolean }) => Promise<unknown>;
  },
  pages: string[]
): Promise<void> {
  const safePages = pages.map((p) => clampDiscordMessage(p)).filter((p) => p.length > 0);
  if (safePages.length === 0) {
    await interaction.reply({ content: "Listo.", ephemeral: true });
    return;
  }

  await interaction.reply({ content: safePages[0]!, ephemeral: true });
  for (const page of safePages.slice(1)) {
    await interaction.followUp({ content: page, ephemeral: true });
  }
}

function neutralizeMentions(text: string): string {
  return text.replaceAll("@everyone", "(everyone)").replaceAll("@here", "(here)");
}

function looksSensitive(text: string): boolean {
  const t = text.toLowerCase();
  if (t.includes("token=")) return true;
  if (t.includes("api_key")) return true;
  if (t.includes("apikey")) return true;
  if (t.includes("password")) return true;
  if (t.includes("passwd")) return true;
  if (t.includes("client_secret")) return true;
  if (t.includes("authorization:")) return true;
  if (t.includes("bearer ")) return true;
  if (t.includes("secret=")) return true;
  if (t.includes("private_key")) return true;
  if (t.includes("sk-")) return true;
  if (t.includes("xoxb-")) return true;
  if (t.includes("-----begin private key-----")) return true;
  if (t.includes("discord_bot_token")) return true;
  if (/\bghp_[a-z0-9]{20,}\b/i.test(text)) return true;
  if (/\beyj[a-z0-9_-]{10,}\.[a-z0-9_-]{10,}\.[a-z0-9_-]{10,}\b/i.test(text)) return true;
  return false;
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

async function ensureDataDir(): Promise<void> {
  await mkdir(dataDir, { recursive: true });
}

async function appendJsonl(path: string, value: unknown): Promise<void> {
  const line = `${JSON.stringify(value)}\n`;
  await appendFile(path, line, { encoding: "utf8" });
}

type TrainExample = {
  id: string;
  ts: string;
  guildId: string;
  userId: string;
  prompt: string;
  ideal: string;
  tags: string[];
  system?: string;
  profile?: string;
};

type StyleRule = {
  id: string;
  ts: string;
  guildId: string;
  userId: string;
  targetUserId?: string;
  targetUserTag?: string;
  text: string;
};

async function loadLastRulesForContext({
  path,
  limit,
  guildId,
  targetUserId
}: {
  path: string;
  limit: number;
  guildId: string;
  targetUserId: string;
}): Promise<StyleRule[]> {
  if (!existsSync(path)) return [];
  const raw = await readFile(path, { encoding: "utf8" }).catch(() => "");
  const lines = raw.split("\n").filter((l) => l.trim().length > 0);
  const userRules: StyleRule[] = [];
  const globalRules: StyleRule[] = [];

  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i];
    if (!line) continue;
    try {
      const obj = JSON.parse(line) as StyleRule;
      if (!obj || typeof obj.text !== "string" || obj.text.trim().length === 0) continue;
      if (obj.guildId !== guildId) continue;

      if (obj.targetUserId && obj.targetUserId === targetUserId) {
        userRules.push(obj);
      } else if (!obj.targetUserId) {
        globalRules.push(obj);
      }

      if (userRules.length + globalRules.length >= limit * 3) break;
    } catch {
      continue;
    }
  }

  return [...userRules, ...globalRules].slice(0, limit);
}

async function exportFineTuneDataset({
  examplesPath,
  rulesPath,
  outPath,
  systemPrompt
}: {
  examplesPath: string;
  rulesPath: string;
  outPath: string;
  systemPrompt: string;
}): Promise<void> {
  await ensureDataDir();
  if (!existsSync(examplesPath)) {
    console.log("export finetune: no examples file, nothing to export");
    await writeFile(outPath, "", { encoding: "utf8" });
    return;
  }

  const raw = await readFile(examplesPath, { encoding: "utf8" }).catch(() => "");
  const lines = raw.split("\n").filter((l) => l.trim().length > 0);
  const examples: TrainExample[] = [];

  for (const line of lines) {
    try {
      const obj = JSON.parse(line) as TrainExample;
      if (!obj || typeof obj.prompt !== "string" || typeof obj.ideal !== "string") continue;
      examples.push(obj);
    } catch {
      continue;
    }
  }

  const rules = await loadLastRules({ path: rulesPath, limit: 10 }).catch(() => []);
  const profileFallback = buildProfileText(rules);

  const outLines: string[] = [];
  for (const ex of examples) {
    const sys = (ex.system ?? systemPrompt).trim();
    const profile = (ex.profile ?? profileFallback)?.trim() ?? "";
    const systemContent = [sys, profile].filter((s) => s.trim().length > 0).join("\n\n");
    outLines.push(
      JSON.stringify({
        id: ex.id,
        ts: ex.ts,
        tags: Array.isArray(ex.tags) ? ex.tags : [],
        source: { guildId: ex.guildId, userId: ex.userId },
        messages: [
          ...(systemContent ? [{ role: "system", content: systemContent }] : []),
          { role: "user", content: ex.prompt },
          { role: "assistant", content: ex.ideal }
        ]
      })
    );
  }

  await writeFile(outPath, outLines.length ? `${outLines.join("\n")}\n` : "", { encoding: "utf8" });
  console.log(`export finetune: wrote ${outLines.length} example(s) to ${outPath}`);
}

async function loadLastRules({
  path,
  limit
}: {
  path: string;
  limit: number;
}): Promise<StyleRule[]> {
  if (!existsSync(path)) return [];
  const raw = await readFile(path, { encoding: "utf8" }).catch(() => "");
  const lines = raw.split("\n").filter((l) => l.trim().length > 0);
  const out: StyleRule[] = [];
  for (let i = lines.length - 1; i >= 0 && out.length < limit; i -= 1) {
    const line = lines[i];
    if (!line) continue;
    try {
      const obj = JSON.parse(line) as StyleRule;
      if (obj && typeof obj.text === "string" && obj.text.trim().length > 0) out.push(obj);
    } catch {
      continue;
    }
  }
  return out;
}

function buildProfileText(rules: StyleRule[]): string | undefined {
  if (rules.length === 0) return undefined;
  const bullets = rules
    .slice(0, 10)
    .map((r) => r.text.trim())
    .filter((t) => t.length > 0)
    .map((t) => (t.length > 140 ? `${t.slice(0, 140)}…` : t))
    .map((t) => `- ${t}`);

  if (bullets.length === 0) return undefined;
  return `PREFERENCIAS ACTUALES (síguelas):\n${bullets.join("\n")}`;
}

async function loadProfileSummary({
  path,
  limit,
  guildId
}: {
  path: string;
  limit: number;
  guildId: string;
}): Promise<string> {
  if (!existsSync(path)) return "No hay reglas guardadas.";
  const raw = await readFile(path, { encoding: "utf8" }).catch(() => "");
  const lines = raw.split("\n").filter((l) => l.trim().length > 0);
  const rules: StyleRule[] = [];
  for (const line of lines) {
    try {
      const obj = JSON.parse(line) as StyleRule;
      if (!obj || obj.guildId !== guildId) continue;
      if (typeof obj.text === "string" && obj.text.trim().length > 0) rules.push(obj);
    } catch {
      continue;
    }
  }

  if (rules.length === 0) return "No hay reglas guardadas.";
  const last = rules.slice(-limit);
  const bullets = last
    .map((r) =>
      r.targetUserTag
        ? `[${r.targetUserTag}] ${r.text.trim()}`
        : r.targetUserId
          ? `[user:${r.targetUserId}] ${r.text.trim()}`
          : r.text.trim()
    )
    .filter((t) => t.length > 0)
    .map((t) => (t.length > 140 ? `${t.slice(0, 140)}…` : t))
    .map((t) => `- ${t}`);
  const extra = rules.length > limit ? `\n(+${rules.length - limit} más)` : "";
  return `Reglas actuales (${Math.min(limit, rules.length)}/${rules.length}):\n${bullets.join("\n")}${extra}`;
}

async function forgetRulesByQuery({
  path,
  query,
  guildId
}: {
  path: string;
  query: string;
  guildId: string;
}): Promise<
  { status: "ok"; removed: number; remainingInGuild: number } | { status: "no_file" }
> {
  if (!existsSync(path)) return { status: "no_file" };
  const q = query.toLowerCase();
  const raw = await readFile(path, { encoding: "utf8" }).catch(() => "");
  const lines = raw.split("\n").filter((l) => l.trim().length > 0);

  const kept: string[] = [];
  let removed = 0;
  let remainingInGuild = 0;

  for (const line of lines) {
    try {
      const obj = JSON.parse(line) as StyleRule;
      const text = typeof obj?.text === "string" ? obj.text : "";
      if (obj?.guildId === guildId && text.toLowerCase().includes(q)) {
        removed += 1;
      } else {
        kept.push(JSON.stringify(obj));
        if (obj?.guildId === guildId && typeof obj.text === "string" && obj.text.trim().length > 0) {
          remainingInGuild += 1;
        }
      }
    } catch {
      kept.push(line);
    }
  }

  const next = kept.length ? `${kept.join("\n")}\n` : "";
  await writeFile(path, next, { encoding: "utf8" });
  return { status: "ok", removed, remainingInGuild };
}

function parseTriggerWords(raw: string | undefined): string[] {
  const base = raw ?? "michi,michito,gato";
  const items = base
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);
  return Array.from(new Set(items)).slice(0, 50);
}

function containsTrigger(text: string, triggers: string[]): boolean {
  if (triggers.length === 0) return false;
  const t = text.toLowerCase();
  for (const trigger of triggers) {
    const re = new RegExp(`\\b${escapeRegExp(trigger)}\\b`, "i");
    if (re.test(t)) return true;
  }
  return false;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
