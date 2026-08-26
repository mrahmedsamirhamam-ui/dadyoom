import Link from "next/link";

export default function CoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div
        dir="rtl"
        className="border-b border-[#e2d5bd] bg-[#fff9ee]"
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="text-sm font-black text-[#123f39]">
            ضاديوم يجمع المناهج الدراسية ودورات المهارات في مكان واحد.
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/courses"
              className="rounded-full border border-[#d3c099] bg-white px-4 py-2 text-xs font-black text-[#6f572d]"
            >
              المناهج
            </Link>

            <Link
              href="/courses/video-library"
              className="rounded-full border border-[#d3c099] bg-white px-4 py-2 text-xs font-black text-[#6f572d]"
            >
              مكتبة 500 فيديو
            </Link>

            <Link
              href="/courses/rooms"
              className="rounded-full border border-[#d3c099] bg-white px-4 py-2 text-xs font-black text-[#6f572d]"
            >
              غرف الكورسات
            </Link>

            <Link
              href="/courses/arabic-from-zero"
              className="rounded-full bg-[#123f39] px-4 py-2 text-xs font-black text-white"
            >
              العربية من الصفر
            </Link>
          </div>
        </div>
      </div>

      {children}
    </>
  );
}
