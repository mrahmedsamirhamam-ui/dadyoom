import RolePortalLayout from "@/components/roles/RolePortalLayout";

const links = [
  { href: "/student", label: "لوحتي", icon: "🏠" },
  { href: "/courses", label: "منهجي", icon: "📚" },
  { href: "/journey", label: "رحلتي", icon: "🧭" },
  { href: "/skills", label: "المهارات", icon: "🧠" },
  { href: "/reading-challenge", label: "تحدي القراءة", icon: "📖" },
  { href: "/dictionary", label: "قاموس السياق", icon: "🔎" },
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
      {children}
    </RolePortalLayout>
  );
}
