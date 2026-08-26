import Link from "next/link";

import type {
  CourseRoom,
} from "@/data/course-rooms/rooms";

export default function CourseRoomCard({
  room,
}: {
  room: CourseRoom;
}) {
  return (
    <article className="overflow-hidden rounded-[2rem] border border-[#dfcfad] bg-[#fffdf8] shadow-sm">
      <div className="border-b border-[#eadfc9] bg-[#123f39] p-6 text-white">
        <div className="text-4xl">
          {room.icon}
        </div>

        <h2 className="mt-4 font-arabic-display text-3xl font-black">
          {room.title}
        </h2>

        <p className="mt-2 text-sm font-black text-[#f5cf7a]">
          {room.subtitle}
        </p>
      </div>

      <div className="p-6">
        <div className="rounded-full bg-[#f6efe2] px-4 py-2 text-xs font-black text-[#8b672d]">
          {room.audience}
        </div>

        <p className="mt-4 font-arabic-reading text-lg leading-8 text-[#6b6259]">
          {room.description}
        </p>

        <div className="mt-5 rounded-2xl border border-[#e6d8bd] bg-white p-4">
          <div className="text-xs font-black text-[#9a7028]">
            نموذج التدريس
          </div>

          <p className="mt-2 font-arabic-reading leading-7 text-[#60584f]">
            {room.teacherModel}
          </p>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {room.highlights.map(
            (item) => (
              <div
                key={item}
                className="flex gap-2 rounded-xl bg-[#f8f2e6] p-3 text-sm font-black text-[#5f574d]"
              >
                <span className="text-[#b58534]">
                  ✓
                </span>
                <span>
                  {item}
                </span>
              </div>
            )
          )}
        </div>

        <Link
          href={room.entryHref}
          className="mt-6 inline-flex rounded-full bg-[#123f39] px-5 py-3 text-sm font-black text-white transition hover:brightness-110"
        >
          {room.entryLabel}
        </Link>
      </div>
    </article>
  );
}
