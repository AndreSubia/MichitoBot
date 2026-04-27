import { Client, Interaction } from "discord.js";
import { CommandDefinition } from "./types/index.js";

export type InteractionRouterOptions = {
  client: Client;
  commands: CommandDefinition[];
};

export function registerInteractionRouter({
  client,
  commands
}: InteractionRouterOptions): void {
  const byName = new Map(commands.map((c) => [c.name, c]));
  const knownNames = commands.map((c) => c.name).sort();

  client.on("interactionCreate", async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = byName.get(interaction.commandName);
    if (!command) {
      await interaction.reply({
        content: `Unknown command: ${interaction.commandName}. Try one of: ${knownNames.map((n) => `/${n}`).join(", ")}`,
        ephemeral: true
      });
      return;
    }

    try {
      await command.handle(interaction);
    } catch (err) {
      console.error(err);

      const content = "Something went wrong while handling this command.";
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ content, ephemeral: true }).catch(() => undefined);
      } else {
        await interaction.reply({ content, ephemeral: true }).catch(() => undefined);
      }
    }
  });
}
