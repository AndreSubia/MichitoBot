import { neutralizeMentions, looksSensitive } from "./utils.js";

export function safeMessagePreview(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  if (looksSensitive(trimmed)) return "[redacted]";
  const oneLine = neutralizeMentions(trimmed).replace(/\s+/g, " ").trim();
  if (oneLine.length <= 160) return oneLine;
  return `${oneLine.slice(0, 160)}…`;
}

export function safeLogLine(text: string, maxLen: number): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  if (looksSensitive(trimmed)) return "[redacted]";
  const oneLine = neutralizeMentions(trimmed).replace(/\s+/g, " ").trim();
  if (oneLine.length <= maxLen) return oneLine;
  return `${oneLine.slice(0, maxLen)}…`;
}

export function logDiscordMessageReceipt({
  enabled,
  includeContent,
  verbose,
  message,
  content,
  triggerHits
}: {
  enabled: boolean;
  includeContent: boolean;
  verbose: boolean;
  message: unknown;
  content: string;
  triggerHits: string[];
}): void {
  if (!enabled) return;
  const msg = message as {
    id: string;
    guildId: string;
    channelId: string;
    createdTimestamp?: number;
    author: { id: string; username: string; tag?: string };
    member?: { displayName?: string } | null;
    mentions?: {
      users?: { map: (fn: (u: { id: string; username: string; tag?: string }) => unknown) => unknown[] };
      members?: { map: (fn: (m: { id: string; displayName?: string }) => unknown) => unknown[] };
    };
    reference?: { messageId?: string } | null;
  };

  if (!verbose) {
    const preview = includeContent ? safeMessagePreview(content) : "";
    console.log(
      `msg.recv: guild=${msg.guildId} channel=${msg.channelId} user=${msg.author.id} len=${content.length} triggers=${
        triggerHits.length ? triggerHits.join(",") : "-"
      }${preview ? ` preview="${preview}"` : ""}`
    );
    return;
  }

  const payload = {
    kind: "msg.recv",
    guildId: msg.guildId,
    channelId: msg.channelId,
    messageId: msg.id,
    replyToMessageId: msg.reference?.messageId ?? null,
    ts: typeof msg.createdTimestamp === "number" ? new Date(msg.createdTimestamp).toISOString() : undefined,
    author: {
      id: msg.author.id,
      username: msg.author.username,
      tag: msg.author.tag ?? undefined,
      displayName: msg.member?.displayName ?? undefined
    },
    triggers: triggerHits,
    content: includeContent ? safeLogLine(content, 800) : undefined,
    mentions: {
      users: msg.mentions?.users?.map((u) => ({ id: u.id, username: u.username, tag: u.tag ?? undefined })) ?? [],
      members: msg.mentions?.members?.map((m) => ({ id: m.id, displayName: m.displayName ?? undefined })) ?? []
    }
  };

  console.log(JSON.stringify(payload));
}
