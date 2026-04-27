import { OllamaLlmProvider } from "@michito/ai";
import { config } from "../config.js";

export const llm = new OllamaLlmProvider({
  baseUrl: config.ollamaBaseUrl,
  model: config.ollamaModel
});
