import { askDadyoomHybrid } from "@/lib/mobile/hybrid-ai";

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
  lessonTitle?: string;
  lessonContent?: string;
  studentLevel?: string;
  mode?: "chat" | "check-understanding" | "lesson-completed";
  [key: string]: unknown;
};

export type DadBrainResponse = {
  reply: string;
};

export default class DadBrain {
  async ask(
    input: DadBrainRequest,
    options: {
      signal?: AbortSignal;
    } = {},
  ): Promise<DadBrainResponse> {
    if (options.signal?.aborted) {
      throw new DOMException(
        "Aborted",
        "AbortError",
      );
    }

    const result = await askDadyoomHybrid(
      input.message,
      input,
    );

    if (options.signal?.aborted) {
      throw new DOMException(
        "Aborted",
        "AbortError",
      );
    }

    return {
      reply: result.text,
    };
  }
}
