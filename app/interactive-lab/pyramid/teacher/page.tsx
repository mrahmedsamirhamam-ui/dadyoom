import type { Metadata } from "next";
import TeacherPyramidBuilder from "@/components/learning-pyramid/TeacherPyramidBuilder";

export const metadata: Metadata = {
  title: "استوديو المعلم — إنشاء هرم ضاديوم",
  description: "قالب تحريري لإعداد هرم معرفي من ستة مستويات متدرجة للغة العربية، مع معاينة فورية ومسودة قابلة للتصدير.",
  robots: { index: false, follow: false },
};

export default function TeacherPyramidStudioPage() {
  return <TeacherPyramidBuilder />;
}
