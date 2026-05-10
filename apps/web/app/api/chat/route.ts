import { NextResponse } from "next/server";
import { OllamaLlmProvider, buildSystemPrompt, type ChatMessage } from "@michito/ai";
import { trainingRuleRepo } from "@michito/db";

export const dynamic = "force-dynamic";

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "michito:latest";
const DEMO_GUILD_ID = process.env.WEB_DEMO_GUILD_ID ?? "demo";

const llm = new OllamaLlmProvider({
  baseUrl: OLLAMA_URL,
  model: OLLAMA_MODEL,
});

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { messages?: unknown };
    const incoming = body.messages;

    if (!Array.isArray(incoming)) {
      return NextResponse.json({ error: "No se proporcionaron mensajes válidos" }, { status: 400 });
    }

    const messages = incoming as ChatMessage[];
    const rules = await trainingRuleRepo.listActiveRules(DEMO_GUILD_ID, 20);
    const systemMessage = buildSystemPrompt({
      rules: rules.map((r) => ({ text: r.text })),
      guildName: "Web Demo",
    });

    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] /api/chat → ${OLLAMA_MODEL} · ${messages.length} msgs · ${rules.length} rules`);

    const response = await llm.chat({
      messages: [systemMessage, ...messages],
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Chat Error:", error);
    return NextResponse.json(
      {
        error: "Error al conectar con el modelo",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
