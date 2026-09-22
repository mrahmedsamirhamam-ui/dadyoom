import RolePortalLayout from "@/components/roles/RolePortalLayout";

const links = [
  { href: "/teacher/marketplace/new", label: "بيع درس/كورس", icon: "" },
  { href: "/teacher/marketplace/earnings", label: "أرباحي", icon: "" },
  { href: "/teacher/live", label: "الحصص المباشرة", icon: "" },
  { href: "/pricing", label: "ضاديوم Plus", icon: "" },
  { href: "/teacher/marketplace", label: "سوق المعلم", icon: "" },
  { href: "/teacher/classroom", label: "الفصل الذكي", icon: "" },
  { href: "/teacher", label: "لوحة المعلم", icon: "" },
  { href: "/rewards", label: "الجوائز والشهادات", icon: "🏆" },
  { href: "/teacher/academy", label: "غرفة تدريب المعلم", icon: "" },
  { href: "/courses", label: "المناهج الجاهزة", icon: "" },
  { href: "/skills", label: "المهارات الأربع", icon: "" },
  { href: "/reading-challenge", label: "القراءة", icon: "" },
  { href: "/dictionary", label: "قاموس السياق", icon: "" },
];

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RolePortalLayout
      role="teacher"
      links={links}
    >
      {children}
    </RolePortalLayout>
  );
}
