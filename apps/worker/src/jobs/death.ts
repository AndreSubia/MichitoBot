import { EmbedBuilder } from "discord.js";
import { Queue, Worker, type ConnectionOptions } from "bullmq";
import { petRepo } from "@michito/db";
import { findPostableChannel, getDiscordClient } from "../lib/discord.js";

export const DEATH_QUEUE = "death";

export interface DeathNotifyData {
  petId: string;
  guildId: string;
  causeOfDeath: string | null;
}

export const createDeathQueue = (connection: ConnectionOptions) =>
  new Queue<DeathNotifyData>(DEATH_QUEUE, { connection });

const formatRelative = (date: Date): string => {
  const ts = Math.floor(date.getTime() / 1000);
  return `<t:${ts}:R>`;
};

const causeLabel = (cause: string | null): string => {
  switch (cause) {
    case "HUNGER":
      return "se quedó sin comer";
    case "EXHAUSTION":
      return "se quedó sin energía";
    default:
      return "razones desconocidas";
  }
};

export interface StartDeathWorkerOptions {
  connection: ConnectionOptions;
}

export function startDeathWorker(options: StartDeathWorkerOptions) {
  const { connection } = options;
  return new Worker<DeathNotifyData>(
    DEATH_QUEUE,
    async (job) => {
      const { guildId, petId, causeOfDeath } = job.data;
      const pet = await petRepo.getPetByGuild(guildId);
      if (!pet || pet.id !== petId) {
        return { skipped: "pet-not-found" };
      }

      const client = await getDiscordClient();
      const channel = await findPostableChannel(client, guildId);
      if (!channel) {
        console.warn(`worker.death: no postable channel in guild ${guildId}`);
        return { skipped: "no-channel" };
      }

      const embed = new EmbedBuilder()
        .setTitle("💀 Michi descansa en paz")
        .setColor(0x3a2a1e)
        .setDescription(`Michi ${causeLabel(causeOfDeath)}.\nVivió desde ${formatRelative(pet.bornAt)}.`)
        .addFields(
          { name: "Muertes en total", value: String(pet.deathCount), inline: true },
          { name: "Última pista", value: causeOfDeath ?? "—", inline: true },
        )
        .setFooter({ text: "Un admin puede revivirlo con /revive." });

      await channel.send({ embeds: [embed] });
      return { posted: true };
    },
    { connection, concurrency: 1 },
  );
}
