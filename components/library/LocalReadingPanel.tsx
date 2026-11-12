"use client";
import { useEffect, useState } from "react";
import { ownerBookCandidates } from "@/lib/reading-library/books";
import { localPassportProgress, readLocalEntries, saveLocalAnswers, type LocalReadingEntry } from "@/lib/reading-library/local-progress";

const stages = [
  { name: "الأحمر", color: "bg-red-600" },
  { name: "الأخضر", color: "bg-green-700" },
  { name: "الأزرق", color: "bg-blue-700" },
  { name: "الفضي", color: "bg-slate-500" },
  { name: "الذهبي", color: "bg-amber-600" },
];
export default function LocalReadingPanel() {
  const [entries, setEntries] = useState<LocalReadingEntry[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    try {
      const saved = readLocalEntries(window.localStorage);
      setEntries(saved);
      setAnswers(Object.fromEntries(saved.map((entry) => [entry.bookId, entry.answers[0] ?? ""])));
    } catch { setNotice("تعذر قراءة بيانات المتصفح المحلية."); }
    setReady(true);
  }, []);
  const progress = localPassportProgress(entries);
  function saveNote(book: (typeof ownerBookCandidates)[number]) {
    try {
      setEntries(saveLocalAnswers(window.localStorage, book, [answers[book.id] ?? ""]));
      setNotice("حُفظت الملاحظة محليًا دون اعتماد الكتاب.");
    } catch { setNotice("تعذر الحفظ على هذا الجهاز. تحقق من إعدادات المتصفح."); }
  }
  return (
    <>
      <section aria-labelledby="passports" className="mt-12">
        <h2 id="passports" className="text-2xl font-black">جوازات القراءة التدريبية</h2>
        <p className="mt-2 text-[#52685c]">خمس مراحل من عشرة كتب، بحد أقصى خمسين كتابًا مختلفًا. لا اعتماد تلقائي ولا جوازات رسمية.</p>
        <ol className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {progress.passports.map((passport, index) => (
            <li key={passport.stage} className="rounded-2xl border bg-white p-4 text-center">
              <span aria-hidden="true" className={`mx-auto block h-3 w-12 rounded-full ${stages[index].color}`} />
              <p className="mt-3 font-bold">الجواز {stages[index].name}</p>
              <p className="mt-1 text-sm text-[#52685c]">{passport.completed} من {passport.target}</p>
              <p className="mt-1 text-xs text-[#52685c]">{passport.finished ? "مكتمل" : passport.unlocked ? "غير مكتمل" : "مغلق"}</p>
            </li>
          ))}
        </ol>
      </section>
      <section aria-labelledby="books-title" className="mt-12">
        <h2 id="books-title" className="text-2xl font-black">فهرس مؤلفات صاحب المشروع</h2>
        <p className="mt-2 text-[#52685c]">بيانات تعريفية فقط؛ حقوق الإتاحة الرقمية والأسئلة المراجَعة غير متوفرة بعد. لا تُعتمد الكتب في هذه النسخة.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {ownerBookCandidates.map((book) => {
            const entry = entries.find((item) => item.bookId === book.id);
            return <article key={book.id} className="rounded-2xl border bg-white p-5">
              <h3 className="text-lg font-bold">{book.title}</h3>
              <p className="mt-1 text-sm">{book.author}</p>
              <p className="mt-2 text-sm text-amber-800">حقوق الإتاحة: {book.rightsStatus}</p>
              <p className="mt-2 text-sm text-[#52685c]">أسئلة فهم مراجَعة: {book.questions.length} من 2–3 مطلوبة</p>
              <label htmlFor={`note-${book.id}`} className="mt-4 block text-sm font-bold">ملاحظتي الشخصية (تُحفظ على هذا الجهاز فقط)</label>
              <textarea id={`note-${book.id}`} className="mt-2 w-full rounded-lg border p-3" rows={3} maxLength={4000} value={answers[book.id] ?? ""} onChange={(event) => setAnswers((old) => ({ ...old, [book.id]: event.target.value }))} placeholder="اكتب ملاحظتك بعد قراءة الكتاب من مصدر مشروع" />
              <button type="button" className="mt-2 rounded-xl bg-[#174f47] px-4 py-2 font-bold text-white" onClick={() => saveNote(book)}>حفظ الملاحظة محليًا</button>
              {entry && <p className="mt-2 text-sm">ملاحظة محفوظة — الكتاب غير معتمد.</p>}
            </article>;
          })}
        </div>
        <div className="mt-8 rounded-2xl border bg-white p-5" aria-live="polite">
          <h3 className="font-bold">تقدمي على هذا المتصفح فقط</h3>
          <p className="mt-2">{ready ? `${progress.completed} من 50 كتابًا معتمدًا` : "جارٍ تحميل التقدم المحلي…"}</p>
          <p className="mt-1 text-sm text-[#52685c]">لا مزامنة أو شهادات. حذف بيانات المتصفح يحذف الملاحظات؛ الاعتماد مؤجل لحين تحقق بشري موثوق.</p>
          {notice && <p className="mt-2 text-sm" role="status">{notice}</p>}
        </div>
      </section>
    </>
  );
}
