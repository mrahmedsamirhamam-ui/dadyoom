import type { Metadata } from "next";
import InternationalArabicPracticeClient from "../InternationalArabicPracticeClient";

export const metadata: Metadata = {
  title: "مختبر العربية العالمي للطلاب والمعلمين | ضاديوم",
  description: "سبعة تدريبات عربية أصلية تفاعلية: IB PYP وMYP وDP، وCambridge IGCSE وPearson، مع تقويم فوري ودعم وتحدي للمعلمين.",
  alternates: { canonical: "/courses/international-arabic/practice" },
};

export default function InternationalArabicPracticePage() {
  return <InternationalArabicPracticeClient />;
}
