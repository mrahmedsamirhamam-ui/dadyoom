"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type SpeechStatus =
  | "idle"
  | "speaking"
  | "paused"
  | "error";

type SpeakOptions = {
  rate?: number;
  pitch?: number;
  volume?: number;
};

function findArabicVoice(
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  const arabicVoices = voices.filter((voice) =>
    voice.lang.toLowerCase().startsWith("ar")
  );

  if (arabicVoices.length === 0) {
    return null;
  }

  const preferredNames = [
    "maged",
    "tarik",
    "hoda",
    "zeina",
    "ar-sa",
    "ar-eg",
  ];

  return (
    arabicVoices.find((voice) => {
      const searchableVoice =
        `${voice.name} ${voice.lang}`.toLowerCase();

      return preferredNames.some((name) =>
        searchableVoice.includes(name)
      );
    }) ??
    arabicVoices[0] ??
    null
  );
}

export function useArabicSpeech() {
  const [voices, setVoices] = useState<
    SpeechSynthesisVoice[]
  >([]);

  const [status, setStatus] =
    useState<SpeechStatus>("idle");

  const [error, setError] = useState("");

  const [isMounted] = useState(() => typeof window !== "undefined");

  const [isSupported] = useState(() => typeof window !== "undefined");

  useEffect(() => {

    const supported =
      "speechSynthesis" in window &&
      "SpeechSynthesisUtterance" in window;

    if (!supported) {
      return;
    }

    const synthesis = window.speechSynthesis;

    function loadVoices() {
      setVoices(synthesis.getVoices());
    }

    loadVoices();

    synthesis.addEventListener(
      "voiceschanged",
      loadVoices
    );

    return () => {
      synthesis.removeEventListener(
        "voiceschanged",
        loadVoices
      );

      synthesis.cancel();
    };
  }, []);

  const arabicVoice = useMemo(
    () => findArabicVoice(voices),
    [voices]
  );

  const stop = useCallback(() => {
    if (!isSupported) {
      return;
    }

    window.speechSynthesis.cancel();
    setStatus("idle");
  }, [isSupported]);

  const pause = useCallback(() => {
    if (!isSupported) {
      return;
    }

    window.speechSynthesis.pause();
    setStatus("paused");
  }, [isSupported]);

  const resume = useCallback(() => {
    if (!isSupported) {
      return;
    }

    window.speechSynthesis.resume();
    setStatus("speaking");
  }, [isSupported]);

  const speak = useCallback(
    (
      text: string,
      options: SpeakOptions = {}
    ) => {
      if (!isSupported) {
        setError(
          "هذا المتصفح لا يدعم تشغيل الصوت."
        );
        setStatus("error");
        return;
      }

      const cleanText = text.trim();

      if (!cleanText) {
        setError("لا يوجد نص لقراءته.");
        return;
      }

      const synthesis =
        window.speechSynthesis;

      synthesis.cancel();

      const utterance =
        new SpeechSynthesisUtterance(
          cleanText
        );

      utterance.lang =
        arabicVoice?.lang ?? "ar-SA";

      if (arabicVoice) {
        utterance.voice = arabicVoice;
      }

      utterance.rate =
        options.rate ?? 0.9;

      utterance.pitch =
        options.pitch ?? 1;

      utterance.volume =
        options.volume ?? 1;

      utterance.onstart = () => {
        setError("");
        setStatus("speaking");
      };

      utterance.onpause = () => {
        setStatus("paused");
      };

      utterance.onresume = () => {
        setStatus("speaking");
      };

      utterance.onend = () => {
        setStatus("idle");
      };

      utterance.onerror = (event) => {
        if (
          event.error === "canceled" ||
          event.error === "interrupted"
        ) {
          setStatus("idle");
          return;
        }

        console.error(
          "Arabic speech error:",
          event.error
        );

        setError(
          "تعذر تشغيل صوت ضاد الآن."
        );
        setStatus("error");
      };

      synthesis.speak(utterance);
    },
    [arabicVoice, isSupported]
  );

  return {
    speak,
    stop,
    pause,
    resume,
    status,
    error,
    isMounted,
    isSupported,
    isSpeaking:
      status === "speaking",
    isPaused:
      status === "paused",
    voiceName:
      arabicVoice?.name ?? null,
  };
}