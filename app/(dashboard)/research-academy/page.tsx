import type { Metadata } from "next";
import ResearchAcademyClient from "./ResearchAcademyClient";

export const metadata: Metadata = {
  title: "أكاديمية البحث والكتابة الأكاديمية",
  description: "نظّم خطة بحثك بالعربية وتدرّب على توثيق المصادر والأمانة العلمية مع ضاديوم.",
  robots: { index: false, follow: false },
};

export default function ResearchAcademyPage() {
  return <ResearchAcademyClient />;
}
