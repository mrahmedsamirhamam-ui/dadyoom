import fs from "node:fs";
import path from "node:path";

import VideoLibraryClient from "@/components/courses/VideoLibraryClient";

type Room =
  | "non-native"
  | "native";

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
  instructionLanguage?:
    | "arabic"
    | "mixed";
  presentation?:
    | "professional"
    | string;
};

type Catalog = {
  total: number;
  videos: VideoItem[];
};

function readCatalog():
  Catalog {
  const file =
    path.resolve(
      process.cwd(),
      "data/video-library/catalog.json"
    );

  return JSON.parse(
    fs.readFileSync(
      file,
      "utf8"
    )
  ) as Catalog;
}

export default function RoomVideoLibrary({
  room,
}: {
  room: Room;
}) {
  const catalog =
    readCatalog();

  const videos =
    catalog.videos.filter(
      (video) =>
        video.room === room ||
        video.room === "both"
    );

  const arabicTeachers =
    videos.filter(
      (video) =>
        video.instructionLanguage ===
        "arabic"
    ).length;

  return (
    <section className="space-y-5">
      <div className="rounded-[2rem] border border-[#dfcfad] bg-[#fffdf8] p-6 shadow-sm">
        <div className="text-xs font-black text-[#9a7028]">
          مكتبة الفيديو داخل هذه الغرفة
        </div>

        <h2 className="mt-2 font-arabic-display text-3xl font-black text-[#123f39]">
          {videos.length} فيديو مناسب
        </h2>

        <p className="mt-3 font-arabic-reading text-base leading-8 text-[#6c6359]">
          منها{" "}
          <strong className="text-[#123f39]">
            {arabicTeachers}
          </strong>{" "}
          فيديو من مصادر مصنفة بأن الشرح فيها بالعربية،
          مع الاعتماد على مصادر تعليمية ذات تقديم مهني.
        </p>
      </div>

      <VideoLibraryClient
        videos={videos}
      />
    </section>
  );
}
