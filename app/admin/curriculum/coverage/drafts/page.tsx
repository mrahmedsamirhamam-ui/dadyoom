import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type IdRow = { id: string };
type Grade = { id: string; grade_number: number | null; name_ar: string };
type Unit = { id: string; grade_id: string; title: string };
type Draft = {
  id: string;
  title: string;
  status: string;
  unit_id: string;
  source_pdf_url: string | null;
  source_page_start: number | null;
  source_page_end: number | null;
  summary: string | null;
  content: string | null;
};

function warningReasons(
  draft: Draft,
  publishedActivities: number,
  assessmentQuestions: number,
) {
  const reasons: string[] = [];
  if (!draft.source_pdf_url?.trim()) reasons.push("لا يوجد رابط لمرجع الكتاب");
  if (!draft.source_page_start || !draft.source_page_end) reasons.push("صفحات المصدر غير موثقة");
  if (!draft.content?.trim()) reasons.push("نص الدرس فارغ");
  if (publishedActivities === 0) reasons.push("لا توجد أنشطة منشورة");
  if (assessmentQuestions === 0) reasons.push("لا توجد أسئلة تقييم");
  // An apparently long paragraph can still be a generic imported template.
  if (/^يتناول هذا الدرس موضوع «/u.test(draft.content?.trim() ?? "")) {
    reasons.push("شرح عام آلي يحتاج مطابقة ومراجعة");
  }
  if (/^(?:الدّرس|الدرس)(?:\s|$)/u.test(draft.title.trim())) {
    reasons.push("عنوان عام يحتاج مطابقة بالكتاب");
  }
  return reasons;
}

