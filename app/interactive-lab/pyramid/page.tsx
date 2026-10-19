import type { Metadata } from "next";
import ArabicMasteryPyramid from "@/components/learning-pyramid/ArabicMasteryPyramid";

export const metadata: Metadata = {
  title: "هرم ضاديوم لإتقان العربية | مختبر ضاديوم",
  description: "تعلم الحال والمبتدأ والخبر في هرم تفاعلي من ستة مستويات، بأسئلة متدرجة وتغذية راجعة وتعبير إبداعي.",
  alternates: { canonical: "/interactive-lab/pyramid" },
};

export default function MasteryPyramidPage() {
  return <ArabicMasteryPyramid />;
}
