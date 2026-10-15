import Link from "next/link";
import CompactNavigation from "@/components/navigation/CompactNavigation";

export default function Header() {
  return (
    <header
      className="bg-teal-700 text-white shadow-md"
      dir="rtl"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link
          href="/"
          className="text-3xl font-bold"
        >
          ضاديوم
        </Link>

        <CompactNavigation id="legacy-header-navigation" items={[
          { href: "/", label: "الرئيسية" },
          { href: "/courses", label: "المناهج" },
          { href: "/skills", label: "المهارات" },
          { href: "/ask", label: "شات ضاد" },
          { href: "/teacher/academy", label: "تدريب المعلم" },
          { href: "/contact", label: "تواصل معنا" },
          { href: "/login", label: "تسجيل الدخول" },
        ]} />
      </div>
    </header>
  );
}
