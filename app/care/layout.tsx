import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ضاديوم معك — صوتك يُسمَع، ورأيك يصنع الفرق",
  description: "مركز ضاديوم معك لخدمة المستخدمين والشكاوى والمقترحات والمتابعة في بيت اللغة العربية.",
  alternates: { canonical: "/care" },
};

export default function CareLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
