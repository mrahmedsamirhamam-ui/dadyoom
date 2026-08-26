"use client";

import {
  useMemo,
  useState,
} from "react";

type VideoItem = {
  id: string;
  title: string;
  url: string;
  embedUrl: string;
  thumbnail: string;
  channel: string;
  sourceKey: string;
  sourceName: string;
  room:
    | "non-native"
    | "native"
    | "both";
  category: string;
  libraryIndex: number;
};

const PAGE_SIZE = 24;

export default function VideoLibraryClient({
  videos,
}: {
  videos: VideoItem[];
}) {
  const [room, setRoom] =
    useState("all");

  const [category, setCategory] =
    useState("all");

  const [query, setQuery] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [selected, setSelected] =
    useState<VideoItem | null>(
      videos[0] ?? null
    );

  const categories =
    useMemo(
      () =>
        Array.from(
          new Set(
            videos.map(
              (video) =>
                video.category
            )
          )
        ).sort(
          (a, b) =>
            a.localeCompare(
              b,
              "ar"
            )
        ),
      [videos]
    );

  const filtered =
    useMemo(() => {
      const normalized =
        query
          .trim()
          .toLowerCase();

      return videos.filter(
        (video) => {
          const roomOk =
            room === "all" ||
            video.room === room ||
            video.room === "both";

          const categoryOk =
            category === "all" ||
            video.category ===
              category;

          const searchOk =
            !normalized ||
            `${video.title} ${video.channel} ${video.category}`
              .toLowerCase()
              .includes(
                normalized
              );

          return (
            roomOk &&
            categoryOk &&
            searchOk
          );
        }
      );
    }, [
      videos,
      room,
      category,
      query,
    ]);

  const totalPages =
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
      totalPages
    );

  const pageItems =
    filtered.slice(
      (safePage - 1) *
        PAGE_SIZE,
      safePage *
        PAGE_SIZE
    );

  function changeRoom(
    value: string
  ) {
    setRoom(value);
    setPage(1);
  }

  function changeCategory(
    value: string
  ) {
    setCategory(value);
    setPage(1);
  }

  function changeQuery(
    value: string
  ) {
    setQuery(value);
    setPage(1);
  }

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
              <div className="text-xs font-black text-[#a2732a]">
                فيديو رقم{" "}
                {selected.libraryIndex}
              </div>

              <h2 className="mt-2 font-arabic-display text-2xl font-black leading-10 text-[#123f39]">
                {selected.title}
              </h2>

              <div className="mt-4 rounded-2xl bg-[#f6efe2] p-4">
                <div className="text-xs font-black text-[#8d692b]">
                  المصدر
                </div>

                <div className="mt-1 font-black text-[#123f39]">
                  {selected.channel ||
                    selected.sourceName}
                </div>

                <a
                  href={selected.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block text-sm font-black text-[#8d692b] underline"
                >
                  فتح الفيديو على YouTube
                </a>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Chip>
                  {selected.category}
                </Chip>

                <Chip>
                  {selected.room ===
                  "native"
                    ? "للعرب"
                    : selected.room ===
                        "non-native"
                      ? "لغير الناطقين"
                      : "للغرفتين"}
                </Chip>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="rounded-[2rem] border border-[#dfcfad] bg-[#fffdf8] p-5 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <input
            value={query}
            onChange={(
              event
            ) =>
              changeQuery(
                event.target.value
              )
            }
            placeholder="ابحث في 500 فيديو..."
            className="rounded-2xl border border-[#d9c8a7] bg-white px-4 py-3 text-sm font-bold text-[#123f39] outline-none"
          />

          <select
            value={room}
            onChange={(
              event
            ) =>
              changeRoom(
                event.target.value
              )
            }
            className="rounded-2xl border border-[#d9c8a7] bg-white px-4 py-3 text-sm font-black text-[#123f39]"
          >
            <option value="all">
              الغرفتان
            </option>
            <option value="non-native">
              غير الناطقين بالعربية
            </option>
            <option value="native">
              العربية للعرب
            </option>
          </select>

          <select
            value={category}
            onChange={(
              event
            ) =>
              changeCategory(
                event.target.value
              )
            }
            className="rounded-2xl border border-[#d9c8a7] bg-white px-4 py-3 text-sm font-black text-[#123f39]"
          >
            <option value="all">
              كل المجالات
            </option>

            {categories.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              )
            )}
          </select>
        </div>

        <div className="mt-4 text-sm font-black text-[#766a5c]">
          النتائج:{" "}
          <span className="text-[#123f39]">
            {filtered.length}
          </span>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {pageItems.map(
          (video) => (
            <button
              key={video.id}
              type="button"
              onClick={() =>
                setSelected(
                  video
                )
              }
              className="overflow-hidden rounded-[1.5rem] border border-[#dfcfad] bg-[#fffdf8] text-right shadow-sm transition hover:-translate-y-1 hover:border-[#b58534] hover:shadow-md"
            >
              <div
                className="relative aspect-video bg-[#173f39] bg-cover bg-center"
                style={{
                  backgroundImage:
                    `url("${video.thumbnail}")`,
                }}
              >
                <div className="absolute inset-0 bg-black/10" />

                <div className="absolute inset-0 grid place-items-center">
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-white/90 text-2xl text-[#b02020] shadow-lg">
                    ▶
                  </span>
                </div>

                <span className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-black text-white">
                  #{video.libraryIndex}
                </span>
              </div>

              <div className="p-4">
                <div className="text-[10px] font-black text-[#9a7028]">
                  {video.category}
                </div>

                <h3 className="mt-1 line-clamp-3 min-h-16 font-black leading-7 text-[#123f39]">
                  {video.title}
                </h3>

                <p className="mt-2 truncate text-xs font-bold text-[#7c7164]">
                  {video.channel ||
                    video.sourceName}
                </p>
              </div>
            </button>
          )
        )}
      </section>

      <div className="flex flex-wrap items-center justify-center gap-3">
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
          {totalPages}
        </span>

        <button
          type="button"
          disabled={
            safePage >=
            totalPages
          }
          onClick={() =>
            setPage(
              Math.min(
                totalPages,
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

function Chip({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="rounded-full border border-[#d9c8a7] bg-[#fff9ed] px-3 py-1.5 text-xs font-black text-[#71582e]">
      {children}
    </span>
  );
}
