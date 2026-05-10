/**
 * One-shot migration: read data/style_rules.jsonl and insert into TrainingRule.
 *
 * Usage:
 *   pnpm --filter @michito/db tsx scripts/migrate-jsonl-rules.ts [--guild=<id>] [--file=<path>] [--dry-run]
 */
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const here = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(here, "../../../.env") });

const { prisma, validateRuleText, InvalidRuleError } = await import("../src/index.js");

interface JsonlRule {
  id?: string;
  text?: string;
  guildId?: string;
  ts?: string;
  createdAt?: string;
  userId?: string;
  ownerUserId?: string;
}

const args = new Map<string, string>();
for (const raw of process.argv.slice(2)) {
  const [key, value] = raw.replace(/^--/, "").split("=", 2);
  if (key) args.set(key, value ?? "true");
}

const defaultGuildId = process.env.WEB_DEMO_GUILD_ID ?? "demo";
const guildId = args.get("guild") ?? defaultGuildId;
const filePath = resolve(args.get("file") ?? resolve(process.cwd(), "../../data/style_rules.jsonl"));
const dryRun = args.get("dry-run") === "true";

async function main() {
  if (!existsSync(filePath)) {
    console.log(`No JSONL file at ${filePath}; nothing to migrate.`);
    return;
  }

  const raw = await readFile(filePath, "utf-8");
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);

  let inserted = 0;
  let skippedInvalid = 0;
  let skippedDuplicate = 0;
  let skippedOther = 0;

  for (const line of lines) {
    let parsed: JsonlRule;
    try {
      parsed = JSON.parse(line) as JsonlRule;
    } catch {
      skippedInvalid += 1;
      continue;
    }

    const text = (parsed.text ?? "").trim();
    if (!text) {
      skippedOther += 1;
      continue;
    }

    let cleaned: string;
    try {
      cleaned = validateRuleText(text);
    } catch (err) {
      if (err instanceof InvalidRuleError) {
        skippedInvalid += 1;
        continue;
      }
      throw err;
    }

    const targetGuild = parsed.guildId && parsed.guildId !== "dm" ? parsed.guildId : guildId;
    const createdById = parsed.userId ?? parsed.ownerUserId ?? "jsonl-import";

    const exists = await prisma.trainingRule.findFirst({
      where: { guildId: targetGuild, text: cleaned },
      select: { id: true },
    });
    if (exists) {
      skippedDuplicate += 1;
      continue;
    }

    if (!dryRun) {
      await prisma.trainingRule.create({
        data: {
          guildId: targetGuild,
          createdById,
          text: cleaned,
          isActive: true,
        },
      });
    }
    inserted += 1;
  }

  console.log(
    `migrate-jsonl-rules · file=${filePath} guildIdFallback=${guildId} dryRun=${dryRun}\n` +
      `  inserted=${inserted} skippedDuplicate=${skippedDuplicate} skippedInvalid=${skippedInvalid} skippedOther=${skippedOther}`,
  );
}

await main();
await prisma.$disconnect();
