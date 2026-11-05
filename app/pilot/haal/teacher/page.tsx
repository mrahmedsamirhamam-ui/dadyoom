import Link from "next/link";
import {
  ASSESSMENT_TOOLS,
  HALL_RUBRIC,
  STRATEGY_CARDS,
  buildTeacherGoalOverview,
  createFictionalClass,
} from "@/lib/adaptive-goal-paths/teacher-overview.mjs";

export const metadata = {
  title: "معاينة لوحة المعلم — مسارات التعلم المتمايز",
  description: "معاينة تعليمية ببيانات افتراضية مجمعة للهدف التعليمي، دون سجلات طلاب حقيقية.",
  robots: { index: false, follow: false },
};

export default function TeacherGoalPilotPage() {
  // Static fictional class, NOT a school/classroom Supabase query.
  const overview = buildTeacherGoalOverview(createFictionalClass(30));
  const ratio = (count: number) => overview.total ? Math.round((count / overview.total) * 100) : 0;

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7faf7] px-4 py-6 text-[#173f38] sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="space-y-3">
          <nav aria-label="العودة إلى نموذج الطالب" className="text-sm">
            <Link href="/pilot/haal" className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4">
              العودة إلى تجربة الطالب
            </Link>
          </nav>
          <div className="inline-flex items-center rounded-full border border-amber-500 bg-amber-50 px-3 py-1 text-sm font-extrabold text-amber-900">
            معاينة توضيحية — البيانات افتراضية بالكامل
          </div>
          <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">لوحة المعلم: هدف واحد ومسارات متعددة</h1>
          <p className="max-w-3xl text-sm leading-8">
            هذه صفحة تصميم قابلة للتجربة، وليست لوحة طالب أو معلم حقيقية. لا تتصل بحسابات أو قواعد بيانات الطلاب،
            ولا تتضمن أي أسماء أو نتائج فعلية أو إحصاءات عن أداء ضاديوم.
          </p>
        </header>

        <section aria-labelledby="goal-summary" className="rounded-2xl border border-[#d9e5db] bg-white p-5">
          <h2 id="goal-summary" className="text-xl font-extrabold">هدف التعلم المشترك</h2>
          <p className="mt-2 text-base leading-8">{overview.objective}</p>
          <p className="mt-2 text-sm text-[#57776e]">الحال — الصف السابع — معيار تحقق موحّد: 4 من 5 أسئلة على الأقل.</p>
        </section>

        <section aria-label="مؤشرات صف افتراضي" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { title: "حالات افتراضية", value: overview.total, explain: "عينة تصميم فقط" },
            { title: "اجتازوا تحققًا واحدًا", value: overview.checkPasses, explain: "ليس إتقانًا معتمدًا" },
            { title: "يستفيدون من دعم إضافي", value: overview.supportInvites, explain: "اقتراح إيجابي، لا تصنيف ثابت" },
          ].map(card => (
            <article key={card.title} className="rounded-2xl border border-[#d9e5db] bg-white p-5">
              <p className="font-semibold text-[#536d63]">{card.title}</p>
              <strong className="mt-2 block text-4xl">{card.value}</strong>
              <p className="mt-2 text-xs leading-6 text-[#58736a]">{card.explain}</p>
            </article>
          ))}
        </section>

        <section aria-labelledby="path-summary" className="rounded-2xl border border-[#d9e5db] bg-white p-5">
          <h2 id="path-summary" className="text-xl font-extrabold">المسارات المختارة لهذا الهدف فقط</h2>
          <p className="mt-2 text-sm leading-7">لا نقارن الطلاب بأسمائهم ولا نثبت مسارًا دائمًا. لكل هدف توزيع مستقل.</p>
          <div className="mt-5 space-y-4">
            {overview.paths.map(row => (
              <div key={row.path}>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-bold">{row.label}</span>
                  <span>{row.count} حالة افتراضية ({ratio(row.count)}%)</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-[#e8efe9]">
                  <div
                    role="img"
                    aria-label={row.label + ": " + row.count + " من " + overview.total}
                    className="h-full rounded-full bg-[#17665b]"
                    style={{ width: ratio(row.count) + "%" }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-xl bg-[#f6f1e2] p-3 text-sm leading-7">
            جميع السجلات الافتراضية في المعاينة غير متحقق منها على خادم. لذلك لا تظهر درجة إتقان رسمية.
          </p>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-2xl border border-[#d9e5db] bg-white p-5" aria-labelledby="mistake-title">
            <h2 id="mistake-title" className="text-lg font-extrabold">أنماط الأخطاء التي قد يحتاجها المعلم</h2>
            <ul className="mt-3 space-y-2 text-sm leading-7">
              {overview.misconceptions.map(item => (
                <li key={item.kind} className="flex justify-between gap-3 rounded-xl bg-[#f7faf7] px-3 py-2">
                  <span>{item.label}</span>
                  <span className="font-bold">{item.count} حالات تمثيلية</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm">يمكن اختيار نشاط علاجي أو إثرائي لكل هدف، بعد مراجعة المعلم.</p>
          </section>

          <section className="rounded-2xl border border-[#d9e5db] bg-white p-5" aria-labelledby="next-action">
            <h2 id="next-action" className="text-lg font-extrabold">خطوات تدريس مقترحة</h2>
            <ol className="mt-3 list-decimal space-y-2 pr-5 text-sm leading-7">
              <li>عند الخلط بين الحال وصاحبه: مثال محلول مع سؤال «كيف؟».</li>
              <li>عند اعتبار الفعل حالًا: صنّف الفعل والوصف في جملتين جديدتين.</li>
              <li>لمن حقق معيار التحقق: أضف جملة يكون صاحب الحال فيها مفعولًا به.</li>
              <li>أعد التقييم بأسئلة مكافئة، وليس بالأمثلة نفسها فقط.</li>
            </ol>
            <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs leading-6">
              لا يصدر هذا النموذج إسنادًا لطلاب حقيقيين؛ يعتمد المعلم الاقتراح قبل أي إجراء مستقبلي.
            </p>
          </section>
        </div>

        <section className="rounded-2xl border border-[#d9e5db] bg-white p-5">
          <details>
            <summary className="min-h-11 cursor-pointer text-lg font-extrabold">مكتبة استراتيجيات التدريس ({STRATEGY_CARDS.length})</summary>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {STRATEGY_CARDS.map(card => (
                <article key={card.id} className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                  <h3 className="font-bold">{card.title}</h3>
                  <p className="mt-1 text-sm leading-7"><strong>متى؟ </strong>{card.fit}</p>
                  <p className="text-sm leading-7"><strong>كيف؟ </strong>{card.action}</p>
                  <p className="text-sm leading-7 text-amber-900"><strong>تجنب: </strong>{card.pitfall}</p>
                </article>
              ))}
            </div>
          </details>
        </section>

        <section className="rounded-2xl border border-[#d9e5db] bg-white p-5">
          <details>
            <summary className="min-h-11 cursor-pointer text-lg font-extrabold">أدوات التقييم المتنوعة ({ASSESSMENT_TOOLS.length})</summary>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {ASSESSMENT_TOOLS.map(tool => (
                <article key={tool.id} className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                  <h3 className="font-bold">{tool.name}</h3>
                  <p className="mt-1 text-sm leading-7">{tool.use}</p>
                  <p className="mt-1 text-sm leading-7 text-[#58736a]">{tool.criterion}</p>
                </article>
              ))}
            </div>
          </details>
        </section>

        <section aria-labelledby="rubric-title" className="rounded-2xl border border-[#d9e5db] bg-white p-5">
          <h2 id="rubric-title" className="text-xl font-extrabold">سلم تقدير (Rubric) موحد للهدف</h2>
          <p className="mt-1 text-sm leading-7">
            جميع المسارات تستخدم معيار صحة تحديد الحال وصاحبه؛ الاختلاف في نوع المهمة والدعم.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-[580px] w-full border-collapse text-right text-sm">
              <thead className="bg-[#f1f6f1]">
                <tr><th className="p-3">المعيار</th><th className="p-3">0</th><th className="p-3">1</th><th className="p-3">2</th></tr>
              </thead>
              <tbody>
                {HALL_RUBRIC.criteria.map(row => (
                  <tr key={row.id} className="border-t border-stone-200">
                    <th scope="row" className="p-3 font-bold">{row.label}</th>
                    {row.levels.map((level, i) => <td key={i} className="p-3">{level}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="rounded-xl border border-amber-300 bg-[#fff9e9] p-4 text-sm leading-8">
          <p className="font-bold">ضابط الخصوصية والجودة</p>
          <p>{overview.privacyNote}</p>
          <p>قبل الاستخدام الحقيقي: مصادقة صلاحيات المعلم، عزل بيانات الصف والمدرسة، رضا ولي الأمر، مراجعة بشرية للمحتوى، ومقارنة الاختبارات القبلية والبعدية خلال تجربة 30 طالبًا.</p>
        </footer>
      </div>
    </main>
  );
}
