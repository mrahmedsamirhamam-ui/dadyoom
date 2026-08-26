import RolePortalLayout from "@/components/roles/RolePortalLayout";

const links = [
  { href: "/parent", label: "أبنائي", icon: "👨‍👩‍👧‍👦" },
  { href: "/courses", label: "المناهج", icon: "📚" },
  { href: "/reading-challenge", label: "القراءة", icon: "📖" },
  { href: "/skills", label: "المهارات", icon: "🧠" },
  { href: "/ask", label: "اسأل ضاد", icon: "🤖" },
];

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RolePortalLayout
      role="parent"
      links={links}
    >
      {children}
    </RolePortalLayout>
  );
}
