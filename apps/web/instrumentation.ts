/**
 * Next.js instrumentation hook — runs once at server startup.
 *
 * The bot and worker apps explicitly load the monorepo's root `.env`. The web app
 * normally only sees env files in `apps/web/`, so `@michito/db` (which requires
 * `DATABASE_URL`) would fail at first import. This hook bridges the gap so the
 * web demo and the rest of the workspace share a single `.env`.
 *
 * NOTE: Webpack errors on `node:` scheme imports inside instrumentation.ts, so we
 * avoid `node:path` and rely on string concat — `process.cwd()` returns the apps/web
 * dir at runtime, so `../../.env` is the monorepo root.
 */
export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    process.loadEnvFile(`${process.cwd()}/../../.env`);
  } catch (err) {
    console.warn("instrumentation: failed to load root .env", err);
  }
}
