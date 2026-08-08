import path from "node:path";
import dotenv from "dotenv";
import { createAIProvider } from "./providers";

dotenv.config({
  path: path.join(process.cwd(), ".env.local"),
  quiet: true,
});

export async function askAI(
  prompt: string
): Promise<string> {
  const provider = createAIProvider();

  return provider.generate(prompt);
}