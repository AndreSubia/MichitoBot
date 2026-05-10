import {
  CommandDefinition,
  compose,
  requireGuild,
  requireAdmin,
  requireAlive,
  requireChannel,
  withCooldown,
} from "@michito/discord";
import { PET_ACTIONS, performAction, summarizeAction } from "../services/pet.service.js";

const handleHeal: CommandDefinition["handle"] = async (interaction) => {
  if (!interaction.guildId) return;
  const result = await performAction(interaction.guildId, interaction.user.id, PET_ACTIONS.HEAL!);
  if (!result.applied) {
    await interaction.reply({ content: "Michi no necesita medicina.", ephemeral: true });
    return;
  }
  await interaction.reply({ embeds: [summarizeAction(PET_ACTIONS.HEAL!, result.pet)] });
};

export const healCommand: CommandDefinition = {
  name: "heal",
  description: "Dale medicina a Michi (admin)",
  handle: compose(
    requireGuild,
    requireAdmin,
    requireAlive,
    requireChannel,
    withCooldown({ seconds: 30 * 60, scope: "guild" }),
  )(handleHeal),
};
