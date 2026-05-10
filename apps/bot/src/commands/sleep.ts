import {
  CommandDefinition,
  compose,
  requireGuild,
  requireAlive,
  requireChannel,
  withCooldown,
  withRateLimit,
} from "@michito/discord";
import { PET_ACTIONS, performAction, summarizeAction } from "../services/pet.service.js";

const handleSleep: CommandDefinition["handle"] = async (interaction) => {
  if (!interaction.guildId) return;
  const result = await performAction(interaction.guildId, interaction.user.id, PET_ACTIONS.SLEEP!);
  if (!result.applied) {
    await interaction.reply({ content: "Michi no puede dormir ahora.", ephemeral: true });
    return;
  }
  await interaction.reply({ embeds: [summarizeAction(PET_ACTIONS.SLEEP!, result.pet)] });
};

export const sleepCommand: CommandDefinition = {
  name: "sleep",
  description: "Deja que Michi descanse",
  handle: compose(
    requireGuild,
    requireAlive,
    requireChannel,
    withCooldown({ seconds: 30 * 60, scope: "user" }),
    withRateLimit({ limit: 30, windowSeconds: 5 * 60, scope: "user" }),
  )(handleSleep),
};
