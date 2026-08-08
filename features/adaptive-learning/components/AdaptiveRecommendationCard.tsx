import Link from "next/link";
import type { AdaptiveRecommendation } from "../types/adaptive";

type Props = {
  recommendation: AdaptiveRecommendation;
};

export default function AdaptiveRecommendationCard({
  recommendation,
}: Props) {
  const className =
    recommendation.decision === "mastered"
      ? "border-emerald-300 bg-emerald-50"
      : recommendation.decision === "continue"
        ? "border-blue-300 bg-blue-50"
        : recommendation.decision === "review"
          ? "border-amber-300 bg-amber-50"
          : "border-red-300 bg-red-50";

  return (
    <section
      className={`rounded-3xl border p-6 ${className}`}
    >
      <h2 className="text-2xl font-bold">
        توصية ضاديوم
      </h2>

      <p className="mt-3 leading-8">
        {recommendation.message}
      </p>

      <p className="mt-3 font-bold">
        النتيجة: {recommendation.score}%
      </p>

      {recommendation.weakQuestionIds.length > 0 ? (
        <p className="mt-2 text-sm">
          عدد الأسئلة التي تحتاج مراجعة:{" "}
          {
            recommendation
              .weakQuestionIds.length
          }
        </p>
      ) : null}

      {recommendation.recommendedLessonId ? (
        <Link
          href={`/lessons/${recommendation.recommendedLessonId}`}
          className="mt-5 inline-block rounded-xl bg-slate-900 px-5 py-3 font-bold text-white"
        >
          {recommendation.decision ===
          "mastered"
            ? "الانتقال إلى الدرس التالي"
            : "بدء المراجعة"}
        </Link>
      ) : null}
    </section>
  );
}