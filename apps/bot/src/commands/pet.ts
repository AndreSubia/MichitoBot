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

const handlePet: CommandDefinition["handle"] = async (interaction) => {
  if (!interaction.guildId) return;
  const result = await performAction(interaction.guildId, interaction.user.id, PET_ACTIONS.PET!);
  if (!result.applied) {
    await interaction.reply({ content: "Michi no quiere caricias ahora.", ephemeral: true });
    return;
  }
  await interaction.reply({ embeds: [summarizeAction(PET_ACTIONS.PET!, result.pet)] });
};

export const petCommand: CommandDefinition = {
  name: "pet",
  description: "Hazle caricias a Michi",
  handle: compose(
    requireGuild,
    requireAlive,
    requireChannel,
    withCooldown({ seconds: 60, scope: "user" }),
    withRateLimit({ limit: 60, windowSeconds: 5 * 60, scope: "user" }),
  )(handlePet),
};
