import Link from "next/link";
import StudentPlanBar from "@/components/billing/StudentPlanBar";

const links = [
  { href: "/student", label: "لوحتي", icon: "⌂" },
  { href: "/courses", label: "منهجي", icon: "📚" },
  { href: "/student/classroom", label: "فصلي", icon: "👥" },
  { href: "/student/live", label: "الحصص", icon: "🎥" },
  { href: "/shorts", label: "شورتس", icon: "▶" },
  { href: "/journey", label: "رحلتي", icon: "🧭" },
  { href: "/pricing", label: "Plus", icon: "✦" },
];

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div dir="rtl" className="min-h-screen bg-[#fbf6ea]">
      <div className="mx-auto max-w-7xl px-3 pt-4 sm:px-5 lg:px-7">
        <div className="rounded-2xl border border-[#dfcfad] bg-[#fffdf8] p-2 shadow-sm">
          <nav
            aria-label="اختصارات الطالب"
            className="flex gap-2 overflow-x-auto pb-1"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black text-[#5c554c] transition hover:bg-[#edf5f1] hover:text-[#123f39]"
              >
                <span aria-hidden="true">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-3">
          <StudentPlanBar />
        </div>
      </div>

      {children}
    </div>
  );
}
