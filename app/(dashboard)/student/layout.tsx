import StudentPlanBar from "@/components/billing/StudentPlanBar";
import RolePortalLayout from "@/components/roles/RolePortalLayout";

const links = [
  { href: "/student", label: "لوحتي", icon: "⌂" },
  { href: "/courses", label: "منهجي", icon: "📚" },
  { href: "/student/classroom", label: "فصلي", icon: "👥" },
  { href: "/student/live", label: "الحصص", icon: "🎥" },
  { href: "/shorts", label: "شورتس", icon: "▶" },
  { href: "/journey", label: "رحلتي", icon: "🧭" },
  { href: "/skills", label: "المهارات", icon: "🧠" },
  { href: "/reading-challenge", label: "القراءة", icon: "📖" },
  { href: "/dictionary", label: "قاموس السياق", icon: "📘" },
  { href: "/rewards", label: "جوائزي وشهاداتي", icon: "🏆" },
  { href: "/pricing", label: "Plus", icon: "✦" },
];

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RolePortalLayout
      role="student"
      links={links}
    >
      <div className="mx-auto w-full max-w-7xl px-3 pt-4 sm:px-5 lg:px-7">
        <StudentPlanBar />
      </div>

      {children}
    </RolePortalLayout>
  );
}
