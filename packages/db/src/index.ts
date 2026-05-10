import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";

export type DatabaseEnv = {
  DATABASE_URL: string;
  NODE_ENV?: string;
};

export function getDatabaseUrl(env: Partial<DatabaseEnv> = process.env): string {
  const url = env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  return url;
}

type GlobalWithPrisma = typeof globalThis & {
  __michitoPrisma?: PrismaClient;
};

const globalForPrisma = globalThis as GlobalWithPrisma;

let _instance: PrismaClient | undefined;

function ensurePrisma(): PrismaClient {
  if (_instance) return _instance;
  if (globalForPrisma.__michitoPrisma) {
    _instance = globalForPrisma.__michitoPrisma;
    return _instance;
  }
  _instance = new PrismaClient({
    adapter: new PrismaPg({ connectionString: getDatabaseUrl() }),
  });
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.__michitoPrisma = _instance;
  }
  return _instance;
}

/**
 * Lazy Prisma proxy — defers construction (and DATABASE_URL lookup) until first use.
 * Without this, importing `@michito/db` in environments that load env late (Next.js
 * route modules, test runners, lint runners) throws at module-load time.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const real = ensurePrisma();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export { PrismaClient };

export * as petRepo from "./petRepo.js";
export * as trainingRuleRepo from "./trainingRuleRepo.js";
export { TICK_INTERVAL_MIN } from "./petRepo.js";
export { InvalidRuleError, RULE_MAX_LENGTH, ACTIVE_RULES_LIMIT, validateRuleText } from "./trainingRuleRepo.js";
