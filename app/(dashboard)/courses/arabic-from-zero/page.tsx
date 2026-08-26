import Link from "next/link";

import {
  arabicFromZeroCourse,
} from "@/data/video-courses/arabic-from-zero";

export const metadata = {
  title:
    "العربية من الصفر | ضاديوم",
  description:
    "كورس فيديو منظم لتعلم الحروف والحركات والمدود والعبارات العربية الأساسية.",
};

export default function ArabicFromZeroCoursePage() {
  const course =
    arabicFromZeroCourse;

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#fbf6ea] px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-[#cdb778] bg-[#123f39] p-7 text-white shadow-xl sm:p-10">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-20 dad-arabesque"
          />

          <div className="relative">
            <span className="inline-flex rounded-full border border-[#f3d18b]/30 bg-white/10 px-4 py-2 text-xs font-black text-[#ffe8b2]">
              دورات ضاديوم بالفيديو
            </span>

            <h1 className="mt-4 font-arabic-display text-4xl font-black sm:text-6xl">
              {course.title}
            </h1>

            <p className="mt-3 text-xl font-black text-[#f5cf7a]">
              {course.subtitle}
            </p>

            <p className="mt-5 max-w-4xl font-arabic-reading text-lg leading-9 text-[#e6f0ed]">
              {course.description}
            </p>

            <div className="mt-6 flex flex-wrap gap-2 text-xs font-black">
              <Tag>{course.audience}</Tag>
              <Tag>المستوى: {course.level}</Tag>
              <Tag>{course.estimatedLessons} دروس</Tag>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[#dfcfad] bg-[#fffdf8] p-6 shadow-sm">
          <h2 className="font-arabic-display text-2xl font-black text-[#123f39]">
            كيف يعمل هذا الكورس؟
          </h2>

          <p className="mt-3 font-arabic-reading text-lg leading-8 text-[#6d645a]">
            نشاهد الفيديو من مصدره الأصلي على YouTube، ثم ننفذ تدريبات
            ضاديوم بعده. لا ننسخ الفيديو ولا نعيد رفعه، ونبقي اسم القناة
            ورابط المصدر ظاهرين دائمًا.
          </p>
        </section>

        <div className="space-y-7">
          {course.lessons.map(
            (
              lesson,
              index
            ) => (
              <article
                key={lesson.id}
                className="overflow-hidden rounded-[2rem] border border-[#dfcfad] bg-[#fffdf8] shadow-sm"
              >
                <div className="grid lg:grid-cols-[1.15fr_.85fr]">
                  <div className="bg-black">
                    <div className="aspect-video">
                      <iframe
                        className="h-full w-full"
                        src={`https://www.youtube-nocookie.com/embed/${lesson.youtubeId}`}
                        title={lesson.sourceTitle}
                        loading="lazy"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="text-xs font-black text-[#9a7028]">
                      الدرس {index + 1}
                    </div>

                    <h2 className="mt-2 font-arabic-display text-2xl font-black text-[#123f39]">
                      {lesson.title}
                    </h2>

                    <p className="mt-3 font-arabic-reading text-base leading-8 text-[#6d645a]">
                      {lesson.summary}
                    </p>

                    <div className="mt-5 rounded-2xl bg-[#f6efe2] p-4">
                      <div className="text-xs font-black text-[#8d692b]">
                        المصدر
                      </div>

                      <div className="mt-1 font-black text-[#123f39]">
                        {lesson.sourceChannel}
                      </div>

                      <Link
                        href={lesson.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-sm font-black text-[#8d692b] underline"
                      >
                        مشاهدة الفيديو على YouTube
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 border-t border-[#eadfc9] p-6 md:grid-cols-2">
                  <SectionList
                    title="أهداف الدرس"
                    items={lesson.objectives}
                  />

                  <SectionList
                    title="تدريبات ضاديوم"
                    items={lesson.practice}
                  />
                </div>
              </article>
            )
          )}
        </div>

        <section className="rounded-[2rem] bg-[#123f39] p-7 text-white">
          <h2 className="font-arabic-display text-2xl font-black">
            بعد إنهاء الكورس
          </h2>

          <p className="mt-3 font-arabic-reading text-lg leading-8 text-[#e4efeb]">
            ينتقل المتعلم إلى مسار القراءة والفهم، ثم المحادثة والاستماع،
            وبعدها يمكنه دخول مسارات النحو والإملاء والكتابة حسب هدفه.
          </p>

          <Link
            href="/ask"
            className="mt-5 inline-flex rounded-full bg-[#f5cf7a] px-5 py-3 text-sm font-black text-[#123f39]"
          >
            تدرب الآن مع ضاد
          </Link>
        </section>
      </div>
    </main>
  );
}

function Tag({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2">
      {children}
    </span>
  );
}

function SectionList({
  title,
  items,
}: {
  title: string;
  items: readonly string[];
}) {
  return (
    <section>
      <h3 className="font-black text-[#123f39]">
        {title}
      </h3>

      <ul className="mt-3 space-y-2">
        {items.map(
          (item) => (
            <li
              key={item}
              className="flex gap-2 font-arabic-reading text-base leading-7 text-[#655d54]"
            >
              <span className="text-[#b58534]">
                ✓
              </span>
              <span>{item}</span>
            </li>
          )
        )}
      </ul>
    </section>
  );
}
