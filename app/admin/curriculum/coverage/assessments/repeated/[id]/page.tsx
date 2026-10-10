import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { extractBahrainPlanYear } from "@/lib/curriculum/source-plan-year";
import audit from "@/data/curriculum-completeness/bahrain-repeated-assessment-prompts-20261010.json";

// This route is inside the authenticated admin-only layout. Never load
// arbitrary activity IDs that are absent from the reviewed audit snapshot.
export const dynamic = "force-dynamic";
type Activity = {
  id: string;
  lesson_id: string;
  title: string | null;
  activity_type: string;
  instructions: string | null;
  prompt: string | null;
  content: unknown;
  answer: unknown;
};
function asObject(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
}
function printable(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "غير محدد";
  return JSON.stringify(value, null, 2);
}
export default async function RepeatedActivityDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const record = audit.entries.find(entry => entry.activityId === id);
  if (!record) notFound();

  const db = await createClient();
  // Both keys are checked to prevent a stale or mixed-up snapshot from
  // showing another lesson's private review item.
  const { data, error } = await db.from("lesson_activities")
    .select("id,lesson_id,title,activity_type,instructions,prompt,content,answer")
    .eq("id", record.activityId)
    .eq("lesson_id", record.lessonId)
    .eq("is_published", true)
    .maybeSingle();
  const activity = data as Activity | null;
  const question = activity?.prompt ?? asObject(activity?.content).text;
  const options = asObject(activity?.content).options;
  const answer = asObject(activity?.answer).correct ?? activity?.answer;
  const changed = activity !== null && question !== record.question;
  return <main dir="rtl" className="min-h-screen bg-[#f7f1e6] px-4 py-9 text-[#203a34]">
    <div className="mx-auto max-w-4xl space-y-5">
      <nav className="text-sm font-black text-[#15584e]">
        <Link href="/admin/curriculum/coverage/assessments/repeated">← العودة إلى الأسئلة المتكررة</Link>
      </nav>
      <header className="rounded-3xl border border-[#d8c7a4] bg-white p-6">
        <p className="text-sm font-black text-[#927132]">مراجعة سؤال منشور — دون تعديل</p>
        <h1 className="mt-2 text-2xl font-black">{record.lessonTitle}</h1>
        <p className="mt-3 leading-7">السؤال كان متكررًا في {record.repeatLessonCount} دروس من المجموعة التعليمية نفسها
          عند تدقيق {audit.auditedAt}. تكرار الصياغة لا يثبت خطأ الإجابة،
          لكنه يستلزم التحقق من قياس مهارة الدرس المستهدفة.</p>
        <p className="mt-2 text-sm text-[#756955]">
          الصف {record.grade ?? "غير قياسي"} • الفصل {record.term} •
          سنة وثيقة المصدر: {extractBahrainPlanYear("BH", record.sourcePdfUrl) ?? "غير محددة"} •
          الصفحة: {record.sourcePageStart ?? "غير محددة"}
        </p>
        <div className="mt-3 flex flex-wrap gap-4 text-sm font-black text-[#15584e]">
          <Link href={`/lessons/${record.lessonId}`} className="underline">فتح الدرس كاملًا</Link>
          {record.sourcePdfUrl?.startsWith("https://")
            ? <a href={record.sourcePdfUrl} target="_blank" rel="noopener noreferrer" className="underline">وثيقة مصدر الدرس ↗</a>
            : null}
        </div>
      </header>
      {error ? <p role="alert" className="rounded-2xl border border-amber-200 bg-white p-5">تعذر قراءة النشاط من قاعدة البيانات. لا يمكن اعتماده.</p> : null}
      {!error && !activity ? <p className="rounded-2xl border border-amber-200 bg-white p-5">هذا النشاط لم يعد موجودًا أو منشورًا في موضعه السابق. تحتاج اللقطة إلى إعادة تدقيق.</p> : null}
      {!error && activity ? <section className="space-y-4 rounded-3xl border border-[#d8c7a4] bg-white p-6">
        {changed ? <p role="status" className="rounded-xl bg-amber-50 p-4 text-sm font-black text-amber-900">
          تغيّر السؤال مقارنةً بلقطة المراجعة؛ لا تعتمد بيانات اللقطة القديمة.</p> : null}
        <h2 className="text-xl font-black">السؤال والاختيارات والإجابة المسجلة</h2>
        <p className="text-sm text-[#77634c]">{activity.title ?? "نشاط تعليمي"} — {activity.activity_type}</p>
        <p className="leading-8"><strong>السؤال:</strong> {printable(question)}</p>
        {activity.instructions ? <p className="text-sm leading-7"><strong>التعليمات:</strong> {activity.instructions}</p> : null}
        {Array.isArray(options) && options.length
          ? <div className="rounded-xl bg-[#f8f2e7] p-4"><strong>الاختيارات:</strong>
              <ul className="mt-3 list-disc space-y-2 pr-6">{options.map((opt,i)=><li key={i}>{printable(opt)}</li>)}</ul>
            </div> : <p className="text-sm">لا توجد اختيارات محفوظة بصيغة القائمة.</p>}
        <div className="rounded-xl bg-[#edf5ee] p-4">
          <strong>الإجابة المحفوظة، تحتاج تحقق معلم:</strong>
          <pre className="mt-2 whitespace-pre-wrap break-words font-sans">{printable(answer)}</pre>
        </div>
        <p className="text-sm leading-7">مطلوب قبل الإقرار: مطابقة السؤال بمهارة هذا الدرس،
          التحقق من البدائل وصحة الإجابة، مراجعة مصدر الكتاب،
          واستبدال السؤال العام بصياغة خاصة بالدرس إذا لم يقِس ناتج تعلم مناسبًا.</p>
      </section> : null}
    </div>
  </main>;
}
