import type { Metadata } from "next";
import ArabicMasteryPyramid from "@/components/learning-pyramid/ArabicMasteryPyramid";

export const metadata: Metadata = {
  title: "هرم ضاديوم لإتقان العربية | مختبر ضاديوم",
  description: "تعلم الحال والمبتدأ والخبر في هرم تفاعلي من ستة مستويات، بأسئلة متدرجة وتغذية راجعة وتعبير إبداعي.",
  alternates: { canonical: "/interactive-lab/pyramid" },
};

export default async function MasteryPyramidPage({
  searchParams,
}: {
  searchParams: Promise<{ pack?: string | string[] }>;
}) {
  const params = await searchParams;
  const initialSlug = typeof params.pack === "string" ? params.pack : undefined;
  return <ArabicMasteryPyramid initialSlug={initialSlug} />;
}
