import { EmbedBuilder } from "discord.js";
import {
  CommandDefinition,
  compose,
  requireGuild,
  requireAdmin,
  requireChannel,
} from "@michito/discord";
import { trainingRuleRepo, InvalidRuleError } from "@michito/db";
import { looksSensitive } from "../lib/utils.js";

const handleList: CommandDefinition["handle"] = async (interaction) => {
  if (!interaction.guildId) return;
  const rules = await trainingRuleRepo.listActiveRules(interaction.guildId, 20);
  if (rules.length === 0) {
    await interaction.reply({
      content: "📭 Sin reglas todavía. Un admin puede agregar una con `/rules add text:\"...\"`.",
      ephemeral: true,
    });
    return;
  }
  const embed = new EmbedBuilder()
    .setTitle(`📜 Reglas activas (${rules.length})`)
    .setColor(0xc97b1e)
    .setDescription(
      rules
        .map((r, i) => `**${i + 1}.** ${r.text}\n  \`${r.id}\``)
        .join("\n"),
    )
    .setFooter({ text: "Para borrar: /rules remove id:<id>" });
  await interaction.reply({ embeds: [embed], ephemeral: true });
};

const listHandler = compose(requireGuild, requireChannel)(handleList);

const handleAdd: CommandDefinition["handle"] = async (interaction) => {
  if (!interaction.guildId) return;
  const text = interaction.options.getString("text", true).trim();
  if (looksSensitive(text)) {
    await interaction.reply({
      content: "🚫 No puedo guardar datos sensibles (tokens, contraseñas, claves). Reformula la regla.",
      ephemeral: true,
    });
    return;
  }
  try {
    const rule = await trainingRuleRepo.addRule(interaction.guildId, interaction.user.id, text);
    await interaction.reply({
      content: `✅ Regla añadida: *${rule.text}* \n\`${rule.id}\``,
      ephemeral: true,
    });
  } catch (err) {
    if (err instanceof InvalidRuleError) {
      await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
      return;
    }
    throw err;
  }
};

const addHandler = compose(requireGuild, requireAdmin)(handleAdd);

const handleRemove: CommandDefinition["handle"] = async (interaction) => {
  if (!interaction.guildId) return;
  const id = interaction.options.getString("id", true).trim();
  const removed = await trainingRuleRepo.deactivateRule(interaction.guildId, id);
  if (!removed) {
    await interaction.reply({ content: "🤔 No encontré una regla activa con ese id.", ephemeral: true });
    return;
  }
  await interaction.reply({ content: `🗑️ Regla \`${id}\` desactivada.`, ephemeral: true });
};

const removeHandler = compose(requireGuild, requireAdmin)(handleRemove);

export const rulesCommand: CommandDefinition = {
  name: "rules",
  description: "Gestiona las reglas de personalidad",
  async handle(interaction) {
    const sub = interaction.options.getSubcommand(true);
    if (sub === "list") return listHandler(interaction);
    if (sub === "add") return addHandler(interaction);
    if (sub === "remove") return removeHandler(interaction);
    await interaction.reply({ content: "Subcomando desconocido.", ephemeral: true });
  },
};
