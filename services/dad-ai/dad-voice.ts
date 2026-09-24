"use client";

import {
  isNativeTextToSpeechPlatform,
  speakNativeArabic,
  stopNativeArabicSpeech,
} from "@/lib/mobile/native-tts";

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

function voiceStart(): void {
  speaking = true;

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new Event("dadyoom:voice-start"),
    );
  }
}

function voiceEnd(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new Event("dadyoom:voice-end"),
    );
  }

  speaking = false;
}

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

async function speakBrowserArabic(text: string): Promise<void> {
  if (
    typeof window === "undefined" ||
    !("speechSynthesis" in window) ||
    !("SpeechSynthesisUtterance" in window)
  ) {
    throw new Error("BROWSER_TTS_UNAVAILABLE");
  }

  await new Promise<void>((resolve, reject) => {
    const synthesis = window.speechSynthesis;
    synthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(text);

    utterance.lang = "ar-SA";
    utterance.rate = 0.92;
    utterance.pitch = 1;
    utterance.volume = 1;

    const arabicVoice = synthesis
      .getVoices()
      .find((voice) =>
        voice.lang
          .toLowerCase()
          .startsWith("ar"),
      );

    if (arabicVoice) {
      utterance.voice = arabicVoice;
      utterance.lang = arabicVoice.lang;
    }

    utterance.onstart = voiceStart;
    utterance.onend = () => {
      voiceEnd();
      resolve();
    };
    utterance.onerror = (event) => {
      voiceEnd();

      if (
        event.error === "canceled" ||
        event.error === "interrupted"
      ) {
        resolve();
        return;
      }

      reject(
        new Error(
          `BROWSER_TTS_${event.error}`,
        ),
      );
    };

    synthesis.speak(utterance);
  });
}

async function playAudioElement(
  audio: HTMLAudioElement,
): Promise<void> {
  currentAudio = audio;

  return new Promise<void>((resolve, reject) => {
    audio.onplay = voiceStart;

    audio.onended = () => {
      voiceEnd();
      cleanupAudio();
      resolve();
    };

    audio.onerror = () => {
      voiceEnd();
      cleanupAudio();
      reject(
        new Error(
          "تعذر تشغيل الملف الصوتي.",
        ),
      );
    };

    audio.play().catch((error) => {
      voiceEnd();
      cleanupAudio();
      reject(error);
    });
  });
}

export const DadVoice = {
  async speak(
    text: string,
    options: SpeakOptions = {},
  ): Promise<void> {
    const cleanText = text.trim();

    if (!cleanText) {
      return;
    }

    const mood = options.mood ?? "normal";

    /*
     * Native Android/iOS must not depend on the Cloudflare TTS route.
     * The app still loads all live data and AI from Dadyoom's server,
     * but speech is synthesized by the phone's native TTS engine.
     */
    if (isNativeTextToSpeechPlatform()) {
      this.stop();
      voiceStart();

      try {
        await speakNativeArabic(cleanText, {
          rate:
            mood === "celebrating"
              ? 1.02
              : mood === "thinking"
                ? 0.88
                : 0.92,
          pitch:
            mood === "celebrating" ||
            mood === "correct"
              ? 1.08
              : 1,
        });
        voiceEnd();
        return;
      } catch (error) {
        voiceEnd();
        console.warn(
          "DADYOOM_NATIVE_TTS_FALLBACK",
          error,
        );
      }
    }

    const prebuiltAudioUrl =
      PREBUILT_AUDIO[mood];

    if (prebuiltAudioUrl) {
      this.stop();

      try {
        await playAudioElement(
          new Audio(prebuiltAudioUrl),
        );
        return;
      } catch (error) {
        console.warn(
          "DADYOOM_PREBUILT_AUDIO_FALLBACK",
          error,
        );
      }
    }

    this.stop();

    const controller =
      new AbortController();
    currentController = controller;

    try {
      const response = await fetch(
        "/api/dad-voice",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            text: cleanText,
            mood,
          }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => null);

        throw new Error(
          data?.error ??
            "تعذر تشغيل صوت ضاد.",
        );
      }

      const audioBlob =
        await response.blob();

      if (!audioBlob.size) {
        throw new Error(
          "خدمة الصوت أعادت ملفًا فارغًا.",
        );
      }

      const objectUrl =
        URL.createObjectURL(audioBlob);

      currentObjectUrl = objectUrl;

      await playAudioElement(
        new Audio(objectUrl),
      );
      return;
    } catch (serverError) {
      if (controller.signal.aborted) {
        return;
      }

      console.warn(
        "DADYOOM_SERVER_TTS_FALLBACK",
        serverError,
      );
    } finally {
      currentController = null;
    }

    await speakBrowserArabic(cleanText);
  },

  stop(): void {
    currentController?.abort();

    void stopNativeArabicSpeech();

    if (
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    ) {
      window.speechSynthesis.cancel();
    }

    if (speaking) {
      voiceEnd();
    }

    cleanupAudio();
  },

  isSpeaking(): boolean {
    return speaking;
  },
};
