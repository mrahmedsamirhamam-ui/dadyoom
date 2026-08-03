export type DadMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type DadBrainRequest = {
  message: string;
  history?: DadMessage[];
  pageTitle?: string;
  pageContext?: string;
  lessonId?: string;
  studentLevel?: string;
  [key: string]: unknown;
};

export type DadBrainResponse = {
  reply: string;
};

export default class DadBrain {
  async ask(input: DadBrainRequest): Promise<DadBrainResponse> {
    const response = await fetch("/api/dad/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const data = await response.json() as DadBrainResponse | { error?: string };

    if (!response.ok) {
      throw new Error("error" in data && data.error ? data.error : "تعذر الحصول على رد من ضاد.");
    }

    if (!("reply" in data) || typeof data.reply !== "string") {
      throw new Error("رد Gemini غير صالح.");
    }

    return data;
  }
}
