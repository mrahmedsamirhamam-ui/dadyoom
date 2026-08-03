import type { DadBrainRequest, DadBrainResponse } from "./DadBrain";

export default class GeminiAdapter {
  async send(input: DadBrainRequest): Promise<DadBrainResponse> {
    const response = await fetch("/api/dad/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const data = await response.json() as DadBrainResponse | { error?: string };

    if (!response.ok) {
      throw new Error("error" in data && data.error ? data.error : "فشل الاتصال بـ Gemini.");
    }

    if (!("reply" in data) || typeof data.reply !== "string") {
      throw new Error("رد Gemini غير صالح.");
    }

    return data;
  }
}
