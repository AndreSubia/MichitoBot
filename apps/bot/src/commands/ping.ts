import { CommandDefinition } from "@michito/discord";

export const pingCommand: CommandDefinition = {
  name: "ping",
  description: "Health check",
  async handle(interaction) {
    await interaction.reply({ content: "pong" });
  }
};
