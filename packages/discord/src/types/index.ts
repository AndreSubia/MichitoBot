import { ChatInputCommandInteraction } from "discord.js";

export type CommandHandler = (
  interaction: ChatInputCommandInteraction
) => Promise<void>;

export type CommandDefinition = {
  name: string;
  description: string;
  handle: CommandHandler;
};
