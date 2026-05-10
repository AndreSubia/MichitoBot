export * from "./personalityPrompt.js";

export type ChatRole = "system" | "user" | "assistant" | "tool";

export type ChatMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string }
  | { role: "tool"; toolName: string; content: string };

export type LlmToolCall = {
  id: string;
  name: string;
  argumentsJson: string;
};

export type LlmResponse = {
  content: string;
  toolCalls?: LlmToolCall[];
};

export type LlmChatInput = {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
};

export interface LlmProvider {
  chat(input: LlmChatInput): Promise<LlmResponse>;
}

export type EmbeddingInput = {
  texts: string[];
  model?: string;
};

export interface EmbeddingProvider {
  embed(input: EmbeddingInput): Promise<number[][]>;
}

export type OllamaLlmProviderOptions = {
  baseUrl: string;
  model: string;
};

type OllamaChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type OllamaChatRequest = {
  model: string;
  messages: OllamaChatMessage[];
  stream: false;
  options?: {
    temperature?: number;
  } | undefined;
};

type OllamaChatResponse = {
  message?: { role: string; content: string };
};

export class OllamaLlmProvider implements LlmProvider {
  private readonly baseUrl: string;
  private readonly defaultModel: string;

  constructor(options: OllamaLlmProviderOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.defaultModel = options.model;
  }

  async chat(input: LlmChatInput): Promise<LlmResponse> {
    const url = `${this.baseUrl}/api/chat`;
    const model = input.model ?? this.defaultModel;
    const body: OllamaChatRequest = {
      model,
      messages: input.messages.map(toOllamaMessage),
      stream: false,
      options:
        input.temperature === undefined ? undefined : { temperature: input.temperature }
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos de timeout

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          `Ollama error (${res.status}) (baseUrl=${this.baseUrl}, model=${model}): ${text}`
        );
      }

      const json = (await res.json()) as OllamaChatResponse;
      const content = json.message?.content ?? "";

      return { content };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Ollama request timed out after 60 seconds (model=${model})`);
      }
      throw error;
    }
  }
}

function toOllamaMessage(message: ChatMessage): OllamaChatMessage {
  if (message.role === "tool") {
    return { role: "system", content: `${message.toolName}: ${message.content}` };
  }
  return message;
}
