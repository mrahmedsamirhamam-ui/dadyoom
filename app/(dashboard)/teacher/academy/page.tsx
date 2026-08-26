import fs from "node:fs";
import path from "node:path";

import TeacherAcademyClient from "@/components/teacher-academy/TeacherAcademyClient";

type Catalog = {
  total: number;
  trackCount: number;
  channelCount: number;
  items: Parameters<
    typeof TeacherAcademyClient
  >[0]["items"];
};

export const metadata = {
  title:
    "غرفة تدريب المعلم — 500 تدريب | ضاديوم",
  description:
    "500 دورة مصغرة وتدريب مهني للمعلمين موزعة على 25 مسارًا في التدريس وإدارة الصف والتقويم والتقنية وتعليم العربية.",
};

// This route lives behind the teacher role layout.
// It must stay dynamic so Supabase can read the current auth cookies.
export const dynamic =
  "force-dynamic";

function readCatalog():
  Catalog {
  const file =
    path.resolve(
      process.cwd(),
      "data/teacher-academy/catalog.json"
    );

  if (
    !fs.existsSync(
      file
    )
  ) {
    throw new Error(
      "TEACHER_ACADEMY_CATALOG_MISSING: run scripts/fetch-teacher-academy-500.py first"
    );
  }

  return JSON.parse(
    fs.readFileSync(
      file,
      "utf8"
    )
  ) as Catalog;
}

export default function TeacherAcademyPage() {
  const catalog =
    readCatalog();

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#fbf6ea] px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl space-y-7">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-[#cdb778] bg-[#123f39] p-8 text-white shadow-xl sm:p-10">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-20 dad-arabesque"
          />

          <div className="relative">
            <span className="inline-flex rounded-full border border-[#f3d18b]/30 bg-white/10 px-4 py-2 text-xs font-black text-[#ffe8b2]">
              التطوير المهني للمعلم
            </span>

            <h1 className="mt-4 font-arabic-display text-4xl font-black sm:text-6xl">
              غرفة تدريب المعلم
            </h1>

            <p className="mt-5 max-w-4xl font-arabic-reading text-xl leading-9 text-[#e6f0ed]">
              500 دورة مصغرة وتدريب عملي للمعلم: إدارة صف، تخطيط،
              استراتيجيات تدريس، قراءة ونحو وإملاء وكتابة، تقويم،
              فروق فردية، تقنية، ذكاء اصطناعي، قيادة وتطوير مهني.
            </p>

            <div className="mt-6 flex flex-wrap gap-2 text-sm font-black">
              <Metric
                label="التدريبات"
                value={catalog.total}
              />

              <Metric
                label="المسارات"
                value={
                  catalog.trackCount
                }
              />

              <Metric
                label="القنوات والمصادر"
                value={
                  catalog.channelCount
                }
              />
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[#dfcfad] bg-[#fffdf8] p-5 shadow-sm">
          <p className="font-arabic-reading text-base leading-8 text-[#6c6359]">
            كل تدريب يجمع فيديو عربيًا حقيقيًا من YouTube مع هدف مهني
            وتطبيق عملي من ضاديوم؛ لذلك الأكاديمية ليست قائمة روابط فقط.
          </p>
        </section>

        <TeacherAcademyClient
          items={catalog.items}
        />
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2">
      {label}:{" "}
      <strong className="text-[#f5cf7a]">
        {value}
      </strong>
    </span>
  );
}
