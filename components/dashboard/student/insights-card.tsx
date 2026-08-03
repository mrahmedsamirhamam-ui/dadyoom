import type {
  LatestAssessment,
  StudentMistake,
} from "@/types/student-dashboard";

type InsightsCardProps = {
  mistakes: StudentMistake[];
  latestAssessment: LatestAssessment | null;
};

export function InsightsCard({
  mistakes,
  latestAssessment,
}: InsightsCardProps) {
  return (
    <section className="space-y-6">
      <article className="rounded-3xl border border-rose-100 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-rose-700">🧩 أخطاء تحتاج للمراجعة</p>
        <h2 className="mt-2 text-2xl font-bold">فرص التحسن</h2>

        <div className="mt-5 space-y-3">
          {mistakes.length ? (
            mistakes.map((mistake) => (
              <div
                key={mistake.category}
                className="flex items-center justify-between rounded-2xl bg-rose-50 px-4 py-3"
              >
                <span className="font-semibold text-rose-950">
                  {mistake.category}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-rose-700">
                  {mistake.count} مرات
                </span>
              </div>
            ))
          ) : (
            <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
              لا توجد أخطاء متكررة مسجلة حتى الآن.
            </p>
          )}
        </div>
      </article>

      <article className="rounded-3xl border border-amber-100 bg-amber-50 p-6 shadow-sm">
        <p className="text-sm font-semibold text-amber-700">📝 آخر تقييم</p>

        {latestAssessment ? (
          <>
            <div className="mt-3 flex items-end gap-2">
              <strong className="text-4xl text-amber-950">
                {latestAssessment.score}
              </strong>
              <span className="pb-1 text-amber-700">/ 100</span>
            </div>
            <p className="mt-4 font-bold text-amber-950">
              {latestAssessment.teacherComment}
            </p>
            <p className="mt-2 text-sm leading-7 text-amber-800">
              {latestAssessment.feedback}
            </p>
          </>
        ) : (
          <p className="mt-4 text-sm leading-7 text-amber-800">
            أكمل أول تقييم ليظهر تعليق معلمك الذكي هنا.
          </p>
        )}
      </article>
    </section>
  );
}
