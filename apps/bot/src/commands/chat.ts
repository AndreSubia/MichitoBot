import {
  CommandDefinition,
  compose,
  requireGuild,
  requireAlive,
  requireChannel,
  withRateLimit,
} from "@michito/discord";
import { buildSystemPrompt } from "@michito/ai";
import { petRepo, trainingRuleRepo } from "@michito/db";
import { safeDefer, clampDiscordMessage, neutralizeMentions } from "../lib/utils.js";
import { llm } from "../services/ai.service.js";

const MAX_USER_PROMPT = 1000;

const handleAsk: CommandDefinition["handle"] = async (interaction) => {
  if (!interaction.guildId) return;

  const sub = interaction.options.getSubcommand(false);
  if (sub !== "ask") {
    await interaction.reply({ content: "Subcomando desconocido.", ephemeral: true });
    return;
  }

  const promptRaw = interaction.options.getString("prompt", true);
  const prompt = promptRaw.slice(0, MAX_USER_PROMPT);

  const deferred = await safeDefer(interaction);
  if (!deferred) return;

  try {
    const [pet, rules] = await Promise.all([
      petRepo.ensurePet(interaction.guildId),
      trainingRuleRepo.listActiveRules(interaction.guildId, 20),
    ]);

    const guildName = interaction.guild?.name;
    const systemMessage = buildSystemPrompt({
      rules: rules.map((r) => ({ text: r.text })),
      pet: {
        name: pet.name,
        state: pet.state,
        mood: pet.mood,
        hunger: pet.hunger,
        energy: pet.energy,
        health: pet.health,
      },
      ...(guildName !== undefined ? { guildName } : {}),
    });

    const result = await llm.chat({
      messages: [systemMessage, { role: "user", content: prompt }],
    });

    const content = clampDiscordMessage(neutralizeMentions(result.content));
    await interaction.editReply({ content });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    const content = clampDiscordMessage(`⚠️ Error con el modelo: ${message}`);
    await interaction.editReply({ content }).catch(() => undefined);
    console.error("LLM error", err);
  }
};

export const chatCommand: CommandDefinition = {
  name: "chat",
  description: "Chatea con Michi",
  handle: compose(
    requireGuild,
    requireAlive,
    requireChannel,
    withRateLimit({ limit: 10, windowSeconds: 60, scope: "user" }),
    withRateLimit({ limit: 60, windowSeconds: 60, scope: "guild" }),
  )(handleAsk),
};
