"use client";

export type DadVoiceMood =
  | "normal"
  | "thinking"
  | "correct"
  | "encouraging"
  | "celebrating";

type SpeakOptions = {
  mood?: DadVoiceMood;
};

const PREBUILT_AUDIO: Record<string, string> = {
  thinking: "/audio/dad/thinking.mp3",
  correct: "/audio/dad/correct.mp3",
  encouraging: "/audio/dad/encouraging.mp3",
  celebrating: "/audio/dad/celebrating.mp3",
};

let currentAudio: HTMLAudioElement | null = null;
let currentObjectUrl: string | null = null;
let currentController: AbortController | null = null;
let speaking = false;

function cleanupAudio(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }

  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }

  currentController = null;
  speaking = false;
}

export const DadVoice = {
  async speak(
    text: string,
    options: SpeakOptions = {}
  ): Promise<void> {
    const cleanText = text.trim();

    if (!cleanText) {
      return;
    }

    const mood = options.mood ?? "normal";
    const prebuiltAudioUrl = PREBUILT_AUDIO[mood];

    // تشغيل الصوت الجاهز فوراً إذا كان الحالية تعتمد على خيارات محددة سبقت تهيئتها
    if (prebuiltAudioUrl) {
      this.stop();

      const audio = new Audio(prebuiltAudioUrl);
      currentAudio = audio;

      return new Promise<void>((resolve, reject) => {
        audio.onplay = () => {
          speaking = true;

          window.dispatchEvent(
            new Event("dadyoom:voice-start")
          );
        };

        audio.onended = () => {
          window.dispatchEvent(
            new Event("dadyoom:voice-end")
          );

          cleanupAudio();
          resolve();
        };

        audio.onerror = () => {
          window.dispatchEvent(
            new Event("dadyoom:voice-end")
          );

          cleanupAudio();

          reject(
            new Error("تعذر تشغيل صوت ضاد الجاهز.")
          );
        };

        audio.play().catch((error) => {
          cleanupAudio();
          reject(error);
        });
      });
    }

    // جلب الصوت التوليدي في حال عدم وجود ملف جاهز
    this.stop();

    const controller = new AbortController();
    currentController = controller;

    const response = await fetch("/api/dad-voice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: cleanText,
        mood: mood,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const data = await response
        .json()
        .catch(() => null);

      throw new Error(
        data?.error ?? "تعذر تشغيل صوت ضاد."
      );
    }

    const audioBlob = await response.blob();
    const objectUrl = URL.createObjectURL(audioBlob);

    currentObjectUrl = objectUrl;

    const audio = new Audio(objectUrl);
    currentAudio = audio;

    return new Promise<void>((resolve, reject) => {
      audio.onplay = () => {
        speaking = true;

        window.dispatchEvent(
          new Event("dadyoom:voice-start")
        );
      };

      audio.onended = () => {
        window.dispatchEvent(
          new Event("dadyoom:voice-end")
        );

        cleanupAudio();
        resolve();
      };

      audio.onerror = () => {
        window.dispatchEvent(
          new Event("dadyoom:voice-end")
        );

        cleanupAudio();

        reject(
          new Error("تعذر تشغيل الملف الصوتي.")
        );
      };

      audio.play().catch((error) => {
        cleanupAudio();
        reject(error);
      });
    });
  },

  stop(): void {
    currentController?.abort();

    if (speaking) {
      window.dispatchEvent(
        new Event("dadyoom:voice-end")
      );
    }

    cleanupAudio();
  },

  isSpeaking(): boolean {
    return speaking;
  },
};
