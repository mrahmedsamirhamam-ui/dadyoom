"use client";

import {
  useMemo,
  useState,
} from "react";

type AcademyItem = {
  id: string;
  title: string;
  channel: string;
  url: string;
  embedUrl: string;
  thumbnail: string;
  trackSlug: string;
  trackTitle: string;
  outcome: string;
  practice: string;
  trackPosition: number;
  academyIndex: number;
  kind: "micro-course";
};

const PAGE_SIZE = 20;

export default function TeacherAcademyClient({
  items,
}: {
  items: AcademyItem[];
}) {
  const [track, setTrack] =
    useState("all");

  const [query, setQuery] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [selected, setSelected] =
    useState<AcademyItem | null>(
      items[0] ?? null
    );

  const tracks =
    useMemo(() => {
      const map =
        new Map<
          string,
          string
        >();

      for (const item of items) {
        map.set(
          item.trackSlug,
          item.trackTitle
        );
      }

      return Array.from(
        map.entries()
      );
    }, [items]);

  const filtered =
    useMemo(() => {
      const normalized =
        query
          .trim()
          .toLowerCase();

      return items.filter(
        (item) => {
          const trackOk =
            track === "all" ||
            item.trackSlug ===
              track;

          const searchOk =
            !normalized ||
            `${item.title} ${item.channel} ${item.trackTitle}`
              .toLowerCase()
              .includes(
                normalized
              );

          return (
            trackOk &&
            searchOk
          );
        }
      );
    }, [
      items,
      track,
      query,
    ]);

  const pages =
    Math.max(
      1,
      Math.ceil(
        filtered.length /
          PAGE_SIZE
      )
    );

  const safePage =
    Math.min(
      page,
      pages
    );

  const visible =
    filtered.slice(
      (safePage - 1) *
        PAGE_SIZE,
      safePage *
        PAGE_SIZE
    );

  return (
    <div className="space-y-6">
      {selected ? (
        <section className="overflow-hidden rounded-[2rem] border border-[#d9c8a7] bg-[#fffdf8] shadow-lg">
          <div className="grid lg:grid-cols-[1.35fr_.65fr]">
            <div className="aspect-video bg-black">
              <iframe
                key={selected.id}
                className="h-full w-full"
                src={selected.embedUrl}
                title={selected.title}
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            <div className="p-6">
              <div className="text-xs font-black text-[#9a7028]">
                تدريب{" "}
                #{selected.academyIndex}
                {" • "}
                {selected.trackTitle}
              </div>

              <h2 className="mt-2 font-arabic-display text-2xl font-black leading-10 text-[#123f39]">
                {selected.title}
              </h2>

              <p className="mt-4 text-sm font-black text-[#766a5c]">
                المصدر:{" "}
                {selected.channel}
              </p>

              <div className="mt-5 rounded-2xl bg-[#f6efe2] p-4">
                <div className="text-xs font-black text-[#9a7028]">
                  الهدف المهني
                </div>

                <p className="mt-2 font-arabic-reading text-sm leading-7 text-[#655d54]">
                  {selected.outcome}
                </p>
              </div>

              <div className="mt-4 rounded-2xl border border-[#d9c8a7] bg-white p-4">
                <div className="text-xs font-black text-[#9a7028]">
                  تطبيق ضاديوم
                </div>

                <p className="mt-2 font-arabic-reading text-sm leading-7 text-[#655d54]">
                  {selected.practice}
                </p>
              </div>

              <a
                href={selected.url}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex rounded-full bg-[#123f39] px-5 py-3 text-sm font-black text-white"
              >
                فتح المصدر على YouTube
              </a>
            </div>
          </div>
        </section>
      ) : null}

      <section className="rounded-[2rem] border border-[#dfcfad] bg-[#fffdf8] p-5 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <input
            value={query}
            onChange={(
              event
            ) => {
              setQuery(
                event.target.value
              );
              setPage(1);
            }}
            placeholder="ابحث في 500 تدريب للمعلم..."
            className="rounded-2xl border border-[#d9c8a7] bg-white px-4 py-3 text-sm font-bold text-[#123f39] outline-none"
          />

          <select
            value={track}
            onChange={(
              event
            ) => {
              setTrack(
                event.target.value
              );
              setPage(1);
            }}
            className="rounded-2xl border border-[#d9c8a7] bg-white px-4 py-3 text-sm font-black text-[#123f39]"
          >
            <option value="all">
              كل المسارات
            </option>

            {tracks.map(
              ([
                slug,
                title,
              ]) => (
                <option
                  key={slug}
                  value={slug}
                >
                  {title}
                </option>
              )
            )}
          </select>
        </div>

        <div className="mt-4 text-sm font-black text-[#766a5c]">
          النتائج:{" "}
          <strong className="text-[#123f39]">
            {filtered.length}
          </strong>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map(
          (item) => (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                setSelected(
                  item
                )
              }
              className="overflow-hidden rounded-[1.5rem] border border-[#dfcfad] bg-[#fffdf8] text-right shadow-sm transition hover:-translate-y-1 hover:border-[#b58534] hover:shadow-md"
            >
              <div
                className="relative aspect-video bg-[#173f39] bg-cover bg-center"
                style={{
                  backgroundImage:
                    `url("${item.thumbnail}")`,
                }}
              >
                <div className="absolute inset-0 bg-black/10" />

                <div className="absolute inset-0 grid place-items-center">
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-white/90 text-2xl text-[#b02020] shadow-lg">
                    ▶
                  </span>
                </div>

                <span className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-black text-white">
                  #{item.academyIndex}
                </span>
              </div>

              <div className="p-4">
                <div className="text-[10px] font-black text-[#9a7028]">
                  {item.trackTitle}
                </div>

                <h3 className="mt-1 line-clamp-3 min-h-16 font-black leading-7 text-[#123f39]">
                  {item.title}
                </h3>

                <p className="mt-2 truncate text-xs font-bold text-[#7c7164]">
                  {item.channel}
                </p>
              </div>
            </button>
          )
        )}
      </section>

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          disabled={
            safePage <= 1
          }
          onClick={() =>
            setPage(
              Math.max(
                1,
                safePage - 1
              )
            )
          }
          className="rounded-full border border-[#d2bd96] bg-[#fffdf8] px-5 py-2.5 text-sm font-black text-[#123f39] disabled:opacity-40"
        >
          السابق
        </button>

        <span className="text-sm font-black text-[#766a5c]">
          الصفحة{" "}
          {safePage} من{" "}
          {pages}
        </span>

        <button
          type="button"
          disabled={
            safePage >= pages
          }
          onClick={() =>
            setPage(
              Math.min(
                pages,
                safePage + 1
              )
            )
          }
          className="rounded-full bg-[#123f39] px-5 py-2.5 text-sm font-black text-white disabled:opacity-40"
        >
          التالي
        </button>
      </div>
    </div>
  );
}
