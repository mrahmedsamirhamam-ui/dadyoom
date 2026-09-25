"use client";

const ARABIC_LANGUAGE_CANDIDATES = [
  "ar-SA",
  "ar-EG",
  "ar-AE",
  "ar",
] as const;

type CapacitorBridge = {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
};

let cachedLanguage: string | null = null;

function runtimeCapacitor(): CapacitorBridge | null {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    (window as typeof window & {
      Capacitor?: CapacitorBridge;
    }).Capacitor ?? null
  );
}

async function textToSpeechPlugin() {
  const ttsModule =
    await import(
      "@capacitor-community/text-to-speech"
    );

  return ttsModule.TextToSpeech;
}

async function nativePlatform(): Promise<string> {
  const bridge = runtimeCapacitor();
  const runtimePlatform =
    bridge?.getPlatform?.();

  if (runtimePlatform) {
    return runtimePlatform;
  }

  try {
    const { Capacitor } =
      await import("@capacitor/core");

    return Capacitor.getPlatform();
  } catch {
    return "web";
  }
}

export function isNativeTextToSpeechPlatform(): boolean {
  const capacitor = runtimeCapacitor();

  if (!capacitor) {
    return false;
  }

  const platform =
    capacitor.getPlatform?.() ?? "";

  return (
    capacitor.isNativePlatform?.() === true &&
    ["android", "ios"].includes(platform)
  );
}

async function resolveArabicLanguage(): Promise<string> {
  if (cachedLanguage) {
    return cachedLanguage;
  }

  try {
    const TextToSpeech =
      await textToSpeechPlugin();

    const { languages } =
      await TextToSpeech.getSupportedLanguages();

    const normalized = new Map(
      languages.map((language) => [
        language.toLowerCase(),
        language,
      ]),
    );

    for (const candidate of ARABIC_LANGUAGE_CANDIDATES) {
      const exact =
        normalized.get(candidate.toLowerCase());

      if (exact) {
        cachedLanguage = exact;
        return exact;
      }
    }

    const firstArabic =
      languages.find((language) =>
        language
          .toLowerCase()
          .startsWith("ar"),
      );

    if (firstArabic) {
      cachedLanguage = firstArabic;
      return firstArabic;
    }
  } catch (error) {
    console.warn(
      "DADYOOM_NATIVE_TTS_LANGUAGES_FAILED",
      error,
    );
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
    throw new Error(
      "NATIVE_TTS_PLATFORM_UNAVAILABLE",
    );
  }

  const cleanText = text.trim();

  if (!cleanText) {
    return;
  }

  const TextToSpeech =
    await textToSpeechPlugin();
  const lang =
    await resolveArabicLanguage();

  await TextToSpeech.stop().catch(
    () => undefined,
  );

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

  try {
    const TextToSpeech =
      await textToSpeechPlugin();

    await TextToSpeech.stop().catch(
      () => undefined,
    );
  } catch {
    // Native TTS is optional on web/server paths.
  }
}

export async function nativeArabicTtsStatus() {
  if (!isNativeTextToSpeechPlatform()) {
    return {
      available: false,
      platform: "web",
      language: null,
    };
  }

  const language =
    await resolveArabicLanguage();
  const platform =
    await nativePlatform();

  try {
    const TextToSpeech =
      await textToSpeechPlugin();

    const { supported } =
      await TextToSpeech.isLanguageSupported({
        lang: language,
      });

    return {
      available: supported,
      platform,
      language,
    };
  } catch {
    return {
      available: true,
      platform,
      language,
    };
  }
}
