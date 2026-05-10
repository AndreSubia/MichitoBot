import { ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits } from "discord.js";
import { petRepo, prisma } from "@michito/db";
import type { CommandHandler } from "./types/index.js";

export type CommandMiddleware = (next: CommandHandler) => CommandHandler;

export const compose =
  (...middlewares: CommandMiddleware[]): CommandMiddleware =>
  (handler) =>
    middlewares.reduceRight<CommandHandler>((acc, mw) => mw(acc), handler);

const replyEphemeral = async (interaction: ChatInputCommandInteraction, content: string) => {
  if (interaction.deferred || interaction.replied) {
    await interaction.followUp({ content, flags: MessageFlags.Ephemeral }).catch(() => undefined);
  } else {
    await interaction.reply({ content, flags: MessageFlags.Ephemeral }).catch(() => undefined);
  }
};

export const requireGuild: CommandMiddleware = (next) => async (interaction) => {
  if (!interaction.guildId) {
    await replyEphemeral(interaction, "Este comando solo funciona dentro de un servidor.");
    return;
  }
  await next(interaction);
};

export const requireAdmin: CommandMiddleware = (next) => async (interaction) => {
  if (!interaction.guildId) {
    await replyEphemeral(interaction, "Este comando solo funciona dentro de un servidor.");
    return;
  }
  const memberPerms = interaction.memberPermissions;
  if (!memberPerms?.has(PermissionFlagsBits.ManageGuild)) {
    await replyEphemeral(interaction, "🔒 Necesitas el permiso **Manage Server** para usar este comando.");
    return;
  }
  await next(interaction);
};

export const requireAlive: CommandMiddleware = (next) => async (interaction) => {
  if (!interaction.guildId) {
    await replyEphemeral(interaction, "Este comando solo funciona dentro de un servidor.");
    return;
  }
  const pet = await petRepo.getPetByGuild(interaction.guildId);
  if (pet?.state === "DEAD") {
    await replyEphemeral(
      interaction,
      "💀 Michi está dormido para siempre… un admin puede revivirlo con `/revive`.",
    );
    return;
  }
  await next(interaction);
};

export const requireChannel: CommandMiddleware = (next) => async (interaction) => {
  if (!interaction.guildId) {
    await replyEphemeral(interaction, "Este comando solo funciona dentro de un servidor.");
    return;
  }
  const allowed = await prisma.guildAllowedChannel.findMany({
    where: { guildId: interaction.guildId },
    select: { channelId: true },
  });
  if (allowed.length === 0) {
    await next(interaction);
    return;
  }
  if (!allowed.some((row) => row.channelId === interaction.channelId)) {
    await replyEphemeral(interaction, "Michi no responde en este canal.");
    return;
  }
  await next(interaction);
};

interface CooldownOptions {
  /** Cooldown duration in seconds. */
  seconds: number;
  /** "user", "guild", or a function that returns a custom scope key. */
  scope?: "user" | "guild" | ((interaction: ChatInputCommandInteraction) => string);
}

const cooldownStore = new Map<string, number>();

export const withCooldown =
  (options: CooldownOptions): CommandMiddleware =>
  (next) =>
  async (interaction) => {
    const scope = options.scope ?? "user";
    let key: string;
    if (typeof scope === "function") {
      key = `${interaction.commandName}:${scope(interaction)}`;
    } else if (scope === "guild") {
      key = `${interaction.commandName}:guild:${interaction.guildId ?? "dm"}`;
    } else {
      key = `${interaction.commandName}:user:${interaction.user.id}`;
    }
    const now = Date.now();
    const expiresAt = cooldownStore.get(key);
    if (expiresAt && expiresAt > now) {
      const wait = Math.ceil((expiresAt - now) / 1000);
      await replyEphemeral(interaction, `⏳ Esperá ${wait}s antes de volver a usar este comando.`);
      return;
    }
    cooldownStore.set(key, now + options.seconds * 1000);
    if (cooldownStore.size > 1000) {
      for (const [k, exp] of cooldownStore) {
        if (exp <= now) cooldownStore.delete(k);
      }
    }
    await next(interaction);
  };

interface RateLimitOptions {
  /** Maximum invocations per window. */
  limit: number;
  /** Window length in seconds. */
  windowSeconds: number;
  /** Scope identifier prefix. */
  scope?: "user" | "guild" | "global" | ((interaction: ChatInputCommandInteraction) => string);
}

const isRateLimitDisabled = () => process.env.RATE_LIMIT_DISABLED === "true";

export const withRateLimit =
  (options: RateLimitOptions): CommandMiddleware =>
  (next) =>
  async (interaction) => {
    if (isRateLimitDisabled()) {
      await next(interaction);
      return;
    }

    const scope = options.scope ?? "user";
    let scopeKey: string;
    if (typeof scope === "function") {
      scopeKey = scope(interaction);
    } else if (scope === "guild") {
      scopeKey = `guild:${interaction.guildId ?? "dm"}:${interaction.commandName}`;
    } else if (scope === "global") {
      scopeKey = `global:${interaction.commandName}`;
    } else {
      scopeKey = `user:${interaction.user.id}:${interaction.commandName}`;
    }

    const windowMs = options.windowSeconds * 1000;
    const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);

    const bucket = await prisma.rateLimitBucket.upsert({
      where: { scope_windowStart: { scope: scopeKey, windowStart } },
      create: { scope: scopeKey, windowStart, count: 1 },
      update: { count: { increment: 1 } },
    });

    if (bucket.count > options.limit) {
      await replyEphemeral(
        interaction,
        `🛑 Estás yendo muy rápido (${bucket.count}/${options.limit}). Esperá un momento.`,
      );
      return;
    }

    await next(interaction);
  };
