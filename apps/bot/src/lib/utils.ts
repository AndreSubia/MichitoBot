
export function clampDiscordMessage(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= 1900) return trimmed;
  return `${trimmed.slice(0, 1900)}\n…`;
}

export function neutralizeMentions(text: string): string {
  return text.replaceAll("@everyone", "(everyone)").replaceAll("@here", "(here)");
}

export function looksSensitive(text: string): boolean {
  const t = text.toLowerCase();
  if (t.includes("token=")) return true;
  if (t.includes("api_key")) return true;
  if (t.includes("apikey")) return true;
  if (t.includes("password")) return true;
  if (t.includes("passwd")) return true;
  if (t.includes("client_secret")) return true;
  if (t.includes("authorization:")) return true;
  if (t.includes("bearer ")) return true;
  if (t.includes("secret=")) return true;
  if (t.includes("private_key")) return true;
  if (t.includes("sk-")) return true;
  if (t.includes("xoxb-")) return true;
  if (t.includes("-----begin private key-----")) return true;
  if (t.includes("discord_bot_token")) return true;
  if (/\bghp_[a-z0-9]{20,}\b/i.test(text)) return true;
  if (/\beyj[a-z0-9_-]{10,}\.[a-z0-9_-]{10,}\.[a-z0-9_-]{10,}\b/i.test(text)) return true;
  return false;
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function extractMentionedUserIds(text: string): string[] {
  const ids: string[] = [];
  const re = /<@!?(?<id>\d{17,20})>/g;
  for (const match of text.matchAll(re)) {
    const id = match.groups?.id;
    if (id) ids.push(id);
  }
  return Array.from(new Set(ids));
}

export function splitDiscordMessages(text: string, limit = 1900): string[] {
  const cleaned = text.replace(/\r\n/g, "\n").trim();
  if (!cleaned) return [""];
  if (cleaned.length <= limit) return [cleaned];

  const blocks = cleaned.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const pages: string[] = [];
  let current = "";

  const flush = () => {
    if (current.trim().length > 0) pages.push(current.trim());
    current = "";
  };

  for (const block of blocks) {
    if (block.length > limit) {
      flush();
      for (let i = 0; i < block.length; i += limit) {
        pages.push(block.slice(i, i + limit).trim());
      }
      continue;
    }

    const next = current ? `${current}\n\n${block}` : block;
    if (next.length > limit) {
      flush();
      current = block;
    } else {
      current = next;
    }
  }

  flush();
  return pages;
}

export async function safeDefer(
  interaction: { deferReply: (opts?: { ephemeral?: boolean }) => Promise<unknown> },
  opts?: { ephemeral?: boolean }
): Promise<boolean> {
  try {
    await interaction.deferReply(opts);
    return true;
  } catch {
    return false;
  }
}

export async function replyEphemeralPages(
  interaction: {
    reply: (opts: { content: string; ephemeral?: boolean }) => Promise<unknown>;
    followUp: (opts: { content: string; ephemeral?: boolean }) => Promise<unknown>;
  },
  pages: string[]
): Promise<void> {
  const safePages = pages.map((p) => clampDiscordMessage(p)).filter((p) => p.length > 0);
  if (safePages.length === 0) {
    await interaction.reply({ content: "Listo.", ephemeral: true });
    return;
  }

  await interaction.reply({ content: safePages[0]!, ephemeral: true });
  for (const page of safePages.slice(1)) {
    await interaction.followUp({ content: page, ephemeral: true });
  }
}

export function humanizeMessageContent(message: unknown, content: string): string {
  const msg = message as {
    author?: { username?: string };
    member?: { displayName?: string } | null;
    mentions?: {
      users?: Map<string, { username?: string }>;
      members?: Map<string, { displayName?: string }>;
    };
  };

  const authorName = msg.member?.displayName ?? msg.author?.username ?? "usuario";
  const users = msg.mentions?.users;
  const members = msg.mentions?.members;

  const replaced = content.replace(/<@!?(?<id>\d{17,20})>/g, (_m, id: string) => {
    const display = members?.get(id)?.displayName;
    const username = users?.get(id)?.username;
    const name = display ?? username;
    return name ? `@${name}` : "@usuario";
  });

  return `@${authorName}: ${replaced}`.trim();
}
