import type { Metadata } from "next";
import BahrainOriginalLearningPilots from "@/components/lesson/BahrainOriginalLearningPilots";

export const metadata: Metadata = {
  title: "مختبر البحرين التعليمي التجريبي | ضاديوم",
  description: "ثلاث تجارب تعليمية عربية أصلية للصف السادس، للاختبار والمراجعة التربوية.",
  robots: { index: false, follow: false },
};

export default function BahrainOriginalPilotsPage() {
  return <main className="min-h-screen bg-[#f7f5ee]"><BahrainOriginalLearningPilots /></main>;
}
