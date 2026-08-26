import Link from "next/link";

import RoomVideoLibrary from "@/components/courses/RoomVideoLibrary";

const tracks = [
  {
    title:
      "العربية من الصفر",
    text:
      "الحروف والحركات والمدود والعبارات الأساسية عبر فيديوهات منظمة وتدريبات ضاديوم.",
    href:
      "/courses/arabic-from-zero",
  },
  {
    title:
      "الاستماع والنطق",
    text:
      "تدريبات على التمييز السمعي ومخارج الحروف والتكرار الصوتي.",
    href:
      "/skills/listening/practice",
  },
  {
    title:
      "المحادثة",
    text:
      "مواقف التعارف والسؤال والشراء والاتجاهات والحياة اليومية.",
    href:
      "/skills/speaking/practice",
  },
  {
    title:
      "القراءة للمبتدئ",
    text:
      "من الكلمات القصيرة إلى الجمل والنصوص المتدرجة.",
    href:
      "/skills/reading/practice",
  },
];

export default function NonNativeRoomPage() {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#fbf6ea] px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[2.5rem] border border-[#cdb778] bg-[#123f39] p-8 text-white shadow-xl">
          <div className="text-5xl">
            🌍
          </div>

          <h1 className="mt-4 font-arabic-display text-4xl font-black sm:text-5xl">
            غرفة العربية لغير الناطقين بها
          </h1>

          <p className="mt-4 max-w-4xl font-arabic-reading text-xl leading-9 text-[#e6f0ed]">
            فيديوهات تأسيسية ومحادثة واستماع وقراءة، مع زيادة
            المصادر التي يشرح فيها المعلم بالعربية مباشرة.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {tracks.map(
            (track) => (
              <Link
                key={track.title}
                href={track.href}
                className="rounded-[1.5rem] border border-[#dfcfad] bg-[#fffdf8] p-5 shadow-sm"
              >
                <h2 className="font-black text-[#123f39]">
                  {track.title}
                </h2>

                <p className="mt-2 font-arabic-reading text-sm leading-7 text-[#6b6259]">
                  {track.text}
                </p>
              </Link>
            )
          )}
        </section>

        <RoomVideoLibrary
          room="non-native"
        />
      </div>
    </main>
  );
}
