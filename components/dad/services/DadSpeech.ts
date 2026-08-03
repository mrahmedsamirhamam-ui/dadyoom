export default class DadSpeech {
  static async createAudio(text: string): Promise<Blob> {
    const response = await fetch("/api/dad-voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error("تعذر إنشاء صوت ضاد.");
    }

    return response.blob();
  }
}
