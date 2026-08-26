import fs from "node:fs";
import path from "node:path";

import VideoLibraryClient from "@/components/courses/VideoLibraryClient";

type Catalog = {
  generatedAt: string;
  target: number;
  total: number;
  countsBySource: Record<
    string,
    number
  >;
  countsByCategory: Record<
    string,
    number
  >;
  countsByRoom: Record<
    string,
    number
  >;
  videos: Parameters<
    typeof VideoLibraryClient
  >[0]["videos"];
};

export const metadata = {
  title:
    "مكتبة 500 فيديو عربي | ضاديوم",
  description:
    "مكتبة فيديو متنوعة لتعلم العربية للعرب ولغير الناطقين بها من مصادر YouTube تعليمية متعددة.",
};

export const dynamic =
  "force-static";

function readCatalog():
  Catalog {
  const file =
    path.resolve(
      process.cwd(),
      "data/video-library/catalog.json"
    );

  if (
    !fs.existsSync(
      file
    )
  ) {
    throw new Error(
      "VIDEO_LIBRARY_CATALOG_MISSING: run scripts/fetch-youtube-video-library.py first"
    );
  }

  return JSON.parse(
    fs.readFileSync(
      file,
      "utf8"
    )
  ) as Catalog;
}

export default function VideoLibraryPage() {
  const catalog =
    readCatalog();

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#fbf6ea] px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl space-y-7">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-[#cdb778] bg-[#123f39] p-7 text-white shadow-xl sm:p-10">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-20 dad-arabesque"
          />

          <div className="relative">
            <span className="inline-flex rounded-full border border-[#f3d18b]/30 bg-white/10 px-4 py-2 text-xs font-black text-[#ffe8b2]">
              مكتبة ضاديوم المرئية
            </span>

            <h1 className="mt-4 font-arabic-display text-4xl font-black sm:text-6xl">
              500 فيديو لتعلم العربية
            </h1>

            <p className="mt-5 max-w-4xl font-arabic-reading text-xl leading-9 text-[#e6f0ed]">
              فيديوهات حقيقية من مصادر تعليمية متعددة، موزعة بين
              غير الناطقين بالعربية والطلاب العرب، مع القراءة والنحو
              والمفردات والنطق والمحادثة والكتابة والبلاغة.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <Metric
                label="الفيديوهات"
                value={catalog.total}
              />

              <Metric
                label="المجالات"
                value={
                  Object.keys(
                    catalog.countsByCategory
                  ).length
                }
              />

              <Metric
                label="المصادر"
                value={
                  Object.keys(
                    catalog.countsBySource
                  ).length
                }
              />
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[#dfcfad] bg-[#fffdf8] p-5 shadow-sm">
          <p className="font-arabic-reading text-base leading-8 text-[#6c6359]">
            الفيديوهات لا تُنزَّل ولا تُعاد استضافتها على ضاديوم؛
            تُعرض من YouTube باستخدام وضع التضمين المحسّن للخصوصية،
            مع إبقاء اسم القناة ورابط الفيديو الأصلي.
          </p>
        </section>

        <VideoLibraryClient
          videos={catalog.videos}
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
    <div className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black">
      {label}:{" "}
      <span className="text-[#f5cf7a]">
        {value}
      </span>
    </div>
  );
}
