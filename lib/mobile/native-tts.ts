"use client";

import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { Capacitor } from "@capacitor/core";

const ARABIC_LANGUAGE_CANDIDATES = [
  "ar-SA",
  "ar-EG",
  "ar-AE",
  "ar",
] as const;

let cachedLanguage: string | null = null;

export function isNativeTextToSpeechPlatform(): boolean {
  return (
    typeof window !== "undefined" &&
    Capacitor.isNativePlatform() &&
    ["android", "ios"].includes(Capacitor.getPlatform())
  );
}

async function resolveArabicLanguage(): Promise<string> {
  if (cachedLanguage) {
    return cachedLanguage;
  }

  try {
    const { languages } =
      await TextToSpeech.getSupportedLanguages();

    const normalized = new Map(
      languages.map((language) => [
        language.toLowerCase(),
        language,
      ]),
    );

    for (const candidate of ARABIC_LANGUAGE_CANDIDATES) {
      const exact = normalized.get(candidate.toLowerCase());
      if (exact) {
        cachedLanguage = exact;
        return exact;
      }
    }

    const firstArabic = languages.find((language) =>
      language.toLowerCase().startsWith("ar"),
    );

    if (firstArabic) {
      cachedLanguage = firstArabic;
      return firstArabic;
    }
  } catch (error) {
    console.warn("DADYOOM_NATIVE_TTS_LANGUAGES_FAILED", error);
  }

  cachedLanguage = "ar-SA";
  return cachedLanguage;
}

export async function speakNativeArabic(
  text: string,
  options: {
    rate?: number;
    pitch?: number;
    volume?: number;
  } = {},
): Promise<void> {
  if (!isNativeTextToSpeechPlatform()) {
    throw new Error("NATIVE_TTS_PLATFORM_UNAVAILABLE");
  }

  const cleanText = text.trim();

  if (!cleanText) {
    return;
  }

  const lang = await resolveArabicLanguage();

  await TextToSpeech.stop().catch(() => undefined);

  await TextToSpeech.speak({
    text: cleanText,
    lang,
    rate: options.rate ?? 0.92,
    pitch: options.pitch ?? 1,
    volume: options.volume ?? 1,
    category: "playback",
    queueStrategy: 0,
  });
}

export async function stopNativeArabicSpeech(): Promise<void> {
  if (!isNativeTextToSpeechPlatform()) {
    return;
  }

  await TextToSpeech.stop().catch(() => undefined);
}

export async function nativeArabicTtsStatus() {
  if (!isNativeTextToSpeechPlatform()) {
    return {
      available: false,
      platform: "web",
      language: null,
    };
  }

  const language = await resolveArabicLanguage();

  try {
    const { supported } =
      await TextToSpeech.isLanguageSupported({
        lang: language,
      });

    return {
      available: supported,
      platform: Capacitor.getPlatform(),
      language,
    };
  } catch {
    return {
      available: true,
      platform: Capacitor.getPlatform(),
      language,
    };
  }
}
