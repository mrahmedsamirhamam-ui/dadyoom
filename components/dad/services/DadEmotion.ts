import type { DadState } from "@/services/dad-ai";

export default class DadEmotion {
  static label(state: DadState): string {
    const labels: Record<DadState, string> = {
      idle: "هادئ",
      listening: "مستمع",
      thinking: "يفكر",
      talking: "يتحدث",
      reading: "يقرأ",
      correct: "سعيد",
      encouraging: "مشجع",
      celebrating: "يحتفل",
      error: "متفهم",
    };

    return labels[state];
  }
}
