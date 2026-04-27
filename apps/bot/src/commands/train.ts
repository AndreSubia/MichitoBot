import { CommandDefinition } from "@michito/discord";
import { randomUUID } from "node:crypto";
import {
  safeDefer,
  looksSensitive,
  extractMentionedUserIds
} from "../lib/utils.js";
import {
  ensureDataDir,
  appendJsonl,
  loadLastRulesForContext,
  buildProfileText,
  loadProfileSummary,
  forgetRulesByQuery
} from "../services/training.service.js";
import { config } from "../config.js";

export const trainCommand: CommandDefinition = {
  name: "train",
  description: "Train Michito (local data only)",
  async handle(interaction) {
    console.log(
      `interaction: command=${interaction.commandName} guild=${interaction.guildId ?? "dm"} user=${interaction.user.id}`
    );

    const sub = interaction.options.getSubcommand(true);
    const deferred = await safeDefer(interaction, { ephemeral: true });
    if (!deferred) return;

    if (sub === "rule") {
      const targetUser = interaction.options.getUser("user", false);
      const text = interaction.options.getString("text", true).trim();
      if (!text) {
        await interaction.editReply({ content: "Falta el texto de la regla." });
        return;
      }
      if (looksSensitive(text)) {
        await interaction.editReply({
          content: "No puedo guardar datos sensibles. Quita tokens/contraseñas/claves y vuelve a intentar."
        });
        return;
      }

      const extractedUserIds = extractMentionedUserIds(text);
      if (!targetUser && extractedUserIds.length === 1) {
        const autoTargetUserId = extractedUserIds[0]!;
        await ensureDataDir();
        await appendJsonl(config.paths.rulesPath, {
          id: randomUUID(),
          ts: new Date().toISOString(),
          guildId: interaction.guildId ?? "dm",
          userId: interaction.user.id,
          targetUserId: autoTargetUserId,
          text
        });
        await interaction.editReply({
          content:
            "Regla guardada para ese usuario (detecté el mention). Para mejor control, usa /train rule user:@alguien text:\"...\"."
        });
        return;
      }
      if (!targetUser && extractedUserIds.length > 1) {
        await interaction.editReply({
          content:
            "Veo varios usuarios mencionados. Para reglas por usuario, usa /train rule user:@alguien text:\"...\"."
        });
        return;
      }

      await ensureDataDir();
      await appendJsonl(config.paths.rulesPath, {
        id: randomUUID(),
        ts: new Date().toISOString(),
        guildId: interaction.guildId ?? "dm",
        userId: interaction.user.id,
        ...(targetUser ? { targetUserId: targetUser.id, targetUserTag: targetUser.tag } : {}),
        text
      });

      await interaction.editReply({
        content: targetUser ? `Regla guardada para @${targetUser.username}.` : "Regla guardada."
      });
      return;
    }

    if (sub === "add") {
      const prompt = interaction.options.getString("prompt", true).trim();
      const ideal = interaction.options.getString("ideal", true).trim();
      const tagsRaw = interaction.options.getString("tags", false) ?? "";

      if (!prompt || !ideal) {
        await interaction.editReply({ content: "Faltan prompt e ideal." });
        return;
      }

      if (looksSensitive(prompt) || looksSensitive(ideal) || looksSensitive(tagsRaw)) {
        await interaction.editReply({
          content: "No puedo guardar datos sensibles. Quita tokens/contraseñas/claves y vuelve a intentar."
        });
        return;
      }

      const tags = tagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
        .slice(0, 10);

      const id = randomUUID();
      const rules = await loadLastRulesForContext({
        limit: 10,
        guildId: interaction.guildId ?? "dm",
        targetUserId: interaction.user.id
      }).catch(() => []);
      const profile = buildProfileText(rules);
      await ensureDataDir();
      await appendJsonl(config.paths.examplesPath, {
        id,
        ts: new Date().toISOString(),
        guildId: interaction.guildId ?? "dm",
        userId: interaction.user.id,
        prompt,
        ideal,
        tags,
        profile
      });

      await interaction.editReply({
        content: `Ejemplo guardado. id=${id}${tags.length ? ` tags=${tags.join(",")}` : ""}`
      });
      return;
    }

    if (sub === "profile") {
      const summary = await loadProfileSummary({
        limit: 10,
        guildId: interaction.guildId ?? "dm"
      });
      await interaction.editReply({ content: summary });
      return;
    }

    if (sub === "forget") {
      const query = interaction.options.getString("query", true).trim();
      if (!query) {
        await interaction.editReply({ content: "Falta el texto para buscar." });
        return;
      }
      if (looksSensitive(query)) {
        await interaction.editReply({
          content: "No puedo procesar ese texto. Quita tokens/contraseñas/claves y vuelve a intentar."
        });
        return;
      }

      const result = await forgetRulesByQuery({
        query,
        guildId: interaction.guildId ?? "dm"
      });
      if (result.status === "no_file") {
        await interaction.editReply({ content: "No hay reglas guardadas." });
        return;
      }

      await interaction.editReply({
        content: `Listo. Eliminé ${result.removed} regla(s). Quedan ${result.remainingInGuild} en este server.`
      });
      return;
    }

    await interaction.editReply({ content: "Unknown subcommand." });
  }
};
