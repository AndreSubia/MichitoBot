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

const handleFeed: CommandDefinition["handle"] = async (interaction) => {
  if (!interaction.guildId) return;
  const result = await performAction(interaction.guildId, interaction.user.id, PET_ACTIONS.FEED!);
  if (!result.applied) {
    await interaction.reply({ content: "Michi no puede comer ahora.", ephemeral: true });
    return;
  }
  await interaction.reply({ embeds: [summarizeAction(PET_ACTIONS.FEED!, result.pet)] });
};

export const feedCommand: CommandDefinition = {
  name: "feed",
  description: "Dale comida a Michi",
  handle: compose(
    requireGuild,
    requireAlive,
    requireChannel,
    withCooldown({ seconds: 5 * 60, scope: "user" }),
    withRateLimit({ limit: 30, windowSeconds: 5 * 60, scope: "user" }),
  )(handleFeed),
};
