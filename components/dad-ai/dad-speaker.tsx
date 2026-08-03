"use client";

import { useEffect } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { useArabicSpeech } from "@/hooks/use-arabic-speech";
import { useDadState } from "@/hooks/use-dad-state";
import { DadAI, type DadState } from "@/services/dad-ai";

type DadSpeakerProps = {
  text: string;
  title?: string;
  autoPlay?: boolean;
  compact?: boolean;
  state?: DadState;
};

export function DadSpeaker({
  text,
  title = "ضاد",
  autoPlay = false,
  compact = false,
  state,
}: DadSpeakerProps) {
  const engineState = useDadState();
  const dadState = state ?? engineState;

  // 1. تعريف القيم المساعدة بناءً على حالة dadState
  const isThinking = dadState === "thinking";
  const isTalking = dadState === "talking";
  const isCorrect = dadState === "correct";
  const isEncouraging = dadState === "encouraging";
  const isCelebrating = dadState === "celebrating";
  const hasActiveMotion =
    isThinking ||
    isTalking ||
    isCorrect ||
    isEncouraging ||
    isCelebrating;

  const {
    speak,
    stop,
    pause,
    resume,
    status,
    error,
    isMounted,
    isSupported,
    isSpeaking,
    isPaused,
    voiceName,
  } = useArabicSpeech();

  // إدارة التشغيل التلقائي عند تغيير النص أو خاصية autoPlay
  useEffect(() => {
    if (!autoPlay || !text.trim()) {
      return;
    }

    DadAI.talk();
    speak(text);

    return () => {
      stop();
      DadAI.idle();
    };
  }, [autoPlay, speak, stop, text]);

  // تحديث حالة DadAI بناءً على حالة الصوت وقراءة useArabicSpeech
  useEffect(() => {
    if (isSpeaking) {
      DadAI.talk();
      return;
    }

    if (status === "error") {
      DadAI.error();
      return;
    }

    // إرجاع الشخصية للوضع الطبيعي فقط إذا كانت تتحدث وانتهت من الكلام
    if (status === "idle" && DadAI.getState() === "talking") {
      DadAI.idle();
    }
  }, [isSpeaking, status]);

  const dadStatusLabel: Record<DadState, string> = {
    idle: "جاهز",
    listening: "يستمع إليك",
    thinking: "يفكر الآن",
    talking: "يتحدث الآن",
    reading: "يقرأ الدرس",
    correct: "إجابة رائعة",
    encouraging: "حاول مرة أخرى",
    celebrating: "يحتفل بإنجازك",
    error: "حدث خطأ",
  };

  return (
    <section
      dir="rtl"
      className={`overflow-hidden rounded-3xl border border-teal-200 bg-gradient-to-l from-teal-50 via-white to-amber-50 shadow-sm ${
        compact ? "p-4" : "p-6"
      }`}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        {/* 2. غلاف الشخصية المحدّث */}
        <div
          className={`relative flex shrink-0 items-center justify-center transition-all duration-300 ${
            compact ? "h-28 w-28" : "h-40 w-40"
          } ${
            isThinking
              ? "scale-105"
              : isCorrect
                ? "scale-110 -rotate-2"
                : isEncouraging
                  ? "scale-105 rotate-2"
                  : isCelebrating
                    ? "scale-110 animate-bounce"
                    : isTalking
                      ? "scale-105"
                      : "scale-100"
          }`}
          aria-label={`ضاد ${dadStatusLabel[dadState]}`}
        >
          {/* 3. التوهج الخلفي المحدّث */}
          <div
            className={`absolute inset-3 rounded-full bg-teal-300/30 blur-2xl transition ${
              hasActiveMotion
                ? "scale-110 opacity-100"
                : "scale-90 opacity-40"
            }`}
          />

          <Image
            src="/brand/dad-book.png"
            alt="شخصية ضاد"
            width={240}
            height={240}
            priority
            className={`relative z-10 h-full w-full object-contain drop-shadow-xl transition-all duration-300 ${
              dadState === "thinking"
                ? "animate-pulse scale-105"
                : dadState === "talking"
                  ? "animate-pulse rotate-1 scale-105"
                  : dadState === "correct"
                    ? "-rotate-2 scale-110"
                    : dadState === "encouraging"
                      ? "rotate-2 scale-105"
                      : dadState === "celebrating"
                        ? "animate-bounce scale-110"
                        : dadState === "error"
                          ? "opacity-70"
                          : "scale-100"
            }`}
          />

          {/* 4. المؤثرات التفاعلية حسب الحالات المختلفة */}
          {hasActiveMotion ? (
            <>
              {isThinking ? (
                <span className="absolute -top-2 right-4 z-20 rounded-full bg-white px-3 py-1 text-lg shadow-lg">
                  ...
                </span>
              ) : null}

              {isCorrect ? (
                <>
                  <span className="absolute right-0 top-5 z-20 text-3xl animate-bounce">
                    ✅
                  </span>
                  <span className="absolute left-1 top-10 z-20 text-2xl animate-pulse">
                    ⭐
                  </span>
                </>
              ) : null}

              {isEncouraging ? (
                <span className="absolute -top-2 left-2 z-20 rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800 shadow">
                  حاول مرة أخرى
                </span>
              ) : null}

              {isCelebrating ? (
                <>
                  <span className="absolute right-0 top-0 z-20 text-3xl animate-bounce">
                    🎉
                  </span>
                  <span className="absolute left-0 top-5 z-20 text-3xl animate-ping">
                    ✨
                  </span>
                  <span className="absolute bottom-2 right-4 z-20 text-2xl animate-pulse">
                    🏆
                  </span>
                </>
              ) : null}

              {isTalking ? (
                <>
                  <span className="absolute right-1 top-8 z-20 h-3 w-3 animate-ping rounded-full bg-amber-400" />
                  <span className="absolute bottom-7 left-2 z-20 h-3 w-3 animate-ping rounded-full bg-teal-400" />
                </>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-black text-slate-950">{title}</h2>

            {/* 5. شارة الحالة الملونة حسب dadState */}
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                isThinking
                  ? "bg-violet-100 text-violet-700"
                  : isCorrect
                    ? "bg-emerald-100 text-emerald-700"
                    : isEncouraging
                      ? "bg-amber-100 text-amber-700"
                      : isCelebrating
                        ? "bg-fuchsia-100 text-fuchsia-700"
                        : isTalking
                          ? "bg-sky-100 text-sky-700"
                          : dadState === "error"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-slate-100 text-slate-600"
              }`}
            >
              {dadStatusLabel[dadState]}
            </span>
          </div>

          <p className="mt-3 line-clamp-4 leading-8 text-slate-600">
            {text}
          </p>

          {isSpeaking ? (
            <div
              className="mt-4 flex h-8 items-end gap-1"
              aria-label="مؤشر الصوت"
            >
              {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
                <span
                  key={bar}
                  className="w-1.5 animate-pulse rounded-full bg-teal-600"
                  style={{
                    height: `${10 + ((bar * 7) % 22)}px`,
                    animationDelay: `${bar * 90}ms`,
                  }}
                />
              ))}
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            {!isSpeaking && !isPaused ? (
              <Button
                type="button"
                disabled={!isMounted || !isSupported || !text.trim()}
                onClick={() => speak(text)}
              >
                🔊 استمع إلى ضاد
              </Button>
            ) : null}

            {isSpeaking ? (
              <Button type="button" variant="outline" onClick={pause}>
                ⏸ إيقاف مؤقت
              </Button>
            ) : null}

            {isPaused ? (
              <Button type="button" onClick={resume}>
                ▶ متابعة
              </Button>
            ) : null}

            {isSpeaking || isPaused ? (
              <Button type="button" variant="destructive" onClick={stop}>
                ⏹ إيقاف
              </Button>
            ) : null}
          </div>

          {voiceName ? (
            <p className="mt-3 text-xs text-slate-400">
              الصوت المستخدم: {voiceName}
            </p>
          ) : null}

          {error ? (
            <p
              role="alert"
              className="mt-3 text-sm font-semibold text-rose-600"
            >
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}