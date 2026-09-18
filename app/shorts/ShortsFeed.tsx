"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type SafeVideo = {
  id: string;
  title: string;
  channel: string;
  rightsClass: string;
};

export default function ShortsFeed({
  videos,
}: {
  videos: SafeVideo[];
}) {
  const available = useMemo(
    () => videos.slice(0, 160),
    [videos]
  );
  const [index, setIndex] = useState(0);

  const current = available[index];

  if (!current) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-[#071c19] px-4 py-10 text-white"
      >
        <div className="mx-auto max-w-xl rounded-[2rem] bg-white/10 p-8 text-center">
          <h1 className="text-3xl font-black">
            شورتس العربية
          </h1>
          <p className="mt-4 leading-8 text-white/75">
            لا يوجد فيديو اجتاز فلتر العرض الآمن بعد.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 font-black text-[#123f39]"
          >
            العودة
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#071c19] px-3 py-4 text-white"
    >
      <div className="mx-auto max-w-md">
        <div className="mb-3 flex items-center justify-between">
          <Link
            href="/"
            className="rounded-xl bg-white/10 px-3 py-2 text-sm font-black"
          >
            رجوع
          </Link>
          <h1 className="font-black">شورتس العربية</h1>
          <span className="text-xs text-white/55">
            {index + 1}/{available.length}
          </span>
        </div>

        <section className="overflow-hidden rounded-[2rem] bg-black shadow-2xl">
          <div className="aspect-[9/16]">
            <iframe
              key={current.id}
              src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(
                current.id
              )}?rel=0&playsinline=1`}
              title={current.title || "فيديو عربي"}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          <div className="p-4">
            <h2 className="font-black leading-7">
              {current.title || "فيديو عربي"}
            </h2>
            {current.channel ? (
              <p className="mt-1 text-sm text-white/60">
                {current.channel}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-white/45">
              عرض من المصدر الأصلي فقط · لا تنزيل ولا إعادة رفع
            </p>
          </div>
        </section>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={index <= 0}
            onClick={() =>
              setIndex((value) => Math.max(0, value - 1))
            }
            className="rounded-2xl bg-white/10 px-4 py-4 font-black disabled:opacity-35"
          >
            السابق
          </button>
          <button
            type="button"
            disabled={index >= available.length - 1}
            onClick={() =>
              setIndex((value) =>
                Math.min(available.length - 1, value + 1)
              )
            }
            className="rounded-2xl bg-[#1f665c] px-4 py-4 font-black disabled:opacity-35"
          >
            التالي
          </button>
        </div>
      </div>
    </main>
  );
}
