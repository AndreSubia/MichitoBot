import { EmbedBuilder } from "discord.js";
import { CommandDefinition } from "@michito/discord";
import { config } from "../config.js";

const isOfficial = process.env.OFFICIAL_INSTANCE === "true";
const GITHUB_URL = process.env.MICHITO_REPO_URL ?? "https://github.com/exponentialabs/michito-bot";
const VERSION = process.env.MICHITO_VERSION ?? "0.1.0";

export const aboutCommand: CommandDefinition = {
  name: "about",
  description: "Información sobre esta instancia de Michi",
  async handle(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("🐱 Michi Bot")
      .setColor(0xc97b1e)
      .setDescription(
        isOfficial
          ? "Estás usando la **instancia oficial** de Michi."
          : "Estás usando una **instancia self-hosted** (open source).",
      )
      .addFields(
        { name: "Versión", value: VERSION, inline: true },
        { name: "Modelo", value: `\`${config.ollamaModel}\``, inline: true },
        { name: "Triggers", value: config.triggerWords.join(", ") || "(sin triggers)", inline: true },
        { name: "Código", value: GITHUB_URL, inline: false },
      )
      .setFooter({ text: "Open source. Self-hosting welcome." });
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
