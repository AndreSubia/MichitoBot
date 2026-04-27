import { CommandDefinition } from "@michito/discord";
import { safeDefer, clampDiscordMessage, neutralizeMentions } from "../lib/utils.js";
import { loadLastRulesForContext, buildProfileText } from "../services/training.service.js";
import { llm } from "../services/ai.service.js";

export const chatCommand: CommandDefinition = {
  name: "chat",
  description: "Chat with Michito",
  async handle(interaction) {
    console.log(
      `interaction: command=${interaction.commandName} guild=${interaction.guildId ?? "dm"} user=${interaction.user.id}`
    );

    const sub = interaction.options.getSubcommand(false);
    if (sub !== "ask") {
      await interaction.reply({ content: "Unknown subcommand", ephemeral: true });
      return;
    }

    const prompt = interaction.options.getString("prompt", true);
    console.log(`chat.ask: prompt_len=${prompt.length}`);
    const deferred = await safeDefer(interaction);
    if (!deferred) return;

    try {
      const rules = await loadLastRulesForContext({
        limit: 10,
        guildId: interaction.guildId ?? "dm",
        targetUserId: interaction.user.id
      });
      const profileText = buildProfileText(rules);
      const result = await llm.chat({
        messages: [
          ...(profileText
            ? [
                {
                  role: "system" as const,
                  content: profileText
                }
              ]
            : []),
          { role: "user", content: prompt }
        ]
      });

      const content = clampDiscordMessage(neutralizeMentions(result.content));
      await interaction.editReply({ content });
      console.log(`chat.ask: ok response_len=${content.length}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      const content = clampDiscordMessage(`LLM error: ${message}`);
      await interaction.editReply({ content }).catch(() => undefined);
      console.error("LLM error", err);
    }
  }
};
