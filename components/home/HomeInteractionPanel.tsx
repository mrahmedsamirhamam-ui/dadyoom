"use client";

import Link from "next/link";

import { useArabicSpeech } from "@/hooks/use-arabic-speech";

const skills = [
  {
    href:
      "/skills/reading/practice",
    icon: "📖",
    title: "القراءة",
    text:
      "ابدأ تدريب القراءة مباشرة",
  },
  {
    href:
      "/skills/writing/practice",
    icon: "✍️",
    title: "الكتابة",
    text:
      "ابدأ تدريب الكتابة مباشرة",
  },
  {
    href:
      "/skills/listening/practice",
    icon: "🎧",
    title: "الاستماع",
    text:
      "ابدأ تدريب الاستماع مباشرة",
  },
  {
    href:
      "/skills/speaking/practice",
    icon: "🎙️",
    title: "التحدث",
    text:
      "افتح الميكروفون وتدرّب",
  },
];

export default function HomeInteractionPanel() {
  const {
    speak,
    stop,
    status,
    error,
  } =
    useArabicSpeech();

  const speaking =
    status === "speaking";

  return (
    <section
      dir="rtl"
      aria-label="اختصارات ضاديوم التفاعلية"
      className="border-y border-[#e6d8b8] bg-[#fffaf0] py-10"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black text-[#a17425]">
              اختبر الأزرار الآن
            </p>
            <h2 className="mt-1 text-3xl font-black text-[#123f39]">
              ابدأ من الواجهة الرئيسية
            </h2>
          </div>

          <Link
            href="/ask"
            className="touch-manipulation rounded-2xl bg-[#123f39] px-6 py-3.5 text-center font-black text-white shadow-md transition active:scale-95 active:opacity-80"
          >
            🤖 افتح شات ضاد
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {skills.map(
            (skill) => (
              <Link
                key={skill.href}
                href={skill.href}
                className="touch-manipulation rounded-2xl border border-[#dfcfad] bg-white p-5 shadow-sm transition active:scale-[0.97] active:bg-[#fff4dc]"
              >
                <span className="text-3xl">
                  {skill.icon}
                </span>
                <h3 className="mt-3 text-xl font-black text-[#123f39]">
                  {skill.title}
                </h3>
                <p className="mt-1 text-sm font-bold text-[#766c60]">
                  {skill.text}
                </p>
              </Link>
            ),
          )}
        </div>

        <div className="mt-5 rounded-2xl border border-[#d7c391] bg-white p-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (speaking) {
                  stop();
                  return;
                }

                void speak(
                  "مرحبًا بك في ضاديوم. إذا كنت تسمعني الآن فخدمة الصوت تعمل بصورة صحيحة.",
                );
              }}
              className="touch-manipulation rounded-xl bg-[#c59035] px-5 py-3 font-black text-white shadow-sm transition active:scale-95 active:opacity-80"
            >
              {speaking
                ? "⏹ إيقاف صوت ضاد"
                : "🔊 اختبار صوت ضاد"}
            </button>

            <span className="text-sm font-bold text-[#6b5d45]">
              الحالة:{" "}
              {status === "speaking"
                ? "الصوت يعمل الآن"
                : status === "paused"
                  ? "الصوت متوقف مؤقتًا"
                  : status === "error"
                    ? "تعذر تشغيل الصوت"
                    : "جاهز"}
            </span>
          </div>

          {error ? (
            <p className="mt-3 text-sm font-bold text-rose-700">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
