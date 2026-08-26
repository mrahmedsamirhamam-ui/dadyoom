type Props = {
  profile: {
    current_level: number;
    total_xp: number;
    average_score: number;
    completed_lessons: number;
    mastered_lessons: number;
    learning_speed: string;
  };
};

export default function LearningProfileCard({
  profile,
}: Props) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">

      <h2 className="mb-5 text-2xl font-bold">
        ملف التعلم
      </h2>

      <div className="grid gap-4 md:grid-cols-3">

        <div>
          <div className="text-slate-500">
            المستوى
          </div>

          <div className="text-3xl font-bold">
            {profile.current_level}
          </div>
        </div>

        <div>
          <div className="text-slate-500">
            متوسط الدرجات
          </div>

          <div className="text-3xl font-bold">
            {profile.average_score}%
          </div>
        </div>

        <div>
          <div className="text-slate-500">
            سرعة التعلم
          </div>

          <div className="text-3xl font-bold">
            {profile.learning_speed}
          </div>
        </div>

      </div>

    </section>
  );
}
