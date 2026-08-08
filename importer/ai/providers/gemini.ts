import { GoogleGenAI } from "@google/genai";
import type { AIProvider } from "./base";

type GeminiConfig = {
  apiKey: string;
  model: string;
};

function getGeminiConfigs(): GeminiConfig[] {
  const primaryKey =
    process.env.GEMINI_API_KEY?.trim();

  const backupKey =
    process.env.GEMINI_API_KEY_BACKUP?.trim();

  const primaryModel =
    process.env.GEMINI_MODEL?.trim() ||
    "gemini-3.6-flash";

  const backupModel =
    process.env.GEMINI_MODEL_BACKUP?.trim() ||
    "gemini-2.5-flash";

  const configs: GeminiConfig[] = [];

  if (primaryKey) {
    configs.push({
      apiKey: primaryKey,
      model: primaryModel,
    });
  }

  if (
    backupKey &&
    backupKey !== primaryKey
  ) {
    configs.push({
      apiKey: backupKey,
      model: backupModel,
    });
  }

  if (configs.length === 0) {
    throw new Error(
      "لا يوجد مفتاح Gemini داخل .env.local"
    );
  }

  return configs;
}

function isRetryableError(
  error: unknown
): boolean {
  if (
    typeof error !== "object" ||
    error === null
  ) {
    return false;
  }

  const status =
    "status" in error
      ? Number(error.status)
      : null;

  const message =
    "message" in error &&
    typeof error.message === "string"
      ? error.message.toLowerCase()
      : "";

  return (
    status === 429 ||
    status === 500 ||
    status === 503 ||
    message.includes("resource_exhausted") ||
    message.includes("fetch failed") ||
    message.includes("timeout")
  );
}

export class GeminiProvider
  implements AIProvider
{
  async generate(
    prompt: string
  ): Promise<string> {
    const configs =
      getGeminiConfigs();

    let lastError: unknown;

    for (
      let index = 0;
      index < configs.length;
      index += 1
    ) {
      const config = configs[index];

      try {
        console.log(
          `Gemini attempt ${index + 1}/${configs.length} using ${config.model}`
        );

        const client = new GoogleGenAI({
          apiKey: config.apiKey,
        });

        const response =
          await client.models.generateContent({
            model: config.model,
            contents: prompt,
          });

        const text =
          response.text?.trim();

        if (!text) {
          throw new Error(
            "Gemini returned an empty response."
          );
        }

        return text;
      } catch (error) {
        lastError = error;

        console.error(
          `Gemini provider ${index + 1} failed.`
        );

        if (!isRetryableError(error)) {
          throw error;
        }

        if (
          index < configs.length - 1
        ) {
          console.log(
            "Switching to Gemini backup..."
          );
        }
      }
    }

    throw lastError;
  }
}