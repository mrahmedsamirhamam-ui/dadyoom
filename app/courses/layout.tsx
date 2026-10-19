import Link from "next/link";

import DadyoomLogo from "@/components/brand/DadyoomLogo";
import CompactNavigation from "@/components/navigation/CompactNavigation";

const links = [
  {
    href: "/courses",
    label: "المناهج",
  },
  {
    href: "/courses/international-arabic",
    label: "IB وIG وIGCSE",
  },
  {
    href: "/courses/rooms",
    label: "تخصيص غرف التعلم",
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

          <CompactNavigation items={[{ href: "/", label: "الرئيسية" }, { href: "/ask", label: "اسأل ضاد" }, { href: "/pricing", label: "Plus" }, ...links]} label="أقسام المناهج" id="courses-navigation" />

          <Link
            href="/login"
            prefetch={false}
            className="rounded-full bg-[#123f39] px-4 py-2.5 text-sm font-black text-white"
          >
            حسابي
          </Link>
        </div>
      </header>

      {children}
    </>
  );
}
