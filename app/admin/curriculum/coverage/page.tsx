import Link from "next/link";
import audit from "@/data/curriculum-completeness/bahrain-book-completeness-2026-2027.json";
import grade1Titles from "@/data/curriculum-completeness/bahrain-grade1-title-reconciliation-2026-2027.json";

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
  // An import delta is a reconciliation queue, never proof that a
  // textbook chapter or lesson is missing. Historic enrichment is excluded.
  const changedScopes = entries
    .filter(x => (x.liveSnapshotReconciliation?.deltaPublishedVsPreviousImported ?? 0) !== 0)
    .sort((a,b) =>
      Math.abs(b.liveSnapshotReconciliation.deltaPublishedVsPreviousImported) -
      Math.abs(a.liveSnapshotReconciliation.deltaPublishedVsPreviousImported));


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
          هذا تقرير مرجعي محفوظ في المستودع، وليس فحصًا حيًا عند فتح الصفحة.
          راجعنا أعداد جميع نطاقات الكتب {audit.summary.liveScopeReconciled} نطاقًا
          مقابل قاعدة الإنتاج بتاريخ {audit.summary.liveScopeReconciledAt}؛
          ويوجد {audit.summary.liveScopeDiscrepancies} نطاقًا تختلف أعداده عن لقطة الاستيراد القديمة.
          هذه مراجعة أعداد فقط وليست مطابقة فهرس الكتاب أو اعتماده.
          اكتمال خطة التدريس لا يثبت وحده اكتمال فهرس الكتاب المدرسي.
          يلزم مصدر رسمي وفهرس مستقل ومطابقة عناصره 1:1 قبل اعتماد أي كتاب مكتملًا.
        </p>
        <Link href="/admin/curriculum/coverage/sources" className="mt-4 ml-3 inline-flex rounded-xl border border-[#cdbb96] bg-[#fff6dc] px-5 py-3 text-sm font-black text-[#123f39]">سنوات مصادر الدروس ومسارات الثانوية ←</Link>
        <Link href="/admin/curriculum/coverage/assessments" className="mt-4 ml-3 inline-flex rounded-xl border border-[#cdbb96] bg-[#eff7ed] px-5 py-3 text-sm font-black text-[#123f39]">جودة أنشطة التقويم وأسئلته ←</Link>
        <Link href="/admin/curriculum/coverage/drafts" className="mt-4 ml-3 inline-flex rounded-xl border border-[#cdbb96] bg-[#fff6dc] px-5 py-3 text-sm font-black text-[#123f39]">مسودات البحرين وموانع النشر ←</Link>
        <Link href="/admin/curriculum/coverage/toc-review" className="mt-4 ml-3 inline-flex rounded-xl border border-[#cdbb96] bg-[#eff7ed] px-5 py-3 text-sm font-black text-[#123f39]">إدخال فهارس الكتب لمراجعة المطابقة ←</Link>
        <Link href="/admin/curriculum/coverage/unclassified" className="mt-4 inline-flex rounded-xl border border-[#cdbb96] bg-[#fff6dc] px-5 py-3 text-sm font-black text-[#123f39]">مراجعة سجلات الصف السابع غير محددة التصنيف ←</Link>
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

      <section aria-labelledby="bahrain-reconciliation-deltas" className="rounded-3xl border border-[#e2d5ba] bg-white p-6">
        <h2 id="bahrain-reconciliation-deltas" className="text-xl font-black text-[#123f39]">
          أولويات مراجعة فروق الاستيراد ({changedScopes.length} نطاقات)
        </h2>
        <p className="mt-2 text-sm leading-8 text-[#625b51]">
          الفرق بين عدد الدروس المنشورة المصنفة ضمن نطاق كتاب رسمي حاليًا
          وبين عدد عناصر لقطة الاستيراد السابقة. هذه الفروق
          <strong> ليست عدد دروس مفقودة ولا شهادة اكتمال</strong>؛
          قد تعكس تغير التصنيف أو تداخل المسارات أو إضافة مواد إثرائية.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[650px] border-collapse text-right text-sm">
            <thead>
              <tr className="border-b border-[#ded2bb] text-[#174f47]">
                <th scope="col" className="p-3">النطاق</th>
                <th scope="col" className="p-3">في اللقطة السابقة</th>
                <th scope="col" className="p-3">منشور بالنطاق الرسمي الآن</th>
                <th scope="col" className="p-3">الفرق</th>
                <th scope="col" className="p-3">مراجعة المصدر</th>
              </tr>
            </thead>
            <tbody>
              {changedScopes.map((row,index) => {
                const delta = row.liveSnapshotReconciliation.deltaPublishedVsPreviousImported;
                const grade = row.grade;
                const href = row.program === "التعليم الأساسي" && grade && grade <= 9
                  ? "/admin/curriculum/coverage/toc-review/basic/" + grade
                  : "/admin/curriculum/coverage/toc-review";
                return <tr key={row.program + "-" + scopeName(row) + "-" + index}
                  className="border-b border-[#f0e8da]">
                  <td className="p-3 font-bold">{row.program} • {scopeName(row)}</td>
                  <td className="p-3 tabular-nums">{row.liveSnapshotReconciliation.importedItemsAtPreviousAudit}</td>
                  <td className="p-3 tabular-nums">{row.liveSnapshotReconciliation.currentPublishedOfficialScopeLessons}</td>
                  <td className="p-3 font-bold tabular-nums">{delta > 0 ? "+" : ""}{delta}</td>
                  <td className="p-3"><Link href={href} className="font-bold text-[#174f47] underline">
                    فحص النطاق
                  </Link></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs leading-7 text-[#7a6250]">
          حالة معروفة: فرق الصف السابع في الفصل الثاني (-37) ناتج عن وجود 37 درسًا إثرائيًا
          غير مصنف ضمن محتوى الكتاب الرسمي الحالي، لا عن حذف هذه الدروس.
          بقية الفروق تحتاج مطابقة حقيقية للأسماء والفهارس قبل أي تصحيح.
        </p>
      </section>

      <section className="rounded-3xl border border-teal-200 bg-white p-6">
        <h2 className="text-xl font-black text-[#123f39]">الصف الأول — مطابقة أولية لعناوين الكتاب</h2>
        <p className="mt-3 text-sm leading-8 text-[#625b51]">
          في الملف المرجعي المحفوظ للجزء الأول من براعم العربية، ثبت وجود
          {grade1Titles.oneToOneStoredTitleCandidates} مرشح عنوان فريد مقابل
          {grade1Titles.expectedOutlineTitles} عنوانًا مسجلًا، مع رابط الكتاب ذاته.
          هذه مطابقة لأسماء السجلات وليست فحصًا مستقلًا لجميع صفحات الكتاب ومحتواه.
          لذلك لم نعتمد اكتمال أي كتاب.
        </p>
        <Link href="/admin/curriculum/coverage/toc-review"
          className="mt-3 inline-block text-sm font-black text-[#174f47] underline">
          تدقيق فهرس الكتاب الأصلي ومراجعة المحتوى 1:1 ←
        </Link>
      </section>

      <section className="rounded-3xl border border-sky-200 bg-white p-6">
        <h2 className="text-xl font-black text-[#123f39]">الصف السابع — الفصل الثاني: توضيح اختلاف التصنيف</h2>
        <p className="mt-3 text-sm leading-8 text-[#625b51]">
          يوجد 37 درسًا منشورًا للصف السابع بالفصل الثاني كمواد إثرائية أصلية من ضاديوم
          مستندة إلى خطة تاريخية للعام 2025–2026. هذه الدروس موجودة بالفعل
          ولم تُحذف؛ لكن لم تثبت مطابقتها لفهرس كتاب العام الدراسي 2026–2027،
          ولا يجوز ضمها إلى أعداد المقررات الرسمية الحالية تلقائيًا.
        </p>
        <Link href="/admin/curriculum/coverage/unclassified"
          className="mt-3 inline-block text-sm font-black text-[#174f47] underline">
          تدقيق الدروس غير محددة التصنيف ←
        </Link>
      </section>

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
                  <p><strong>عناوين الكتب:</strong> {(row.currentBookCatalogTitles?.length ?? 0)
                    ? (row.currentBookCatalogTitles ?? []).join("، ")
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
