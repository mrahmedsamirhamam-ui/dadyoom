"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  isNativeTextToSpeechPlatform,
  speakNativeArabic,
  stopNativeArabicSpeech,
} from "@/lib/mobile/native-tts";

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
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
  const arabicVoices =
    voices.filter((voice) =>
      voice.lang
        .toLowerCase()
        .startsWith("ar"),
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
      const searchable =
        `${voice.name} ${voice.lang}`
          .toLowerCase();

      return preferredNames.some(
        (name) =>
          searchable.includes(name),
      );
    }) ??
    arabicVoices[0] ??
    null
  );
}

export function useArabicSpeech() {
  const [voices, setVoices] =
    useState<SpeechSynthesisVoice[]>(
      [],
    );
  const [status, setStatus] =
    useState<SpeechStatus>("idle");
  const [error, setError] =
    useState("");

  const audioRef =
    useRef<HTMLAudioElement | null>(
      null,
    );
  const audioUrlRef =
    useRef<string | null>(null);

  const isMounted = true;
  const isSupported = true;

  const browserSpeechSupported =
    useMemo(
      () =>
        typeof window !==
          "undefined" &&
        "speechSynthesis" in
          window &&
        "SpeechSynthesisUtterance" in
          window,
      [],
    );

  useEffect(() => {
    if (
      !browserSpeechSupported
    ) {
      return;
    }

    const synthesis =
      window.speechSynthesis;

    function loadVoices() {
      setVoices(
        synthesis.getVoices(),
      );
    }

    loadVoices();

    synthesis.addEventListener(
      "voiceschanged",
      loadVoices,
    );

    return () => {
      synthesis.removeEventListener(
        "voiceschanged",
        loadVoices,
      );
      synthesis.cancel();
    };
  }, [browserSpeechSupported]);

  const arabicVoice =
    useMemo(
      () =>
        findArabicVoice(voices),
      [voices],
    );

  const releaseServerAudio =
    useCallback(() => {
      const audio =
        audioRef.current;

      if (audio) {
        audio.pause();
        audio.src = "";
        audioRef.current = null;
      }

      if (audioUrlRef.current) {
        URL.revokeObjectURL(
          audioUrlRef.current,
        );
        audioUrlRef.current =
          null;
      }
    }, []);

  const stop =
    useCallback(() => {
      releaseServerAudio();
      void stopNativeArabicSpeech();

      if (
        typeof window !==
          "undefined" &&
        "speechSynthesis" in
          window
      ) {
        window.speechSynthesis
          .cancel();
      }

      setStatus("idle");
    }, [releaseServerAudio]);

  const playBrowserSpeech =
    useCallback(
      async (
        cleanText: string,
        options: SpeakOptions,
      ) => {
        if (
          !browserSpeechSupported
        ) {
          throw new Error(
            "Web Speech غير متاح.",
          );
        }

        await new Promise<void>(
          (resolve, reject) => {
            const synthesis =
              window.speechSynthesis;

            synthesis.cancel();

            const utterance =
              new SpeechSynthesisUtterance(
                cleanText,
              );

            utterance.lang =
              arabicVoice?.lang ??
              "ar-SA";

            if (arabicVoice) {
              utterance.voice =
                arabicVoice;
            }

            utterance.rate =
              options.rate ?? 0.9;
            utterance.pitch =
              options.pitch ?? 1;
            utterance.volume =
              options.volume ?? 1;

            utterance.onstart =
              () => {
                setError("");
                setStatus(
                  "speaking",
                );
              };

            utterance.onpause =
              () =>
                setStatus(
                  "paused",
                );

            utterance.onresume =
              () =>
                setStatus(
                  "speaking",
                );

            utterance.onend =
              () => {
                setStatus("idle");
                resolve();
              };

            utterance.onerror =
              (event) => {
                if (
                  event.error ===
                    "canceled" ||
                  event.error ===
                    "interrupted"
                ) {
                  setStatus(
                    "idle",
                  );
                  resolve();
                  return;
                }

                reject(
                  new Error(
                    `Web Speech: ${event.error}`,
                  ),
                );
              };

            synthesis.speak(
              utterance,
            );
          },
        );
      },
      [
        arabicVoice,
        browserSpeechSupported,
      ],
    );

  const playNativeSpeech =
    useCallback(
      async (
        cleanText: string,
        options: SpeakOptions,
      ) => {
        if (!isNativeTextToSpeechPlatform()) {
          throw new Error(
            "NATIVE_TTS_PLATFORM_UNAVAILABLE",
          );
        }

        setError("");
        setStatus("speaking");

        await speakNativeArabic(
          cleanText,
          {
            rate: options.rate ?? 0.92,
            pitch: options.pitch ?? 1,
            volume: options.volume ?? 1,
          },
        );

        setStatus("idle");
      },
      [],
    );

  const playServerSpeech =
    useCallback(
      async (
        cleanText: string,
      ) => {
        releaseServerAudio();

        const response =
          await fetch(
            "/api/dad-voice",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body:
                JSON.stringify({
                  text: cleanText,
                  mood: "normal",
                }),
            },
          );

        if (!response.ok) {
          let message =
            "تعذر إنشاء صوت ضاد.";

          try {
            const data =
              (await response
                .json()) as {
                error?: string;
              };

            if (data.error) {
              message =
                data.error;
            }
          } catch {
            // Keep safe fallback.
          }

          throw new Error(
            message,
          );
        }

        const blob =
          await response.blob();

        if (blob.size === 0) {
          throw new Error(
            "خدمة الصوت أعادت ملفًا فارغًا.",
          );
        }

        const url =
          URL.createObjectURL(blob);
        const audio =
          new Audio(url);

        audioUrlRef.current = url;
        audioRef.current = audio;

        audio.preload = "auto";

        await new Promise<void>(
          (resolve, reject) => {
            audio.onplay = () => {
              setError("");
              setStatus(
                "speaking",
              );
            };

            audio.onended = () => {
              releaseServerAudio();
              setStatus("idle");
              resolve();
            };

            audio.onerror = () => {
              releaseServerAudio();
              reject(
                new Error(
                  "تعذر تشغيل ملف صوت ضاد.",
                ),
              );
            };

            audio.play().catch(
              (cause) => {
                releaseServerAudio();
                reject(cause);
              },
            );
          },
        );
      },
      [releaseServerAudio],
    );

  const speak =
    useCallback(
      async (
        text: string,
        options: SpeakOptions = {},
      ) => {
        const cleanText =
          text.trim();

        if (!cleanText) {
          setError(
            "لا يوجد نص لقراءته.",
          );
          setStatus("error");
          return;
        }

        stop();
        setError("");
        setStatus("speaking");

        if (
          isNativeTextToSpeechPlatform()
        ) {
          try {
            await playNativeSpeech(
              cleanText,
              options,
            );
            return;
          } catch (
            nativeCause
          ) {
            console.warn(
              "DADYOOM_NATIVE_TTS_FALLBACK:",
              nativeCause,
            );
          }
        }

        try {
          await playServerSpeech(
            cleanText,
          );
          return;
        } catch (
          serverCause
        ) {
          console.warn(
            "DADYOOM_SERVER_TTS_FALLBACK:",
            serverCause,
          );
        }

        try {
          await playBrowserSpeech(
            cleanText,
            options,
          );
        } catch (
          browserCause
        ) {
          console.error(
            "DADYOOM_VOICE_ERROR:",
            browserCause,
          );

          setError(
            "تعذر تشغيل الصوت. تأكد من تشغيل خادم ضاديوم واتصال التطبيق به.",
          );
          setStatus("error");
        }
      },
      [
        playBrowserSpeech,
        playNativeSpeech,
        playServerSpeech,
        stop,
      ],
    );

  const pause =
    useCallback(() => {
      if (
        audioRef.current &&
        !audioRef.current.paused
      ) {
        audioRef.current.pause();
        setStatus("paused");
        return;
      }

      if (
        browserSpeechSupported
      ) {
        window.speechSynthesis
          .pause();
        setStatus("paused");
      }
    }, [browserSpeechSupported]);

  const resume =
    useCallback(() => {
      if (
        audioRef.current &&
        audioRef.current.paused
      ) {
        void audioRef.current
          .play()
          .then(() =>
            setStatus(
              "speaking",
            ),
          )
          .catch(() => {
            setError(
              "تعذر استئناف الصوت.",
            );
            setStatus("error");
          });

        return;
      }

      if (
        browserSpeechSupported
      ) {
        window.speechSynthesis
          .resume();
        setStatus("speaking");
      }
    }, [browserSpeechSupported]);

  useEffect(
    () => () => {
      releaseServerAudio();

      if (
        typeof window !==
          "undefined" &&
        "speechSynthesis" in
          window
      ) {
        window.speechSynthesis
          .cancel();
      }
    },
    [releaseServerAudio],
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
      isNativeTextToSpeechPlatform()
        ? "Android Native Arabic TTS"
        : arabicVoice?.name ??
          "Dadyoom Voice",
  };
}
