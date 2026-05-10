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

const handlePlay: CommandDefinition["handle"] = async (interaction) => {
  if (!interaction.guildId) return;
  const result = await performAction(interaction.guildId, interaction.user.id, PET_ACTIONS.PLAY!);
  if (!result.applied) {
    await interaction.reply({ content: "Michi no quiere jugar ahora.", ephemeral: true });
    return;
  }
  await interaction.reply({ embeds: [summarizeAction(PET_ACTIONS.PLAY!, result.pet)] });
};

export const playCommand: CommandDefinition = {
  name: "play",
  description: "Juega con Michi",
  handle: compose(
    requireGuild,
    requireAlive,
    requireChannel,
    withCooldown({ seconds: 10 * 60, scope: "user" }),
    withRateLimit({ limit: 30, windowSeconds: 5 * 60, scope: "user" }),
  )(handlePlay),
};
