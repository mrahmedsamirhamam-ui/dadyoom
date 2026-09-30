"use client";

import { useCallback, useEffect, useState } from "react";

import VideoLibraryClient from "@/components/courses/VideoLibraryClient";

type VideoItem = Parameters<
  typeof VideoLibraryClient
>[0]["videos"][number];

type Catalog = {
  generatedAt: string;
  target: number;
  total: number;
  countsBySource: Record<string, number>;
  countsByCategory: Record<string, number>;
  countsByRoom: Record<string, number>;
  videos: VideoItem[];
};

function validCatalog(value: unknown): value is Catalog {
  if (!value || typeof value !== "object") return false;

  const catalog = value as Partial<Catalog>;

  return (
    Array.isArray(catalog.videos) &&
    catalog.videos.length >= 500 &&
    typeof catalog.total === "number" &&
    catalog.countsBySource !== null &&
    typeof catalog.countsBySource === "object" &&
    catalog.countsByCategory !== null &&
    typeof catalog.countsByCategory === "object"
  );
}

export default function VideoLibraryLoader() {
  const [catalog, setCatalog] =
    useState<Catalog | null>(null);
  const [error, setError] =
    useState("");
  const [attempt, setAttempt] =
    useState(0);

  const load =
    useCallback(async () => {
      setError("");

      try {
        const response =
          await fetch(
            "/video-library/catalog.json",
            {
              cache: "force-cache",
            },
          );

        if (!response.ok) {
          throw new Error(
            `VIDEO_LIBRARY_STATIC_CATALOG_HTTP_${response.status}`,
          );
        }

        const value =
          (await response.json()) as unknown;

        if (!validCatalog(value)) {
          throw new Error(
            "VIDEO_LIBRARY_STATIC_CATALOG_INVALID",
          );
        }

        setCatalog(value);
      } catch (cause) {
        setCatalog(null);
        setError(
          cause instanceof Error
            ? cause.message
            : "تعذر تحميل مكتبة الفيديو.",
        );
      }
    }, []);

  useEffect(() => {
    void load();
  }, [load, attempt]);

  if (!catalog) {
    return (
      <section
        className="rounded-[2rem] border border-[#dfcfad] bg-[#fffdf8] p-8 text-center shadow-sm"
        dir="rtl"
      >
        {error ? (
          <>
            <h2 className="text-xl font-black text-[#123f39]">
              تعذر تحميل مكتبة الفيديو مؤقتًا
            </h2>
            <p className="mt-3 text-sm font-bold text-[#766a5c]">
              حاول مرة أخرى؛ لن تفقد أي تقدم في حسابك.
            </p>
            <button
              type="button"
              onClick={() =>
                setAttempt(
                  value =>
                    value + 1,
                )
              }
              className="mt-5 rounded-2xl bg-[#123f39] px-6 py-3 font-black text-white"
            >
              إعادة المحاولة
            </button>
          </>
        ) : (
          <>
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#d9c8a7] border-t-[#123f39]" />
            <p className="mt-4 font-black text-[#123f39]">
              جاري تحميل مكتبة الفيديو…
            </p>
          </>
        )}
      </section>
    );
  }

  return (
    <div className="space-y-7">
      <section className="flex flex-wrap gap-2">
        <Metric
          label="الفيديوهات"
          value={catalog.total}
        />
        <Metric
          label="المجالات"
          value={
            Object.keys(
              catalog.countsByCategory,
            ).length
          }
        />
        <Metric
          label="المصادر"
          value={
            Object.keys(
              catalog.countsBySource,
            ).length
          }
        />
      </section>

      <VideoLibraryClient
        videos={catalog.videos}
      />
    </div>
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
    <div className="rounded-full border border-[#d9c8a7] bg-[#fffdf8] px-4 py-2 text-sm font-black text-[#123f39]">
      {label}:{" "}
      <span className="text-[#9a7028]">
        {value}
      </span>
    </div>
  );
}
