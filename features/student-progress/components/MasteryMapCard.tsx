type MasterySkill = {
  skill: string;
  score: number;
};

type MasteryMapCardProps = {
  skills: MasterySkill[];
};

const LEARNING_SEQUENCE = [
  "الاستيعاب المباشر",
  "الاستنتاج",
  "التحليل",
  "التقويم",
  "التعبير",
  "التذوق",
] as const;

function normalizeScore(
  value: number
): number {
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(value)
    )
  );
}

function getSkillStatus(
  score: number
): string {
  if (score >= 85) {
    return "متقنة";
  }

  if (score >= 70) {
    return "قريبة من الإتقان";
  }

  if (score > 0) {
    return "قيد التطوير";
  }

  return "لم تبدأ";
}

export default function MasteryMapCard({
  skills,
}: MasteryMapCardProps) {
  const scoreBySkill =
    new Map(
      skills.map((item) => [
        item.skill.trim(),
        normalizeScore(
          item.score
        ),
      ])
    );

  const displayedSkills =
    LEARNING_SEQUENCE.map(
      (skill) => ({
        skill,
        score:
          scoreBySkill.get(
            skill
          ) ?? 0,
      })
    );

  const masteredCount =
    displayedSkills.filter(
      (item) =>
        item.score >= 85
    ).length;

  return (
    <section
      dir="rtl"
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-emerald-700">
            مسار التعلم التكيفي
          </p>

          <h2 className="mt-1 text-2xl font-black text-slate-900">
            خريطة إتقان المهارات
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            تابع تقدمك في مهارات القراءة والفهم خطوة بخطوة.
          </p>
        </div>

        <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-center">
          <div className="text-2xl font-black text-emerald-700">
            {masteredCount}
            <span className="mx-1 text-sm">
              /
            </span>
            {LEARNING_SEQUENCE.length}
          </div>

          <div className="text-xs font-bold text-emerald-800">
            مهارات متقنة
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {displayedSkills.map(
          ({
            skill,
            score,
          }) => (
            <article
              key={skill}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-black text-slate-900">
                    {skill}
                  </h3>

                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {getSkillStatus(
                      score
                    )}
                  </p>
                </div>

                <div className="text-lg font-black text-slate-800">
                  {score}%
                </div>
              </div>

              <div
                className="h-3 overflow-hidden rounded-full bg-slate-200"
                role="progressbar"
                aria-label={`نسبة إتقان ${skill}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={score}
              >
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                  style={{
                    width:
                      `${score}%`,
                  }}
                />
              </div>
            </article>
          )
        )}
      </div>
    </section>
  );
}
