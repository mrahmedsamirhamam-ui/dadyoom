import RolePortalLayout from "@/components/roles/RolePortalLayout";

const links = [
  { href: "/school", label: "لوحة المدرسة", icon: "🏫" },
  { href: "/school/reports", label: "التقارير", icon: "📊" },
  { href: "/courses", label: "المناهج", icon: "📚" },
  { href: "/skills", label: "المهارات", icon: "🧠" },
  { href: "/ask", label: "ضاد", icon: "🤖" },
];

export default function SchoolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RolePortalLayout
      role="school"
      links={links}
    >
      {children}
    </RolePortalLayout>
  );
}
