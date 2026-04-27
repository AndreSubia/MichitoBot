import { NextResponse } from "next/server";
import { OllamaLlmProvider } from "@michito/ai";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "michito:latest";

const llm = new OllamaLlmProvider({
  baseUrl: OLLAMA_URL,
  model: OLLAMA_MODEL,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body.messages;

    if (!messages || !Array.isArray(messages)) {
      console.error("Invalid messages received:", body);
      return NextResponse.json({ error: "No se proporcionaron mensajes válidos" }, { status: 400 });
    }

    // Intentar cargar reglas para el contexto del demo
    const rulesPath = join(process.cwd(), "../../data/style_rules.jsonl");
    let systemPrompt = "Eres Michito, un gato asistente amigable y juguetón.";
    
    if (existsSync(rulesPath)) {
      try {
        const content = await readFile(rulesPath, "utf-8");
        const rules = content.split("\n")
          .filter(Boolean)
          .map(line => {
            try {
              return JSON.parse(line);
            } catch {
              return null;
            }
          })
          .filter(r => r !== null)
          .slice(-5); // Solo las últimas 5 reglas
        
        if (rules.length > 0) {
          systemPrompt += "\n\nREGLAS ACTUALES:\n" + rules.map(r => `- ${r.text}`).join("\n");
        }
      } catch (err) {
        console.error("Error reading rules file:", err);
      }
    }

    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] Chat request to model: ${OLLAMA_MODEL} with ${messages.length} messages`);

    const response = await llm.chat({
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ]
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Chat Error:", error);
    return NextResponse.json({ 
      error: "Error al conectar con el modelo",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
