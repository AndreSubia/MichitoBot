import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).optional()
});

export type Env = z.infer<typeof envSchema>;

export * from "./petStats.js";
