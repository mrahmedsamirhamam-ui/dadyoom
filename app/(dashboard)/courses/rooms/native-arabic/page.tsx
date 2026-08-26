import Link from "next/link";

import RoomVideoLibrary from "@/components/courses/RoomVideoLibrary";

const tracks = [
  {
    title:
      "المناهج حسب الدولة والصف",
    href:
      "/courses",
  },
  {
    title:
      "القراءة والفهم",
    href:
      "/skills/reading/practice",
  },
  {
    title:
      "النحو والصرف",
    href:
      "/skills",
  },
  {
    title:
      "الإملاء والكتابة",
    href:
      "/skills/writing/practice",
  },
  {
    title:
      "تحدي القراءة",
    href:
      "/reading-challenge",
  },
  {
    title:
      "قاموس السياق",
    href:
      "/dictionary",
  },
];

export default function NativeArabicRoomPage() {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#fbf6ea] px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[2.5rem] border border-[#cdb778] bg-[#123f39] p-8 text-white shadow-xl">
          <div className="text-5xl">
            📚
          </div>

          <h1 className="mt-4 font-arabic-display text-4xl font-black sm:text-5xl">
            غرفة العربية للعرب
          </h1>

          <p className="mt-4 max-w-4xl font-arabic-reading text-xl leading-9 text-[#e6f0ed]">
            معلمون عرب يشرحون بالعربية: نحو وبلاغة وأدب وقراءة
            وإملاء وكتابة، مع ربط المحتوى بالمناهج والمهارات.
          </p>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tracks.map(
            (track) => (
              <Link
                key={track.title}
                href={track.href}
                className="rounded-[1.4rem] border border-[#dfcfad] bg-[#fffdf8] p-5 font-black text-[#123f39] shadow-sm"
              >
                {track.title}
              </Link>
            )
          )}
        </section>

        <RoomVideoLibrary
          room="native"
        />
      </div>
    </main>
  );
}
