import { existsSync } from "node:fs";
import { readFile, appendFile, writeFile, mkdir } from "node:fs/promises";
import { StyleRule, TrainExample } from "../types/index.js";
import { config } from "../config.js";

export async function ensureDataDir(): Promise<void> {
  await mkdir(config.paths.dataDir, { recursive: true });
}

export async function appendJsonl(path: string, value: unknown): Promise<void> {
  const line = `${JSON.stringify(value)}\n`;
  await appendFile(path, line, { encoding: "utf8" });
}

export async function loadLastRulesForContext({
  limit,
  guildId,
  targetUserId
}: {
  limit: number;
  guildId: string;
  targetUserId: string;
}): Promise<StyleRule[]> {
  const path = config.paths.rulesPath;
  if (!existsSync(path)) return [];
  const raw = await readFile(path, { encoding: "utf8" }).catch(() => "");
  const lines = raw.split("\n").filter((l) => l.trim().length > 0);
  const userRules: StyleRule[] = [];
  const globalRules: StyleRule[] = [];

  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i];
    if (!line) continue;
    try {
      const obj = JSON.parse(line) as StyleRule;
      if (!obj || typeof obj.text !== "string" || obj.text.trim().length === 0) continue;
      if (obj.guildId !== guildId) continue;

      if (obj.targetUserId && obj.targetUserId === targetUserId) {
        userRules.push(obj);
      } else if (!obj.targetUserId) {
        globalRules.push(obj);
      }

      if (userRules.length + globalRules.length >= limit * 3) break;
    } catch {
      continue;
    }
  }

  return [...userRules, ...globalRules].slice(0, limit);
}

export function buildProfileText(rules: StyleRule[]): string | undefined {
  if (rules.length === 0) return undefined;
  const bullets = rules
    .slice(0, 10)
    .map((r) => r.text.trim())
    .filter((t) => t.length > 0)
    .map((t) => (t.length > 140 ? `${t.slice(0, 140)}…` : t))
    .map((t) => `- ${t}`);

  if (bullets.length === 0) return undefined;
  return `PREFERENCIAS ACTUALES (síguelas):\n${bullets.join("\n")}`;
}

export async function loadProfileSummary({
  limit,
  guildId
}: {
  limit: number;
  guildId: string;
}): Promise<string> {
  const path = config.paths.rulesPath;
  if (!existsSync(path)) return "No hay reglas guardadas.";
  const raw = await readFile(path, { encoding: "utf8" }).catch(() => "");
  const lines = raw.split("\n").filter((l) => l.trim().length > 0);
  const rules: StyleRule[] = [];
  for (const line of lines) {
    try {
      const obj = JSON.parse(line) as StyleRule;
      if (!obj || obj.guildId !== guildId) continue;
      if (typeof obj.text === "string" && obj.text.trim().length === 0) rules.push(obj);
      rules.push(obj);
    } catch {
      continue;
    }
  }

  if (rules.length === 0) return "No hay reglas guardadas.";
  const last = rules.slice(-limit);
  const bullets = last
    .map((r) =>
      r.targetUserTag
        ? `[${r.targetUserTag}] ${r.text.trim()}`
        : r.targetUserId
          ? `[user:${r.targetUserId}] ${r.text.trim()}`
          : r.text.trim()
    )
    .filter((t) => t.length > 0)
    .map((t) => (t.length > 140 ? `${t.slice(0, 140)}…` : t))
    .map((t) => `- ${t}`);
  const extra = rules.length > limit ? `\n(+${rules.length - limit} más)` : "";
  return `Reglas actuales (${Math.min(limit, rules.length)}/${rules.length}):\n${bullets.join("\n")}${extra}`;
}

export async function forgetRulesByQuery({
  query,
  guildId
}: {
  query: string;
  guildId: string;
}): Promise<
  { status: "ok"; removed: number; remainingInGuild: number } | { status: "no_file" }
> {
  const path = config.paths.rulesPath;
  if (!existsSync(path)) return { status: "no_file" };
  const q = query.toLowerCase();
  const raw = await readFile(path, { encoding: "utf8" }).catch(() => "");
  const lines = raw.split("\n").filter((l) => l.trim().length > 0);

  const kept: string[] = [];
  let removed = 0;
  let remainingInGuild = 0;

  for (const line of lines) {
    try {
      const obj = JSON.parse(line) as StyleRule;
      const text = typeof obj?.text === "string" ? obj.text : "";
      if (obj?.guildId === guildId && text.toLowerCase().includes(q)) {
        removed += 1;
      } else {
        kept.push(JSON.stringify(obj));
        if (obj?.guildId === guildId && typeof obj.text === "string" && obj.text.trim().length > 0) {
          remainingInGuild += 1;
        }
      }
    } catch {
      kept.push(line);
    }
  }

  const next = kept.length ? `${kept.join("\n")}\n` : "";
  await writeFile(path, next, { encoding: "utf8" });
  return { status: "ok", removed, remainingInGuild };
}

export async function exportFineTuneDataset({
  systemPrompt
}: {
  systemPrompt: string;
}): Promise<void> {
  const examplesPath = config.paths.examplesPath;
  const outPath = config.paths.finetunePath;

  await ensureDataDir();
  if (!existsSync(examplesPath)) {
    console.log("export finetune: no examples file, nothing to export");
    await writeFile(outPath, "", { encoding: "utf8" });
    return;
  }

  const raw = await readFile(examplesPath, { encoding: "utf8" }).catch(() => "");
  const lines = raw.split("\n").filter((l) => l.trim().length > 0);
  const examples: TrainExample[] = [];

  for (const line of lines) {
    try {
      const obj = JSON.parse(line) as TrainExample;
      if (!obj || typeof obj.prompt !== "string" || typeof obj.ideal !== "string") continue;
      examples.push(obj);
    } catch {
      continue;
    }
  }

  const rules = await loadLastRules({ limit: 10 }).catch(() => []);
  const profileFallback = buildProfileText(rules);

  const outLines: string[] = [];
  for (const ex of examples) {
    const sys = (ex.system ?? systemPrompt).trim();
    const profile = (ex.profile ?? profileFallback)?.trim() ?? "";
    const systemContent = [sys, profile].filter((s) => s.trim().length > 0).join("\n\n");
    outLines.push(
      JSON.stringify({
        id: ex.id,
        ts: ex.ts,
        tags: Array.isArray(ex.tags) ? ex.tags : [],
        source: { guildId: ex.guildId, userId: ex.userId },
        messages: [
          ...(systemContent ? [{ role: "system", content: systemContent }] : []),
          { role: "user", content: ex.prompt },
          { role: "assistant", content: ex.ideal }
        ]
      })
    );
  }

  await writeFile(outPath, outLines.length ? `${outLines.join("\n")}\n` : "", { encoding: "utf8" });
  console.log(`export finetune: wrote ${outLines.length} example(s) to ${outPath}`);
}

async function loadLastRules({
  limit
}: {
  limit: number;
}): Promise<StyleRule[]> {
  const path = config.paths.rulesPath;
  if (!existsSync(path)) return [];
  const raw = await readFile(path, { encoding: "utf8" }).catch(() => "");
  const lines = raw.split("\n").filter((l) => l.trim().length > 0);
  const out: StyleRule[] = [];
  for (let i = lines.length - 1; i >= 0 && out.length < limit; i -= 1) {
    const line = lines[i];
    if (!line) continue;
    try {
      const obj = JSON.parse(line) as StyleRule;
      if (obj && typeof obj.text === "string" && obj.text.trim().length > 0) out.push(obj);
    } catch {
      continue;
    }
  }
  return out;
}
