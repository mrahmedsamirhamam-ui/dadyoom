import RolePortalLayout from "@/components/roles/RolePortalLayout";

const links = [
  { href: "/teacher", label: "لوحة المعلم", icon: "🏠" },
  { href: "/courses", label: "المناهج الجاهزة", icon: "📚" },
  { href: "/skills", label: "المهارات الأربع", icon: "🧠" },
  { href: "/reading-challenge", label: "القراءة", icon: "📖" },
  { href: "/dictionary", label: "قاموس السياق", icon: "🔎" },
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
