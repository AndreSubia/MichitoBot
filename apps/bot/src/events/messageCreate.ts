import { Client, Message } from "discord.js";
import { config } from "../config.js";
import { logDiscordMessageReceipt } from "../lib/logger.js";
import {
  humanizeMessageContent,
  clampDiscordMessage,
  neutralizeMentions,
  escapeRegExp
} from "../lib/utils.js";
import {
  loadLastRulesForContext,
  buildProfileText
} from "../services/training.service.js";
import { llm } from "../services/ai.service.js";
import { safeLogLine } from "../lib/logger.js";

export function registerMessageCreate(client: Client) {
  client.on("messageCreate", async (message: Message) => {
    try {
      if (message.author.bot) return;
      if (!message.inGuild()) return;
      const content = (message.content ?? "").trim();
      if (!content) return;

      const triggerHits = findTriggers(content, config.triggerWords);
      logDiscordMessageReceipt({
        enabled: config.logMessages,
        includeContent: config.logMessageContent,
        verbose: config.logMessageVerbose,
        message,
        content,
        triggerHits
      });

      if (content.startsWith("/")) return;
      if (triggerHits.length === 0) return;

      console.log(
        `chat.listen: triggered guild=${message.guildId} channel=${message.channelId} user=${message.author.id} prompt_len=${content.length}`
      );

      await message.channel.sendTyping().catch(() => undefined);

      const rules = await loadLastRulesForContext({
        limit: 10,
        guildId: message.guildId,
        targetUserId: message.author.id
      });
      const profileText = buildProfileText(rules);
      const promptForModel = humanizeMessageContent(message, content);

      if (config.logMessages && config.logMessageContent) {
        console.log(`msg.to_model: ${safeLogLine(promptForModel, 400)}`);
      }

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
          { role: "user", content: promptForModel }
        ]
      });

      const reply = clampDiscordMessage(neutralizeMentions(result.content));
      await message.reply({
        content: reply,
        allowedMentions: { parse: [], repliedUser: false }
      });
      console.log(`chat.listen: ok response_len=${reply.length}`);
    } catch (err) {
      console.error("chat.listen error", err);
    }
  });
}

function findTriggers(text: string, triggers: string[]): string[] {
  if (triggers.length === 0) return [];
  const out: string[] = [];
  const t = text.toLowerCase();
  for (const trigger of triggers) {
    const re = new RegExp(`\\b${escapeRegExp(trigger)}\\b`, "i");
    if (re.test(t)) out.push(trigger);
  }
  return out;
}
