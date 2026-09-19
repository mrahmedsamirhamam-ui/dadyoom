import CourseRoomCard from "@/components/courses/CourseRoomCard";
import {
  courseRooms,
} from "@/data/course-rooms/rooms";

export const metadata = {
  title:
    "غرف تعلم العربية | ضاديوم",
  description:
    "غرفتان واضحتان في ضاديوم: العربية لغير الناطقين بها، والعربية للعرب مع معلمين عرب.",
};

export default function CourseRoomsPage() {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#fbf6ea] px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-[#cdb778] bg-[#123f39] p-7 text-white shadow-xl sm:p-10">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-20 dad-arabesque"
          />

          <div className="relative">
            <span className="inline-flex rounded-full border border-[#f3d18b]/30 bg-white/10 px-4 py-2 text-xs font-black text-[#ffe8b2]">
              اختر غرفة التعلم المناسبة
            </span>

            <h1 className="mt-4 font-arabic-display text-4xl font-black sm:text-6xl">
              غرف ضاديوم لتعلم العربية
            </h1>

            <p className="mt-5 max-w-4xl font-arabic-reading text-xl leading-9 text-[#e6f0ed]">
              فصلنا الرحلة إلى غرفتين واضحتين حتى لا نخلط احتياجات
              المبتدئ غير العربي باحتياجات الطالب العربي الذي يدرس
              القراءة والنحو والإملاء والتعبير والمناهج المدرسية.
            </p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          {courseRooms.map(
            (room) => (
              <CourseRoomCard
                key={room.slug}
                room={room}
              />
            )
          )}
        </section>
      </div>
    </main>
  );
}
