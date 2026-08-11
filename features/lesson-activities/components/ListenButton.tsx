"use client";

import {
  useRef,
  useState,
} from "react";

type ListenButtonProps = {
  text?: string | null;
  audioUrl?: string | null;
  mood?:
    | "normal"
    | "thinking"
    | "correct"
    | "encouraging"
    | "celebrating";
};

export default function ListenButton({
  text,
  audioUrl,
  mood = "normal",
}: ListenButtonProps) {
  const audioRef =
    useRef<HTMLAudioElement | null>(null);

  const generatedUrlRef =
    useRef<string | null>(null);

  const generatedTextRef =
    useRef<string | null>(null);

  const [speaking, setSpeaking] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);


  function cleanupGeneratedUrl() {
    if (generatedUrlRef.current) {
      URL.revokeObjectURL(
        generatedUrlRef.current
      );

      generatedUrlRef.current =
        null;

      generatedTextRef.current =
        null;
    }
  }


  async function getDadVoiceUrl(): Promise<string> {
    const cleanText =
      text?.trim() ?? "";

    if (!cleanText) {
      throw new Error(
        "لا يوجد نص للاستماع."
      );
    }

    if (
      generatedUrlRef.current &&
      generatedTextRef.current ===
        cleanText
    ) {
      return generatedUrlRef.current;
    }

    cleanupGeneratedUrl();

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
              mood,
            }),
        }
      );

    if (!response.ok) {
      let message =
        "تعذر إنشاء صوت ضاد.";

      try {
        const data =
          (await response.json()) as {
            error?: string;
          };

        if (data.error) {
          message =
            data.error;
        }
      }
      catch {
        // Keep default message.
      }

      throw new Error(
        message
      );
    }

    const blob =
      await response.blob();

    if (blob.size === 0) {
      throw new Error(
        "تم إنشاء ملف صوتي فارغ."
      );
    }

    const objectUrl =
      URL.createObjectURL(
        blob
      );

    generatedUrlRef.current =
      objectUrl;

    generatedTextRef.current =
      cleanText;

    return objectUrl;
  }


  async function playAudio() {
    setError(null);
    setLoading(true);

    try {
      const source =
        audioUrl ||
        await getDadVoiceUrl();

      if (
        audioRef.current
      ) {
        audioRef.current.pause();
      }

      const audio =
        new Audio(
          source
        );

      audioRef.current =
        audio;

      audio.currentTime = 0;

      audio.onended = () => {
        setSpeaking(false);
      };

      audio.onerror = () => {
        setSpeaking(false);

        setError(
          "تعذر تشغيل الصوت."
        );
      };

      setSpeaking(true);

      await audio.play();
    }
    catch (playError) {
      setSpeaking(false);

      setError(
        playError instanceof Error
          ? playError.message
          : "تعذر تشغيل صوت ضاد."
      );
    }
    finally {
      setLoading(false);
    }
  }


  function stopAudio() {
    if (audioRef.current) {
      audioRef.current.pause();

      audioRef.current.currentTime =
        0;
    }

    setSpeaking(false);
  }


  return (
    <div
      dir="rtl"
      className="mt-4"
    >
      <div className="flex flex-wrap items-center gap-3">

        <button
          type="button"
          disabled={loading}
          onClick={
            speaking
              ? stopAudio
              : playAudio
          }
          className={
            "rounded-2xl px-6 py-3 font-bold text-white shadow-sm transition disabled:cursor-wait disabled:opacity-70 " +
            (
              speaking
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-sky-600 hover:bg-sky-700"
            )
          }
        >
          {loading
            ? "⏳ جاري تجهيز الصوت..."
            : speaking
              ? "⏹ إيقاف الاستماع"
              : "🔊 استمع"}
        </button>

        {speaking ? (
          <span className="text-sm font-bold text-sky-700">
            🔊 ضاد يقرأ الآن...
          </span>
        ) : null}

      </div>

      {error ? (
        <p className="mt-2 text-sm font-bold text-rose-600">
          {error}
        </p>
      ) : null}

    </div>
  );
}
