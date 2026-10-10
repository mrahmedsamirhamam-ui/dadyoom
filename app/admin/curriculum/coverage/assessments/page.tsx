import Link from "next/link";
import audit from "@/data/curriculum-completeness/bahrain-assessment-quality-audit-20261010.json";
import { extractBahrainPlanYear } from "@/lib/curriculum/source-plan-year";

// A versioned snapshot, not a live query. The admin layout validates access.
// Avoid expensive per-lesson aggregates during high-load Cloudflare SSR.
const grades = [...audit.buckets].sort((a,b)=>
  (a.grade_number ?? 99)-(b.grade_number ?? 99) || a.term-b.term
);
const nameFor = (row: (typeof grades)[number]) =>
  row.grade_number === null ? "التعليم المستمر" : `الصف ${row.grade_number}`;
const scopeLabel: Record<string,string> = {
  "plan-scheduled": "الخطة الحالية",
  "official-book-unscheduled": "محتوى كتاب غير مجدول",
  "UNCLASSIFIED": "المصدر غير مصنف",
};
export default function BahrainAssessmentQualityPage() {
  const data=audit.stats;
  return <main dir="rtl" className="min-h-screen bg-[#f7f1e6] px-4 py-9 text-[#203a34]">
    <div className="mx-auto max-w-7xl space-y-6">
      <nav className="flex flex-wrap gap-3 text-sm font-bold text-[#174f47]">
        <Link href="/admin">الإدارة</Link><span>←</span>
        <Link href="/admin/curriculum/coverage">مطابقة الكتب</Link><span>←</span>
        <span>تدقيق الأنشطة والتقويم</span>
      </nav>
      <header className="rounded-3xl border border-[#d8c7a4] bg-white p-6 sm:p-9">
        <p className="text-sm font-black text-[#9a712c]">البحرين — تدقيق وجود التقييمات</p>
        <h1 className="mt-2 text-3xl font-black">جودة أنشطة الدروس وأسئلتها</h1>
        <p className="mt-3 leading-8">
          يُظهر هذا التقرير الفرق بين الأسئلة المسجلة بجدول الأسئلة والأنشطة
          الموضوعية المنشورة داخل الدرس. عدد سجلات الأسئلة وحده لا يعكس
          التقييمات المتاحة. وجود نشاط لا يثبت صحته أو مطابقته للكتاب.
        </p>
        <p className="mt-3 text-sm text-[#756850]">
          نسخة البيانات: {audit.auditedAt} — لقطة موثقة وليست قراءة لحظية؛
          يلزم إعادة تدقيق قاعدة البيانات قبل إعلان اكتمال أي درس.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["دروس المناهج المحلية",data.lessons],
            ["بها اختيار من متعدد منشور",data.withPublishedMultipleChoice],
            ["بلا تقييم موضوعي منشور",data.withoutObjectiveAssessment],
            ["نشاطًا يحتاج مراجعة معلم",data.reviewRequiredActivities],
          ].map(([label,value])=>
            <div key={label} className="rounded-2xl bg-[#f7f1e6] p-4">
              <p className="text-3xl font-black tabular-nums">{value}</p>
              <p className="mt-2 text-sm font-bold text-[#5f6056]">{label}</p>
            </div>
          )}
        </div>
      </header>
      <section className="rounded-3xl border border-[#d8c7a4] bg-white p-6">
        <h2 className="text-xl font-black text-[#123f39]">مسودات تدريب حروف الصف الأول — الجزء الثاني</h2>
        <p className="mt-2 text-sm leading-7">أعددنا 12 سؤال تمييز حروف أصليًا، محفوظة في قاعدة البيانات كمسودات غير منشورة تنتظر مراجعة معلم العربية. لا تُعد مطابقة معتمدة لكتاب الفصل الثاني 2026–2027.</p>
        <Link href="/admin/curriculum/coverage/assessments/drafts" className="mt-3 inline-flex rounded-xl border border-[#cdbb96] bg-[#eef6ed] px-5 py-3 text-sm font-black text-[#123f39]">افتح المسودات وراجع الإجابات ←</Link>
      </section>
      <section className="rounded-3xl border border-[#d8c7a4] bg-white p-6">
        <h2 className="text-xl font-black text-[#123f39]">قائمة مهام المراجعة التربوية</h2>
        <p className="mt-2 text-sm leading-7">هناك {audit.reviewQueue.length} درسًا يحتوي على أنشطة موسومة بأنها تحتاج مراجعة، منها {audit.reviewQueue.filter(row => row.scope === "plan-scheduled").length} درسًا من الخطط الحالية. لا تعتمد الأنشطة تلقائيًا قبل فحصها.</p>
        <Link href="/admin/curriculum/coverage/assessments/review" className="mt-3 inline-flex rounded-xl bg-[#123f39] px-5 py-3 text-sm font-black text-white">افتح قائمة المراجعة وصفوفها ←</Link>
      </section>
      <section className="rounded-3xl border border-[#d8c7a4] bg-white p-6">
        <h2 className="text-xl font-black text-[#123f39]">الأسئلة المتكررة بين دروس مختلفة</h2>
        <p className="mt-2 text-sm leading-7">رصدنا سؤالًا عامًا واحدًا متكررًا في {404} دروس مختلفة من الخطط الحالية دون وسم مراجعة، إضافة إلى سؤال مكرر في {11} درسًا موسومًا بالمراجعة. التكرار علامة تدقيق، لا حكم تلقائي على صحة السؤال.</p>
        <Link href="/admin/curriculum/coverage/assessments/repeated" className="mt-3 inline-flex rounded-xl border border-[#cdbb96] bg-[#fff7e2] px-5 py-3 text-sm font-black text-[#123f39]">افتح قائمة الأسئلة المتكررة ←</Link>
      </section>
      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="text-lg font-black text-amber-950">الفرق المهم بين الغياب ومراجعة الجودة</h2>
        <p className="mt-3 text-sm leading-8 text-amber-950">
          {data.withoutLegacyQuestions} درسًا بلا سجل في جدول الأسئلة التقليدي،
          لكن {data.withPublishedMultipleChoice} درسًا لها اختيار من متعدد منشور.
          في الخطة الحالية هناك {data.currentPlanLessons} درسًا؛
          عدد الدروس التي بلا تقييم موضوعي منشور فيها: {data.currentPlanWithoutObjective}.
          وما زال بها {data.currentPlanReviewRequiredActivities} نشاطًا موسومًا بأنه يحتاج مراجعة.
        </p>
        <p className="mt-3 text-sm leading-7 text-amber-950">
          غياب وسم المراجعة لا يعني اعتماد النشاط. ولا تُعتبر أنشطة المؤلفات
          الأصلية مطابقة للكتاب الرسمي حتى يثبت ذلك من فهرسه ومحتواه.
        </p>
      </section>
      <section className="rounded-3xl border border-[#ddcfb4] bg-white p-5 sm:p-7">
        <h2 className="text-xl font-black">تفصيل الصفوف والفصول والمسارات</h2>
        <p className="mt-2 text-sm leading-7 text-[#6b6254]">
          الفصل الثاني يشمل محتوى كتب غير مجدول حاليًا؛ لا يُعرض على أنه
          خطة الفصل الثاني 2026–2027 المعتمدة.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[850px] w-full text-right text-sm">
            <thead><tr className="border-b bg-[#f7f1e6]">
              {["الصف / المستوى","الفصل","حالة المصدر","الدروس","بلا أسئلة تقليدية","بلا تقييم موضوعي","أنشطة تحتاج مراجعة"].map(v=>
                <th key={v} className="px-3 py-3 font-black">{v}</th>)}
            </tr></thead>
            <tbody>{grades.map((row,i)=><tr key={`${row.grade_number ?? "adult"}-${row.term}-${row.scope}-${i}`} className="border-b border-[#ece5d8]">
              <td className="px-3 py-3 font-bold">{nameFor(row)}</td>
              <td className="px-3 py-3">{row.term || "داعم"}</td>
              <td className="px-3 py-3">{scopeLabel[row.scope] ?? row.scope}</td>
              <td className="px-3 py-3 tabular-nums">{row.lessons}</td>
              <td className="px-3 py-3 tabular-nums">{row.no_legacy_questions}</td>
              <td className="px-3 py-3 tabular-nums">{row.no_objective_assessment}</td>
              <td className="px-3 py-3 tabular-nums">{row.review_required_activities}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>
      <section className="rounded-3xl border border-[#ddcfb4] bg-white p-6">
        <h2 className="text-xl font-black">الدروس التي تحتاج نشاطًا موضوعيًا</h2>
        <p className="mt-2 text-sm leading-7 text-[#665e53]">
          القائمة التالية تتضمن {audit.missingObjectiveLessons.length} درسًا محفوظًا
          من أجزاء الكتب غير المجدولة. الدروس نفسها وأنشطة القراءة أو الكتابة
          لا تزال محفوظة ولم يُحذف شيء. راجع كل درس قبل تأليف أسئلة جديدة.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {audit.missingObjectiveLessons.map(row => {
            const sourceYear = extractBahrainPlanYear("BH", row.source_pdf_url);
            return <div key={row.id} className="rounded-xl border border-[#e8ddc9] bg-[#fffdf8] p-4">
              <p className="font-black">{row.title}</p>
              <p className="mt-1 text-xs text-[#6d6356]">الصف {row.grade_number} — الجزء {row.term}</p>
              <p className="mt-2 text-xs font-bold text-[#855f25]">
                سنة وثيقة المصدر: {sourceYear ?? "غير موثقة من الرابط"}
                {sourceYear === "2025-2026" ? " — مصدر تاريخي؛ لا يثبت خطة 2026–2027" : null}
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm font-black text-[#15584e]">
                <Link href={`/lessons/${row.id}`} className="underline">راجع هذا الدرس ←</Link>
                {row.source_pdf_url?.startsWith("https://") ?
                  <a href={row.source_pdf_url} target="_blank" rel="noopener noreferrer" className="underline">
                    فتح وثيقة المصدر ↗
                  </a> : null}
              </div>
            </div>;
          })}
        </div>
      </section>
    </div>
  </main>;
}
