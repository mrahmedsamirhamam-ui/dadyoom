import Link from "next/link";
import audit from "@/data/curriculum-completeness/bahrain-book-completeness-2026-2027.json";

type Book = (typeof audit.books)[number];
const labels: Record<string,string> = {
  COMPLETE_BOOK: "فهرس كتاب مكتمل بالمطابقة",
  PARTIAL_BOOK: "مطابقة جزئية",
  BOOK_FOUND_PENDING_TOC: "عنوان الكتاب مثبت؛ فهرسه لم يُطابق بعد",
  OFFICIAL_BOOK_NOT_FOUND: "كتاب رسمي مستقل غير مثبت",
};
function scopeName(row: Book): string {
  return [
    row.level || (row.grade ? `الصف ${row.grade}` : "مستوى"),
    row.track,
    `الفصل/الجزء ${row.semesterOrBookPart}`,
  ].filter(Boolean).join(" • ");
}
export default function BahrainCurriculumEvidence() {
  const entries = audit.books;
  const complete = entries.filter(x => x.status === "COMPLETE_BOOK").length;
  const pending = entries.filter(x => x.status === "BOOK_FOUND_PENDING_TOC").length;
  const absent = entries.filter(x => x.status === "OFFICIAL_BOOK_NOT_FOUND").length;
  const plans = entries.filter(x => x.currentPlanPublished).length;
  const programs = [...new Set(entries.map(x => x.program))];

  return <main dir="rtl" className="min-h-screen bg-[#f7f1e6] px-4 py-8 text-[#203a34]">
    <div className="mx-auto max-w-7xl space-y-7">
      <nav className="flex flex-wrap gap-3 text-sm font-bold text-[#174f47]">
        <Link href="/admin">الإدارة</Link><span>←</span>
        <Link href="/admin/curriculum">بوابة المناهج</Link><span>←</span>
        <span>تدقيق البحرين</span>
      </nav>
      <header className="rounded-3xl border border-[#d8c7a4] bg-white p-6 sm:p-9">
        <p className="text-sm font-black text-[#9a712c]">مملكة البحرين • العربية • {audit.academicYear}</p>
        <h1 className="mt-3 text-3xl font-black text-[#123f39]">تدقيق اكتمال الكتب والمناهج</h1>
        <p className="mt-4 leading-8 text-[#5b625b]">
          هذا تقرير مرجعي محفوظ في المستودع، وليس فحصًا حيًا لقاعدة البيانات.
          اكتمال خطة التدريس لا يثبت وحده اكتمال فهرس الكتاب المدرسي.
          يلزم مصدر رسمي وفهرس مستقل ومطابقة عناصره 1:1 قبل اعتماد أي كتاب مكتملًا.
        </p>
        <p className="mt-3 text-sm font-bold text-[#8b6426]">
          آخر تدقيق موثق: {audit.auditedAt} — النتائج لا تشمل تغييرات المصادر بعد هذا التاريخ.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["نطاقات المراجعة", entries.length],
            ["مكتمل بفهرس مثبت", complete],
            ["ينتظر فهرس الكتاب", pending],
            ["كتاب مستقل غير مثبت", absent],
            ["خطة حالية منشورة", plans],
          ].map(([label,value]) => <div key={label} className="rounded-2xl bg-[#f7f1e6] p-4">
            <p className="text-3xl font-black text-[#123f39]">{value}</p>
            <p className="mt-2 text-sm font-bold text-[#625b51]">{label}</p>
          </div>)}
        </div>
      </header>

      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="text-xl font-black text-amber-950">فجوات تمنع إثبات اكتمال الكتاب</h2>
        <ul className="mt-3 list-disc space-y-2 pr-6 text-sm leading-8 text-amber-950">
          {audit.summary.blockingGaps.map(gap => <li key={gap}>{gap}</li>)}
        </ul>
        <p className="mt-4 text-sm font-bold text-amber-950">
          أجزاء الكتب المستوردة دون جدول رسمي للفصل الثاني 2026–2027 لا تُعرض باعتبارها خطة فصل حالية.
        </p>
      </section>

      {programs.map(program => {
        const rows = entries.filter(x => x.program === program);
        return <section key={program} className="rounded-3xl border border-[#ddcfb4] bg-white p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-black text-[#123f39]">{program}</h2>
            <span className="rounded-full bg-[#f7ecd5] px-3 py-2 text-xs font-bold">{rows.length} نطاقًا</span>
          </div>
          <div className="mt-5 space-y-3">
            {rows.map((row,i) => {
              const title = scopeName(row);
              const source = row.currentBookCatalogSource || row.bookSourceUrl || row.catalogSourceUrl;
              return <details key={`${program}-${title}-${i}`} className="rounded-2xl border border-[#e6dcc9] bg-[#fffdf8] p-4">
                <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 font-bold">
                  <span>{title}</span>
                  <span className={row.status==="COMPLETE_BOOK"?"text-emerald-800":"text-amber-800"}>
                    {labels[row.status] || row.status}
                  </span>
                </summary>
                <div className="mt-4 space-y-2 border-t border-[#ece2cf] pt-4 text-sm leading-7">
                  <p><strong>عناوين الكتب:</strong> {row.currentBookCatalogTitles.length
                    ? row.currentBookCatalogTitles.join("، ")
                    : row.bookTitle || "لم يُثبت عنوان كتاب مستقل"}</p>
                  <p><strong>المستورَد:</strong> {row.importedItems} عنصرًا؛
                    منها {row.scheduledItems} مجدولة بخطة معلنة، و{row.unscheduledOfficialBookItems} من محتوى كتاب غير مجدول بالعام الحالي.</p>
                  <p><strong>الفهرس الأصلي:</strong> {row.bookTotalTOCItems ?? "لم يثبت عدد عناصره"}؛
                    <strong> العناصر الناقصة:</strong> {row.missingItems ?? "لا تُعرف قبل مطابقة الفهرس"}.</p>
                  <p><strong>خطة الفصل الحالية:</strong> {row.currentPlanPublished
                    ? "مثبتة في آخر تدقيق" : "غير مثبتة للعام الحالي"}.</p>
                  <p className="text-[#6f665d]">{row.notes}</p>
                  <div className="flex flex-wrap gap-4 font-black text-[#174f47]">
                    {source ? <a href={source} target="_blank" rel="noopener noreferrer" className="underline">دليل الكتاب المسجل ↗</a> : null}
                    {row.currentPlanPublished && row.planSourceUrl
                      ? <a href={row.planSourceUrl} target="_blank" rel="noopener noreferrer" className="underline">الخطة المقررة ↗</a> : null}
                    {row.grade
                      ? <Link href={`/curriculum/bh/${row.grade}`} className="underline">الدروس المعروضة للصف</Link>
                      : <Link href="/courses" className="underline">مستكشف المناهج</Link>}
                  </div>
                </div>
              </details>;
            })}
          </div>
        </section>;
      })}
    </div>
  </main>;
}
