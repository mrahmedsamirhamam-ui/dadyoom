import type { StudentSkill } from "@/types/student-dashboard";

export function SkillsCard({ skills }: { skills: StudentSkill[] }) {
  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-teal-700">📊 مستوى المهارات</p>
      <h2 className="mt-2 text-2xl font-bold">تقدمك في العربية</h2>

      <div className="mt-6 space-y-5">
        {skills.length ? (
          skills.map((skill) => (
            <div key={skill.name}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-bold">{skill.name}</span>
                <span className="text-slate-500">{skill.score}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-teal-600"
                  style={{ width: `${skill.score}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {skill.correctAttempts} إجابة صحيحة من {skill.attempts} محاولة
              </p>
            </div>
          ))
        ) : (
          <EmptyState text="ستظهر مهاراتك هنا بعد إكمال أول تقييم." />
        )}
      </div>
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-500">
      {text}
    </div>
  );
}
