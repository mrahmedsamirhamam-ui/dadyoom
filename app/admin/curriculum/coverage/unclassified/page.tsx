import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { extractBahrainPlanYear } from "@/lib/curriculum/source-plan-year";
import { isDadyoomCoreCurriculum } from "@/lib/curriculum/catalog-item-counts";

export const dynamic = "force-dynamic";

// Read-only audit. app/admin/layout.tsx restricts this route to admin users.
type Related<T> = T | T[] | null;
type Row = {
  id: string;
  title: string;
  lesson_number: number | null;
  source_pdf_url: string | null;
  source_page_start: number | null;
  units: Related<{
    title: string;
    grades: Related<{
      grade_number: number | null;
      curricula: Related<{ name_ar: string; countries: Related<{ code: string }> }>;
    }>;
  }>;
};
function first<T>(x: Related<T>): T | null {
  return Array.isArray(x) ? x[0] ?? null : x;
}
function group(rows: Row[], edition: string) {
  return rows.filter(x => extractBahrainPlanYear("BH", x.source_pdf_url) === edition);
}

export default async function GradeSevenSourceAudit() {
  const db = await createClient();
  const result = await db.from("lessons")
    .select("id,title,lesson_number,source_pdf_url,source_page_start,units!inner(title,grades!inner(grade_number,curricula!inner(name_ar,countries!inner(code))))")
    .eq("status", "published")
    .is("official_content_scope", null)
    .eq("units.grades.grade_number", 7)
    .eq("units.grades.curricula.countries.code", "BH")
    .order("lesson_number", { ascending: true })
    .limit(120);
  const matchingRows = ((result.data ?? []) as unknown as Row[]).filter(x => {
    const grade = first(first(x.units)?.grades ?? null);
    const country = first(first(grade?.curricula ?? null)?.countries ?? null);
    return grade?.grade_number === 7 && country?.code === "BH";
  });
  // Supporting Dadyoom skill lessons are deliberately unclassified by the
  // national-plan field. Never count them as missing Bahraini textbook work.
  const isSupporting = (x: Row) => {
    const grade = first(first(x.units)?.grades ?? null);
    const curriculum = first(grade?.curricula ?? null);
    return isDadyoomCoreCurriculum(curriculum?.name_ar ?? "");
  };
  const supportingCount = matchingRows.filter(isSupporting).length;
  const rows = matchingRows.filter(x => !isSupporting(x));
  const now = group(rows, "2026-2027");
  const historic = group(rows, "2025-2026");
  const unknown = rows.filter(x => !extractBahrainPlanYear("BH", x.source_pdf_url));
  const sections = [
    { title: "الخطة 2026–2027 — تحتاج مراجعة التصنيف والعنوان", items: now },
    { title: "الخطة 2025–2026 — مرجع تاريخي وليس مقررًا حاليًا مثبتًا", items: historic },
    { title: "سنة المصدر غير محددة", items: unknown },
  ];
  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f1e6] px-4 py-10 text-[#203a34]">
      <div className="mx-auto max-w-6xl space-y-6">
        <nav className="flex flex-wrap gap-3 text-sm font-bold text-[#174f47]">
          <Link href="/admin">الإدارة</Link><span>←</span>
          <Link href="/admin/curriculum/coverage">تدقيق كتب البحرين</Link><span>←</span><span>الصف السابع</span>
        </nav>
        <header className="rounded-3xl border border-[#d8c7a4] bg-white p-7">
          <h1 className="text-3xl font-black text-[#123f39]">قائمة مراجعة مصادر الصف السابع — البحرين</h1>
          <p className="mt-4 leading-8">تعرض هذه الصفحة بيانات حية للمواد المنشورة التي لم يكتمل تصنيف مصدرها.
          لا تُعدِّل الدروس أو تحذفها، ولا تعني مطابقة مصدر الخطة إثبات اكتمال فهرس الكتاب.</p>
          {result.error
            ? <p role="alert" className="mt-4 rounded-xl bg-amber-50 p-4 font-bold text-amber-900">تعذر تحميل السجلات. لا يعني ذلك خلو المنهج من النواقص.</p>
            : <div className="mt-5 flex flex-wrap gap-3 text-sm font-black">
                <span className="rounded-xl bg-[#edf4ef] px-4 py-2">دروس المناهج الرسمية غير المصنفة: {rows.length}</span>
                <span className="rounded-xl bg-[#edf4ef] px-4 py-2">خطة 2026–2027: {now.length}</span>
                <span className="rounded-xl bg-[#fff1dc] px-4 py-2">خطة 2025–2026: {historic.length}</span>
                <span className="rounded-xl bg-[#edf4ef] px-4 py-2">دروس ضاديوم الداعمة المستبعدة: {supportingCount}</span>
              </div>}
          <p className="mt-3 text-xs text-[#6f665d]">النطاق: الصف السابع فقط، والحد الأقصى 120 سجلًا، مع المصدر وفق الرابط المحفوظ في قاعدة البيانات.</p>
        </header>
        {!result.error ? sections.map(section => (
          <section key={section.title} className="rounded-3xl border border-[#d8c7a4] bg-white p-6">
            <h2 className="text-xl font-black text-[#123f39]">{section.title} ({section.items.length})</h2>
            <div className="mt-4 space-y-3">
              {section.items.map(item => (
                <article key={item.id} className="rounded-xl border border-[#e6dcc9] bg-[#fffdf8] p-4">
                  <h3 className="font-bold leading-8">{item.title}</h3>
                  <p className="mt-1 text-xs text-[#706657]">الوحدة: {first(item.units)?.title ?? "غير محددة"} • صفحة المصدر: {item.source_page_start ?? "—"}</p>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm font-black text-[#15584e]">
                    <Link href={`/lessons/${item.id}`} className="underline">فتح الدرس</Link>
                    {item.source_pdf_url?.startsWith("https://") ?
                      <a href={item.source_pdf_url} target="_blank" rel="noopener noreferrer" className="underline">فتح الخطة ↗</a> : null}
                  </div>
                </article>
              ))}
              {section.items.length === 0 ? <p className="text-sm text-[#74685a]">لا توجد سجلات ضمن هذه الفئة.</p> : null}
            </div>
          </section>
        )) : null}
      </div>
    </main>
  );
}
