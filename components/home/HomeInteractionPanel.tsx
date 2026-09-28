"use client";

import Link from "next/link";

import { useArabicSpeech } from "@/hooks/use-arabic-speech";

const skills = [
  {
    href: "/skills/reading/practice",
    code: "01",
    title: "القراءة",
    text: "فهم النص والسياق",
  },
  {
    href: "/skills/writing/practice",
    code: "02",
    title: "الكتابة",
    text: "الإملاء والتعبير",
  },
  {
    href: "/skills/listening/practice",
    code: "03",
    title: "الاستماع",
    text: "فهم المسموع",
  },
  {
    href: "/skills/speaking/practice",
    code: "04",
    title: "التحدث",
    text: "النطق والتعبير",
  },
];

export default function HomeInteractionPanel() {
  const { speak, stop, status, error } = useArabicSpeech();
  const speaking = status === "speaking";

  return (
    <section
      dir="rtl"
      aria-labelledby="home-skills-title"
      className="border-y border-[#ddd0b8] bg-[#fffdf8] py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-sm font-black text-[#a7772f]">
              المهارات الأربع
            </p>
            <h2
              id="home-skills-title"
              className="mt-3 font-arabic-display text-3xl font-black leading-[1.45] text-[#123f39] sm:text-4xl"
            >
              تعلّم العربية كما تستخدمها
            </h2>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
            <p className="max-w-xl font-arabic-reading text-lg leading-8 text-[#665f56]">
              القراءة والكتابة والاستماع والتحدث ليست أربع جزر منفصلة؛
              كل تدريب يعود إلى نفس رحلة التقدم.
            </p>
            <Link
              href="/ask"
              className="shrink-0 rounded-2xl bg-[#123f39] px-6 py-3.5 text-center font-black text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#0c332e] active:scale-[0.98]"
            >
              اسأل ضاد
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {skills.map((skill) => (
            <Link
              key={skill.href}
              href={skill.href}
              className="group rounded-[1.75rem] border border-[#ded0b4] bg-[#f8f1e5] p-5 transition hover:-translate-y-1 hover:border-[#a99161] hover:bg-white hover:shadow-lg active:scale-[0.98]"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-black text-[#9a712c]">
                  {skill.code}
                </span>
                <span
                  aria-hidden="true"
                  className="text-lg font-black text-[#123f39]/25 transition group-hover:text-[#123f39]"
                >
                  ←
                </span>
              </div>
              <h3 className="mt-8 text-2xl font-black text-[#123f39]">
                {skill.title}
              </h3>
              <p className="mt-2 font-arabic-reading text-lg text-[#6b6258]">
                {skill.text}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-4 rounded-[1.75rem] border border-[#d8c7a4] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-black text-[#9a712c]">
              اختبار الصوت
            </div>
            <p className="mt-1 font-bold text-[#4f4a43]">
              {status === "speaking"
                ? "ضاد يتحدث الآن"
                : status === "paused"
                  ? "الصوت متوقف مؤقتًا"
                  : status === "error"
                    ? "تعذر تشغيل الصوت"
                    : "تأكد أن الصوت العربي يعمل على جهازك"}
            </p>
            {error ? (
              <p className="mt-2 text-sm font-bold text-rose-700">
                {error}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => {
              if (speaking) {
                stop();
                return;
              }

              void speak(
                "مرحبًا بك في ضاديوم. العربية لقلب الطالب قبل عقله.",
              );
            }}
            className="shrink-0 rounded-2xl border border-[#c9ae70] bg-[#fff8e8] px-6 py-3.5 font-black text-[#76551d] transition hover:bg-[#f8e7bd] active:scale-[0.98]"
          >
            {speaking ? "إيقاف الصوت" : "اختبار صوت ضاد"}
          </button>
        </div>
      </div>
    </section>
  );
}
