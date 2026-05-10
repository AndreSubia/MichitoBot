import {
  CommandDefinition,
  compose,
  requireGuild,
  requireChannel,
  withCooldown,
} from "@michito/discord";
import { petRepo, trainingRuleRepo } from "@michito/db";
import { buildStatusEmbed } from "../services/pet.service.js";

const handleStatus: CommandDefinition["handle"] = async (interaction) => {
  if (!interaction.guildId) return;
  const pet = await petRepo.ensurePet(interaction.guildId);
  const rulesCount = await trainingRuleRepo.countActiveRules(interaction.guildId);
  const embed = buildStatusEmbed(pet).setFooter({ text: `${rulesCount} reglas activas` });
  await interaction.reply({ embeds: [embed] });
};

export const statusCommand: CommandDefinition = {
  name: "status",
  description: "Ver el estado de Michi",
  handle: compose(
    requireGuild,
    requireChannel,
    withCooldown({ seconds: 5, scope: "user" }),
  )(handleStatus),
};
