import Link from "next/link";
import drafts from "@/data/curriculum-completeness/bahrain-grade2-3-sem2-original-objective-drafts-20261010.json";
import { createClient } from "@/lib/supabase/server";

// The enclosing /admin layout checks the admin role. This view never approves
// or publishes content and only looks up the 24 known lesson identifiers.
export const dynamic = "force-dynamic";

type DbDraft = {
  id: string;
  lesson_id: string;
  is_published: boolean;
  content: unknown;
  answer: unknown;
};

function object(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export default async function BahrainReadingDraftReview({
  searchParams,
}: {
  searchParams: Promise<{ grade?: string }>;
}) {
  const { grade: requestedGrade } = await searchParams;
  const grade = requestedGrade === "2" || requestedGrade === "3"
    ? Number(requestedGrade)
    : null;

  const db = await createClient();
  const { data, error } = await db
    .from("lesson_activities")
    .select("id,lesson_id,is_published,content,answer")
    .in("lesson_id", drafts.items.map((item) => item.lessonId))
    .eq("content->>origin", drafts.origin)
    .limit(40);

  const records = (data ?? []) as DbDraft[];
  const rowsByLesson = new Map(records.map((row) => [row.lesson_id, row]));
  const selected = grade
    ? drafts.items.filter((item) => item.grade === grade)
    : drafts.items;

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f1e6] px-4 py-9 text-[#203a34]">
      <div className="mx-auto max-w-5xl space-y-5">
        <nav className="flex flex-wrap gap-3 text-sm font-bold text-[#15584e]">
          <Link href="/admin">الإدارة</Link>
          <span>←</span>
          <Link href="/admin/curriculum/coverage/assessments">جودة التقييمات</Link>
        </nav>

        <header className="rounded-3xl border border-[#d8c7a4] bg-white p-7">
          <p className="text-sm font-black text-[#947035]">البحرين — الصفان الثاني والثالث — الجزء الثاني</p>
          <h1 className="mt-2 text-3xl font-black">مراجعة 24 تدريب فهم قرائي أصلي</h1>
          <p className="mt-3 leading-8">
            هذه الأسئلة مأخوذة من نصوص القراءة الداعمة الأصلية الموجودة في ضاديوم،
            وليست نقلًا من الكتاب المدرسي. لم يتم إثبات مطابقة فهرس
            العام 2026–2027، ولا يجوز اعتماد الأسئلة باعتبارها رسمية
            دون مراجعة معلم مؤهل للمحتوى والبدائل والإجابات.
          </p>
          <p className="mt-3 text-xs text-[#786e60]">
            نسخة المصدر: {drafts.createdAt} — {drafts.items.length} سؤالًا مقترحًا.
            حالة النشر المعروضة تقرأ من قاعدة البيانات وقت فتح الصفحة.
          </p>
          {error ? (
            <p role="alert" className="mt-4 rounded-xl bg-amber-50 p-4 font-black text-amber-900">
              تعذر قراءة حالة قاعدة البيانات. لا نفترض أن المسودات مفقودة أو غير منشورة.
            </p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-black">
              <span className="rounded-xl bg-[#eef6ed] px-3 py-2">
                {records.length} نشاطًا مطابقًا للمصدر في قاعدة البيانات
              </span>
              <span className="rounded-xl bg-[#fff2dc] px-3 py-2">
                {records.filter((row) => row.is_published).length} منشور — يلزم فحص الاعتماد عند الزيادة
              </span>
            </div>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            {[
              { href: "/admin/curriculum/coverage/assessments/reading-drafts", label: "كل المسودات" },
              { href: "?grade=2", label: "الصف الثاني" },
              { href: "?grade=3", label: "الصف الثالث" },
            ].map((link) => (
              <Link key={link.href} href={link.href} className="rounded-xl border border-[#bba67e] px-4 py-2 text-sm font-black text-[#15584e]">
                {link.label}
              </Link>
            ))}
          </div>
        </header>

        {selected.map((item, index) => {
          const row = rowsByLesson.get(item.lessonId);
          const content = object(row?.content);
          const unchanged = !!row &&
            content.text === item.prompt &&
            JSON.stringify(content.options) === JSON.stringify(item.options) &&
            object(row.answer).correct === item.correct;
          return (
            <article key={item.lessonId} className="rounded-2xl border border-[#d8c7a4] bg-white p-6">
              <p className="text-sm font-black text-[#8a6b33]">
                الصف {item.grade} — السؤال {index + 1} من {selected.length}
              </p>
              <h2 className="mt-2 text-xl font-black">{item.lessonTitle}</h2>
              {!error && (
                <p role="status" className="mt-3 text-sm font-black text-[#7c5820]">
                  {!row
                    ? "مسودة المصدر لم تُدرج بعد في قاعدة البيانات — لم تنشر للطلاب من هذه الصفحة"
                    : row.is_published
                      ? "النشاط منشور؛ يحتاج التأكد من موافقة المعلم والمصدر"
                      : unchanged
                        ? "غير منشور — محتوى قاعدة البيانات يطابق هذه المسودة"
                        : "غير منشور لكن محتوى قاعدة البيانات اختلف عن النسخة المحفوظة؛ راجعه"}
                </p>
              )}
              <p className="mt-4 leading-8"><strong>السؤال:</strong> {item.prompt}</p>
              <ol className="mt-2 list-decimal space-y-2 pr-6">
                {item.options.map((option) => <li key={option}>{option}</li>)}
              </ol>
              <p className="mt-3 rounded-xl bg-[#eef6ed] p-4">
                <strong>الإجابة المقترحة:</strong> {item.correct}
              </p>
              <p className="mt-3 text-sm leading-7"><strong>التفسير:</strong> {item.explanation}</p>
              <Link href={`/lessons/${item.lessonId}`} className="mt-4 inline-flex text-sm font-bold text-[#15584e] underline">
                فتح النص الداعم الأصلي للدرس ←
              </Link>
            </article>
          );
        })}
        <p className="rounded-2xl border border-[#d8c7a4] bg-white p-5 leading-8">
          <strong>شرط الاعتماد:</strong> التحقق من تطابق الإجابة مع نص الدعم
          الحالي، وصحة جميع البدائل، وملاءمة المهارة للمرحلة؛ ثم التحقق
          منفصلًا من كتاب البحرين الحالي. هذه الصفحة للعرض والمراجعة فقط،
          ولا تغيّر الإجابات أو بيانات الطلاب أو حالة النشر.
        </p>
      </div>
    </main>
  );
}
