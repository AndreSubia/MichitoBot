import { EmbedBuilder } from "discord.js";
import { CommandDefinition, compose, requireGuild, requireAdmin } from "@michito/discord";
import { petRepo } from "@michito/db";
import { buildStatusEmbed } from "../services/pet.service.js";

const handleRevive: CommandDefinition["handle"] = async (interaction) => {
  if (!interaction.guildId) return;
  const pet = await petRepo.getPetByGuild(interaction.guildId);
  if (!pet) {
    await interaction.reply({ content: "Aún no hay un Michi en este servidor.", ephemeral: true });
    return;
  }
  if (pet.state !== "DEAD") {
    await interaction.reply({ content: "Michi está vivo, no necesita revivir.", ephemeral: true });
    return;
  }
  const revived = await petRepo.markAlive(interaction.guildId, interaction.user.id);
  const embed = new EmbedBuilder()
    .setTitle("✨ Michi abrió un ojo…")
    .setDescription("Está vivo otra vez. Cuídalo mejor esta vez.")
    .setColor(0xc97b1e);
  await interaction.reply({ embeds: [embed, buildStatusEmbed(revived)] });
};

export const reviveCommand: CommandDefinition = {
  name: "revive",
  description: "Revive a Michi (admin)",
  handle: compose(requireGuild, requireAdmin)(handleRevive),
};
