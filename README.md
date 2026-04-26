<div align="center">
  
  <img src="./assets/img/michito-bot-pixel.png" alt="Avatar Pixel Art de Michito Bot" width="200" height="200">

  <h1>Michito Bot</h1>

  <p align="center">
    <img alt="Discord.js" src="https://img.shields.io/badge/Discord.js-5865F2?style=for-the-badge&logo=discord&logoColor=white" />
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
    <img alt="Node.js" src="https://img.shields.io/badge/Node.js-5FA04E?style=for-the-badge&logo=nodedotjs&logoColor=white" />
    <img alt="Next.js" src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  </p>
  
  <p align="center">
    <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
    <img alt="Prisma" src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" />
    <img alt="Redis" src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
    <img alt="Docker" src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
  </p>
  
  <p align="center">
    <img alt="pnpm" src="https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white" />
    <img alt="Ollama" src="https://img.shields.io/badge/Ollama-111111?style=for-the-badge&logo=ollama&logoColor=white" />
    <img alt="Turborepo" src="https://img.shields.io/badge/Turborepo-EF4444?style=for-the-badge&logo=turborepo&logoColor=white" />
  </p>

  <hr>
</div>


## 🐾 About Michito Bot

Michito Bot is an open-source Discord bot built with TypeScript for communities that want a playful assistant with a cat-like personality, lightweight per-server “training” (memory), and a solid foundation for future fine-tuning (LoRA).

Michito Bot is built to support:

- Slash commands for explicit actions (chat, memory, tooling)
- Ambient chat replies (keyword triggers) for a more “alive” assistant
- Per-server isolated memory via `/train` (JSONL on disk), plus optional per-user rules
- AI integration via local Ollama models (or other providers in the future)
- Fine-tune/LoRA-ready data collection and export (conversation JSONL)
- Modular monorepo architecture designed for growth

## ✨ Features

- 🐱 Cat-inspired personality that can be shaped per server with `/train`
- ⚡ Slash commands for “intentional” actions, plus trigger-based conversational replies
- 🧠 Local Ollama model support (bring your own Modelfile + model tag)
- 🗂️ Per-server isolated memory and optional per-user personalization
- 🧪 Fine-tuning pipeline readiness (collect examples, export a chat dataset)
- 🧩 Modular monorepo structure and multi-server scalability

## 🚀 Local Setup

### Requirements

- Node.js 24 (recommended via nvm)
- pnpm (via Corepack)
- PostgreSQL 17+
- pgvector extension available for your PostgreSQL version
- Optional: Docker (only if you want to use `pnpm infra:up`)

### Node + pnpm

```bash
nvm install 24
nvm use 24

corepack enable
corepack prepare pnpm@9.15.5 --activate

pnpm install
```

### Database (PostgreSQL + pgvector)

If you use Homebrew PostgreSQL, make sure `psql` is on your PATH:

```bash
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"
psql --version
```

Create your development databases and enable pgvector in both the main DB and the shadow DB:

```bash
psql -d postgres -c "CREATE DATABASE michito;"
psql -d postgres -c "CREATE DATABASE michito_shadow;"

psql -d michito -c "CREATE EXTENSION IF NOT EXISTS vector;"
psql -d michito_shadow -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### Environment variables

Copy the example file and edit as needed:

```bash
cp .env.example .env
```

Important variables:

- `DATABASE_URL`: main development database
- `SHADOW_DATABASE_URL`: shadow database used by `prisma migrate dev`

Example:

```env
DATABASE_URL=postgresql://<user>@localhost:5432/michito?schema=public
SHADOW_DATABASE_URL=postgresql://<user>@localhost:5432/michito_shadow?schema=public
```

Note: the `?schema=public` parameter is used by Prisma. If you test connectivity with `psql`, omit the `?schema=...` query parameter.

### Prisma (migrations + client)

```bash
pnpm --filter @michito/db exec prisma migrate reset --force
pnpm --filter @michito/db exec prisma migrate dev --name init
pnpm --filter @michito/db db:generate
```

### Dev commands

```bash
pnpm dev
```

## 🧳 Replicating On Another Laptop (Easiest Way)

Recommendation: run infrastructure (PostgreSQL + pgvector + Redis) via Docker, and run the bot with local Node.

### Requirements

- Node.js 24 (via nvm)
- pnpm (via Corepack)
- Docker Desktop

### Steps

```bash
nvm install 24
nvm use 24

corepack enable
corepack prepare pnpm@9.15.5 --activate

pnpm install
cp .env.example .env
```

Fill in at least these variables in `.env`:

- `DISCORD_BOT_TOKEN`
- `DISCORD_CLIENT_ID`
- `DISCORD_DEV_GUILD_ID` (your test server Guild ID)

Start infrastructure with Docker:

```bash
pnpm infra:up
```

Initialize Prisma:

```bash
pnpm --filter @michito/db exec prisma migrate dev --name init
pnpm --filter @michito/db db:generate
```

Start the bot:

```bash
pnpm --filter @michito/bot dev
```

### Inviting The Bot To A Server (Dev)

In the Discord Developer Portal:

- OAuth2 → URL Generator
- Scopes: `bot` + `applications.commands`
- Permissions: only what you need for what you want to test

### Commands (Guild vs Global)

- Dev (guild commands, instant updates): `pnpm --filter @michito/bot dev` + `DISCORD_DEV_GUILD_ID` in `.env`.
- Global (available in all servers): `NODE_ENV=production pnpm --filter @michito/bot dev` or `DISCORD_COMMANDS_SCOPE=global pnpm --filter @michito/bot dev`.
