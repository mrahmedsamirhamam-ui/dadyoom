type Props = {
  rhythm: {
    currentStreak: number;
    longestStreak: number;

    today: {
      completedLessons: number;
      active: boolean;
    };

    dailyGoal: {
      target: number;
      completed: number;
      remaining: number;
      finished: boolean;
    };
  };
};

export default function LearningRhythmCard({
  rhythm,
}: Props) {
  const goalPercent =
    Math.min(
      100,
      Math.round(
        (
          rhythm.dailyGoal.completed /
          Math.max(
            rhythm.dailyGoal.target,
            1
          )
        ) * 100
      )
    );

  return (
    <section className="rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black text-orange-600">
            🔥 الاستمرارية
          </p>

          <h2 className="mt-1 text-2xl font-black text-slate-900">
            إيقاع تعلمك
          </h2>
        </div>

        <div
          className={[
            "w-fit rounded-full px-4 py-2 text-sm font-black",
            rhythm.today.active
              ? "bg-emerald-100 text-emerald-800"
              : "bg-slate-100 text-slate-600",
          ].join(" ")}
        >
          {rhythm.today.active
            ? "✓ تعلمت اليوم"
            : "لم تبدأ هدف اليوم بعد"}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
          <div className="text-4xl">
            🔥
          </div>

          <div className="mt-2 text-3xl font-black text-orange-600">
            {rhythm.currentStreak}
          </div>

          <div className="mt-1 text-sm font-bold text-slate-500">
            سلسلة الأيام الحالية
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
          <div className="text-4xl">
            🏆
          </div>

          <div className="mt-2 text-3xl font-black text-amber-600">
            {rhythm.longestStreak}
          </div>

          <div className="mt-1 text-sm font-bold text-slate-500">
            أفضل سلسلة
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
          <div className="text-4xl">
            📚
          </div>

          <div className="mt-2 text-3xl font-black text-emerald-600">
            {rhythm.today.completedLessons}
          </div>

          <div className="mt-1 text-sm font-bold text-slate-500">
            درس مكتمل اليوم
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-black text-slate-900">
              🎯 هدف اليوم
            </div>

            <div className="mt-1 text-sm text-slate-500">
              {rhythm.dailyGoal.finished
                ? "أحسنت! أنجزت هدف اليوم."
                : `بقي ${rhythm.dailyGoal.remaining} درس للوصول إلى هدفك.`}
            </div>
          </div>

          <div
            dir="ltr"
            className="text-lg font-black text-emerald-700"
          >
            {rhythm.dailyGoal.completed}
            {" / "}
            {rhythm.dailyGoal.target}
          </div>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-600 transition-all"
            style={{
              width:
                `${goalPercent}%`,
            }}
          />
        </div>
      </div>
    </section>
  );
}