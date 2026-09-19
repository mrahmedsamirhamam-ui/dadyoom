import Link from "next/link";

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
    href: "/courses/arabic-from-zero",
    label: "العربية من الصفر",
    primary: true,
  },
];

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
            المناهج الرسمية ومسارا العربية بالفيديو في مكان واحد.
          </div>

          <div className="flex flex-wrap gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  link.primary
                    ? "rounded-full bg-[#123f39] px-4 py-2 text-xs font-black text-white"
                    : "rounded-full border border-[#d3c099] bg-white px-4 py-2 text-xs font-black text-[#6f572d]"
                }
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
