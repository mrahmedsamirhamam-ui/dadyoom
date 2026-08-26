import type { AIProvider } from "./base";
import { GeminiProvider } from "./gemini";

export function createAIProvider(): AIProvider {
  return new GeminiProvider();
}
