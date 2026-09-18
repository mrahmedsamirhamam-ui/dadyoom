import StudentPlanBar from "@/components/billing/StudentPlanBar";
import RolePortalLayout from "@/components/roles/RolePortalLayout";

const links = [
  { href: "/shorts", label: "شورتس العربية", icon: "" },
  { href: "/courses/video-library", label: "مكتبة الفيديو", icon: "" },
  { href: "/student/live", label: "الحصص المباشرة", icon: "" },
  { href: "/student/reminders", label: "تذكير التعلم", icon: "" },
  { href: "/pricing", label: "ضاديوم Plus", icon: "" },
  { href: "/marketplace", label: "سوق الدورات", icon: "" },
  { href: "/student/classroom", label: "فصلي", icon: "" },
  { href: "/student", label: "لوحتي", icon: "" },
  { href: "/courses", label: "منهجي", icon: "" },
  { href: "/journey", label: "رحلتي", icon: "" },
  { href: "/skills", label: "المهارات", icon: "" },
  { href: "/reading-challenge", label: "تحدي القراءة", icon: "" },
  { href: "/dictionary", label: "قاموس السياق", icon: "" },
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
      <StudentPlanBar />
        {children}
    </RolePortalLayout>
  );
}
