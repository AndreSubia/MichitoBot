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

export const prisma: PrismaClient =
  globalForPrisma.__michitoPrisma ??
  new PrismaClient({ adapter: new PrismaPg({ connectionString: getDatabaseUrl() }) });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__michitoPrisma = prisma;
}

export { PrismaClient };