function Failed({ message }: { message: string }) {
  return (
    <main dir="rtl" className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-black text-[#123f39]">مراجعة مسودات البحرين</h1>
      <p className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950">
        تعذر إكمال تدقيق البيانات: {message}. لم يتم نشر أو تعديل أي درس.
      </p>
    </main>
  );
}

/**
 * Read-only administrative queue, never an approval or bulk-publishing action.
 * Do not infer an official textbook match from imported lesson titles.
 */
export default async function BahrainDraftReviewPage() {
  const db = await createClient();

  const country = await db.from("countries").select("id").eq("code", "BH").maybeSingle();
  if (country.error) return <Failed message="الدولة" />;
  if (!country.data) return <Failed message="لم يُعثر على سجل البحرين" />;

  const curricula = await db.from("curricula").select("id").eq("country_id", country.data.id);
  if (curricula.error) return <Failed message="المناهج" />;
  const curriculumIds = ((curricula.data ?? []) as IdRow[]).map(row => row.id);
  if (!curriculumIds.length) return <Failed message="لا توجد مناهج بحرينية" />;

  const gradesResult = await db.from("grades")
    .select("id,grade_number,name_ar").in("curriculum_id", curriculumIds);
  if (gradesResult.error) return <Failed message="الصفوف" />;
  const grades = (gradesResult.data ?? []) as Grade[];
  if (!grades.length) return <Failed message="لا توجد صفوف بحرينية" />;

  const unitsResult = await db.from("units")
    .select("id,grade_id,title").in("grade_id", grades.map(grade => grade.id));
  if (unitsResult.error) return <Failed message="الوحدات" />;
  const units = (unitsResult.data ?? []) as Unit[];
  if (!units.length) return <Failed message="لا توجد وحدات بحرينية" />;

  const draftsResult = await db.from("lessons")
    .select("id,title,status,unit_id,source_pdf_url,source_page_start,source_page_end,summary,content")
    .eq("status", "draft").in("unit_id", units.map(unit => unit.id))
    .order("title", { ascending: true }).limit(500);
  if (draftsResult.error) return <Failed message="المسودات" />;
  const drafts = (draftsResult.data ?? []) as Draft[];

  // Review published lessons whose original OCR extract remains unresolved.
  // They remain published and must be matched against the *textbook* before
  // claiming that a plan-page reference verifies the lesson content.
  const ocrResult = await db.from("lessons")
    .select("id,title,unit_id,source_pdf_url,source_page_start,source_page_end,official_content_scope")
    .eq("status", "published")
    .ilike("content", "%مدخل OCR غير محسوم%")
    .in("unit_id", units.map(unit => unit.id))
    .order("title", { ascending: true }).limit(200);
  if (ocrResult.error) return <Failed message="سجلات OCR المنشورة" />;
  const ocrReviews = ocrResult.data ?? [];

  const draftIds = drafts.map(draft => draft.id);

  const [activitiesResult, questionsResult] = draftIds.length
    ? await Promise.all([
      db.from("lesson_activities").select("lesson_id").eq("is_published", true)
        .in("lesson_id", draftIds).limit(5000),
      db.from("questions").select("lesson_id").in("lesson_id", draftIds).limit(5000),
    ])
    : [{ data: [], error: null }, { data: [], error: null }];
  if (activitiesResult.error || questionsResult.error) {
    return <Failed message="الأنشطة أو الأسئلة" />;
  }

  const activityCounts = new Map<string, number>();
  for (const item of activitiesResult.data ?? []) {
    const id = String(item.lesson_id);
    activityCounts.set(id, (activityCounts.get(id) ?? 0) + 1);
  }
  const questionCounts = new Map<string, number>();
  for (const item of questionsResult.data ?? []) {
    const id = String(item.lesson_id);
    questionCounts.set(id, (questionCounts.get(id) ?? 0) + 1);
  }

  const unitMap = new Map(units.map(unit => [unit.id, unit]));
  const gradeMap = new Map(grades.map(grade => [grade.id, grade]));
  const reviewed = drafts.map(draft => {
    const unit = unitMap.get(draft.unit_id);
    const grade = unit ? gradeMap.get(unit.grade_id) : null;
    const reasons = warningReasons(
      draft, activityCounts.get(draft.id) ?? 0, questionCounts.get(draft.id) ?? 0,
    );
    return { draft, unit, grade, reasons };
  }).sort((a, b) =>
    (a.grade?.grade_number ?? 999) - (b.grade?.grade_number ?? 999)
    || a.draft.title.localeCompare(b.draft.title, "ar"),
  );

  const insufficient = reviewed.filter(item => item.reasons.length > 0).length;
  const gradeNumbers = [...new Set(reviewed.map(item => item.grade?.grade_number))]
    .filter((n): n is number => typeof n === "number").sort((a, b) => a - b);

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f1e6] px-4 py-8 text-[#203a34]">
      <div className="mx-auto max-w-6xl space-y-6">
        <nav className="flex flex-wrap gap-2 text-sm font-bold text-[#174f47]">
          <Link href="/admin">الإدارة</Link><span>←</span>
          <Link href="/admin/curriculum/coverage">تدقيق البحرين</Link><span>←</span>
          <span>مسودات تحتاج مراجعة</span>
        </nav>
        <header className="rounded-3xl border border-[#d8c7a4] bg-white p-6">
          <p className="text-sm font-black text-[#986d28]">مراجعة حية • البحرين • لا تعديل للبيانات</p>
          <h1 className="mt-2 text-3xl font-black text-[#123f39]">قائمة مسودات الدروس غير المعتمدة</h1>
          <p className="mt-3 leading-7 text-[#59635d]">
            يعرض هذا التقرير مسودات البحرين من قاعدة البيانات وحاجتها إلى المصدر الرسمي
            والأنشطة والتقويم. اكتمال هذه المؤشرات لا يساوي اعتمادًا تربويًا أو مطابقة
            فهرس الكتاب؛ الاعتماد يحتاج مراجعة المعلم للمصدر والدرس.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm font-black">
            <span className="rounded-xl bg-[#edf5f1] px-4 py-3">المسودات: {reviewed.length}</span>
            <span className="rounded-xl bg-amber-50 px-4 py-3 text-amber-900">
              تحتاج استكمالًا: {insufficient}
            </span>
            <span className="rounded-xl bg-[#f7f1e6] px-4 py-3">
              الصفوف: {gradeNumbers.length}
            </span>
            <span className="rounded-xl bg-rose-50 px-4 py-3 text-rose-900">
              محتوى منشور ينتظر تدقيق OCR: {ocrReviews.length}
            </span>
          </div>
          {drafts.length === 500 ? (
            <p className="mt-3 text-sm font-bold text-red-700">
              تم الوصول لحد عرض 500 مسودة. الأعداد جزئية ويجب تدقيق البقية.
            </p>
          ) : null}
        </header>
        <section className="rounded-3xl border border-rose-200 bg-white p-5">
          <h2 className="text-xl font-black text-[#123f39]">
            مراجعة OCR للمحتوى المنشور — {ocrReviews.length} سجلًا
          </h2>
          <p className="mt-2 text-sm leading-7 text-[#675c4c]">
            هذه دروس منشورة، وليست ضمن المسودات أدناه. وجود مصدر من خطة التدريس
            لا يثبت تطابق عنوان الدرس مع فهرس كتاب الطالب؛ والمحتوى الإثرائي لا
            يُنسب إلى الوزارة. لا تتغير حالة أي درس تلقائيًا.
          </p>
          {ocrReviews.length === 200 ? (
            <p className="mt-3 text-sm font-bold text-red-700">
              وصل العرض إلى حد 200 سجل؛ الأعداد جزئية ويجب فحص البقية.
            </p>
          ) : null}
          <div className="mt-4 space-y-3">
            {ocrReviews.map(lesson => {
              const unit = unitMap.get(lesson.unit_id);
              const grade = unit ? gradeMap.get(unit.grade_id) : null;
              const referenceIsPlan = (lesson.source_pdf_url ?? "").includes("/plans");
              return (
                <article key={lesson.id} className="rounded-2xl border border-rose-100 bg-[#fffdf8] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black">{lesson.title}</h3>
                      <p className="mt-1 text-xs text-[#776e62]">
                        {grade?.name_ar ?? "صف غير محدد"} • {unit?.title ?? "وحدة غير محددة"}
                      </p>
                    </div>
                    <Link href={`/admin/lessons/${lesson.id}`} prefetch={false}
                      className="rounded-xl border border-[#cdbb96] px-3 py-2 text-sm font-bold text-[#174f47]">
                      فتح الدرس للمطابقة
                    </Link>
                  </div>
                  <p className="mt-2 text-sm text-rose-900">
                    {referenceIsPlan
                      ? "المرجع الحالي خطة تدريس؛ صفحة الخطة ليست صفحة الكتاب."
                      : "يلزم فحص المرجع وفهرس الكتاب الأصلي قبل اعتماد العنوان."}
                    {" "}حالة OCR غير محسومة ويجب مراجعة العنوان والنص والتدريبات.
                  </p>
                  {lesson.source_pdf_url?.startsWith("https://") ? (
                    <a href={lesson.source_pdf_url} target="_blank" rel="noopener noreferrer"
                      className="mt-2 inline-block text-sm font-bold text-[#174f47] underline">
                      فتح مرجع السجل ↗
                    </a>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
        {gradeNumbers.map(number => {
          const items = reviewed.filter(item => item.grade?.grade_number === number);
          return (
            <section key={number} className="rounded-3xl border border-[#ddd0b5] bg-white p-5">
              <h2 className="text-xl font-black text-[#123f39]">
                الصف {number} — {items.length} مسودة
              </h2>
              <div className="mt-4 space-y-3">
                {items.map(({ draft, unit, reasons }) => (
                  <article key={draft.id} className="rounded-2xl border border-[#e9dec9] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black">{draft.title}</h3>
                        <p className="mt-1 text-xs text-[#776e62]">{unit?.title ?? "وحدة غير محددة"}</p>
                      </div>
                      <Link
                        href={`/admin/lessons/${draft.id}`}
                        prefetch={false}
                        className="rounded-xl border border-[#cdbb96] px-3 py-2 text-sm font-bold text-[#174f47]"
                      >فتح الدرس للمراجعة</Link>
                    </div>
                    <p className="mt-3 text-sm text-amber-950">
                      {reasons.length ? reasons.join(" • ") : "المؤشرات التقنية موجودة، والمطابقة التربوية مطلوبة"}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
        {reviewed.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 font-bold">
            لا توجد مسودات بحرينية حاليًا. هذا لا يثبت اكتمال فهارس الكتب.
          </p>
        ) : null}
      </div>
    </main>
  );
}
