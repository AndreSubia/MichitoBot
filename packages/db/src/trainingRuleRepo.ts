import { prisma } from "./index.js";

export const RULE_MAX_LENGTH = 280;
export const ACTIVE_RULES_LIMIT = 20;

const FORBIDDEN_PATTERNS: RegExp[] = [
  /ignore (?:all )?(?:previous|prior|above) instructions?/i,
  /system\s*:/i,
  /<\|.*\|>/,
];

export class InvalidRuleError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "InvalidRuleError";
  }
}

export function validateRuleText(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    throw new InvalidRuleError("Rule text cannot be empty.");
  }
  if (trimmed.length > RULE_MAX_LENGTH) {
    throw new InvalidRuleError(`Rule text must be ${RULE_MAX_LENGTH} characters or fewer.`);
  }
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(trimmed)) {
      throw new InvalidRuleError("Rule text contains a disallowed pattern.");
    }
  }
  return trimmed;
}

export async function listActiveRules(guildId: string, limit = ACTIVE_RULES_LIMIT) {
  return prisma.trainingRule.findMany({
    where: { guildId, isActive: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function listAllRules(guildId: string, limit = 100) {
  return prisma.trainingRule.findMany({
    where: { guildId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function addRule(guildId: string, createdById: string, rawText: string) {
  const text = validateRuleText(rawText);
  return prisma.trainingRule.create({
    data: { guildId, createdById, text, isActive: true },
  });
}

export async function deactivateRule(guildId: string, id: string) {
  const result = await prisma.trainingRule.updateMany({
    where: { id, guildId, isActive: true },
    data: { isActive: false },
  });
  return result.count > 0;
}

export async function countActiveRules(guildId: string) {
  return prisma.trainingRule.count({ where: { guildId, isActive: true } });
}
