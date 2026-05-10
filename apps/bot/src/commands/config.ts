import { ChannelType } from "discord.js";
import {
  CommandDefinition,
  compose,
  requireGuild,
  requireAdmin,
} from "@michito/discord";
import { prisma } from "@michito/db";

const handleChannelsAdd: CommandDefinition["handle"] = async (interaction) => {
  if (!interaction.guildId) return;
  const channel = interaction.options.getChannel("channel", true);
  if (channel.type !== ChannelType.GuildText) {
    await interaction.reply({ content: "Solo canales de texto.", ephemeral: true });
    return;
  }
  await prisma.guildAllowedChannel.upsert({
    where: { guildId_channelId: { guildId: interaction.guildId, channelId: channel.id } },
    create: { guildId: interaction.guildId, channelId: channel.id },
    update: {},
  });
  await interaction.reply({ content: `✅ Michi responderá en <#${channel.id}>.`, ephemeral: true });
};

const handleChannelsRemove: CommandDefinition["handle"] = async (interaction) => {
  if (!interaction.guildId) return;
  const channel = interaction.options.getChannel("channel", true);
  const result = await prisma.guildAllowedChannel.deleteMany({
    where: { guildId: interaction.guildId, channelId: channel.id },
  });
  if (result.count === 0) {
    await interaction.reply({ content: "Ese canal no estaba en la lista.", ephemeral: true });
    return;
  }
  await interaction.reply({ content: `🗑️ Quitado <#${channel.id}> de la lista.`, ephemeral: true });
};

const handleChannelsList: CommandDefinition["handle"] = async (interaction) => {
  if (!interaction.guildId) return;
  const rows = await prisma.guildAllowedChannel.findMany({
    where: { guildId: interaction.guildId },
    select: { channelId: true },
  });
  if (rows.length === 0) {
    await interaction.reply({
      content: "Sin canales configurados. Michi responde en cualquier canal donde tenga acceso.",
      ephemeral: true,
    });
    return;
  }
  const list = rows.map((r) => `• <#${r.channelId}>`).join("\n");
  await interaction.reply({ content: `📺 Canales permitidos:\n${list}`, ephemeral: true });
};

export const configCommand: CommandDefinition = {
  name: "config",
  description: "Configura Michi en este servidor (admin)",
  handle: compose(requireGuild, requireAdmin)(async (interaction) => {
    const group = interaction.options.getSubcommandGroup(false);
    const sub = interaction.options.getSubcommand(true);
    if (group === "channels") {
      if (sub === "add") return handleChannelsAdd(interaction);
      if (sub === "remove") return handleChannelsRemove(interaction);
      if (sub === "list") return handleChannelsList(interaction);
    }
    await interaction.reply({ content: "Subcomando desconocido.", ephemeral: true });
  }),
};
