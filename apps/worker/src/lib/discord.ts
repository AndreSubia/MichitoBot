import { Client, GatewayIntentBits, type TextChannel } from "discord.js";
import { prisma } from "@michito/db";

let clientPromise: Promise<Client> | null = null;

export function getDiscordClient(): Promise<Client> {
  if (clientPromise) return clientPromise;

  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    return Promise.reject(new Error("DISCORD_BOT_TOKEN is required for the death notifier"));
  }

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  });

  clientPromise = new Promise<Client>((resolve, reject) => {
    let settled = false;
    client.once("clientReady", () => {
      if (settled) return;
      settled = true;
      console.log(`worker.discord: ready as ${client.user?.tag ?? "unknown"}`);
      resolve(client);
    });
    client.once("error", (err) => {
      if (settled) return;
      settled = true;
      reject(err);
    });
    client.login(token).catch((err) => {
      if (settled) return;
      settled = true;
      reject(err);
    });
  });

  return clientPromise;
}

export async function findPostableChannel(client: Client, guildId: string): Promise<TextChannel | null> {
  const allowed = await prisma.guildAllowedChannel.findMany({
    where: { guildId },
    select: { channelId: true },
    take: 5,
  });

  const guild = await client.guilds.fetch(guildId).catch(() => null);
  if (!guild) return null;
  const me = guild.members.me;
  if (!me) return null;

  const tryChannel = async (channelId: string): Promise<TextChannel | null> => {
    const ch = await guild.channels.fetch(channelId).catch(() => null);
    if (!ch || !ch.isTextBased() || ch.isDMBased() || !("send" in ch)) return null;
    if (!ch.permissionsFor(me).has(["ViewChannel", "SendMessages", "EmbedLinks"])) return null;
    return ch as TextChannel;
  };

  for (const row of allowed) {
    const ch = await tryChannel(row.channelId);
    if (ch) return ch;
  }

  if (guild.systemChannelId) {
    const ch = await tryChannel(guild.systemChannelId);
    if (ch) return ch;
  }

  const channels = await guild.channels.fetch().catch(() => null);
  if (!channels) return null;
  for (const channel of channels.values()) {
    if (!channel) continue;
    const ch = await tryChannel(channel.id);
    if (ch) return ch;
  }
  return null;
}
