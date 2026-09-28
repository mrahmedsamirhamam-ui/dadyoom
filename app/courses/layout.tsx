import Link from "next/link";

import DadyoomLogo from "@/components/brand/DadyoomLogo";

const links = [
  {
    href: "/courses",
    label: "المناهج",
  },
  {
    href: "/courses/rooms/non-native",
    label: "العربية لغير الناطقين",
  },
  {
    href: "/courses/rooms/native-arabic",
    label: "العربية للعرب",
  },
  {
    href: "/courses/video-library",
    label: "مكتبة الفيديوهات",
  },
];

export default function CoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header
        dir="rtl"
        className="border-b border-[#dfcfaf] bg-[#fffdf7]/95"
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <DadyoomLogo className="ml-auto" />

          <nav
            aria-label="تنقل المناهج"
            className="order-3 flex w-full gap-1 overflow-x-auto pb-1 text-sm font-black text-[#5c554d] lg:order-none lg:w-auto lg:flex-1 lg:justify-center lg:pb-0"
          >
            <Link
              href="/"
              prefetch={false}
              className="whitespace-nowrap rounded-full px-4 py-2.5 hover:bg-[#f3ead7]"
            >
              الرئيسية
            </Link>
            <Link
              href="/ask"
              prefetch={false}
              className="whitespace-nowrap rounded-full px-4 py-2.5 hover:bg-[#f3ead7]"
            >
              اسأل ضاد
            </Link>
            <Link
              href="/pricing"
              prefetch={false}
              className="whitespace-nowrap rounded-full px-4 py-2.5 hover:bg-[#f3ead7]"
            >
              Plus
            </Link>
          </nav>

          <Link
            href="/login"
            prefetch={false}
            className="rounded-full bg-[#123f39] px-4 py-2.5 text-sm font-black text-white"
          >
            حسابي
          </Link>
        </div>
      </header>

      <div
        dir="rtl"
        className="border-b border-[#e2d5bd] bg-[#fff9ee]"
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="text-sm font-black text-[#123f39]">
            المناهج ومسارا العربية ومكتبة الفيديو في مكان واحد.
          </div>

          <div className="flex flex-wrap gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                className="rounded-full border border-[#d3c099] bg-white px-4 py-2 text-xs font-black text-[#6f572d]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {children}
    </>
  );
}
