"use client";
import { useEffect, useState } from "react";
import { ownerBookCandidates } from "@/lib/reading-library/books";
import { localPassportProgress, readLocalEntries, saveLocalAnswers, type LocalReadingEntry } from "@/lib/reading-library/local-progress";

export default function LocalReadingPanel() {
  const [entries, setEntries] = useState<LocalReadingEntry[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setEntries(readLocalEntries(window.localStorage));
    setReady(true);
  }, []);
  const progress = localPassportProgress(entries);
  return (
    <section aria-labelledby="books-title" className="mt-12">
      <h2 id="books-title" className="text-2xl font-black">فهرس مؤلفات صاحب المشروع</h2>
      <p className="mt-2 text-[#52685c]">هذه بيانات تعريفية فقط؛ حقوق الإتاحة الرقمية لم تُتحقق بعد، ولا تتوفر نصوص كاملة أو أسئلة مراجَعة. لا يمكن اعتماد الكتب حتى توثيق الحقوق وإضافة أسئلة يكتبها المؤلف أو يراجعها معلم.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {ownerBookCandidates.map((book) => {
          const entry = entries.find((item) => item.bookId === book.id);
          return <article key={book.id} className="rounded-2xl border bg-white p-5">
            <h3 className="text-lg font-bold">{book.title}</h3>
            <p className="mt-1 text-sm">{book.author}</p>
            <p className="mt-2 text-sm text-amber-800">حقوق الإتاحة: {book.rightsStatus}</p>
            <p className="mt-2 text-sm text-[#52685c]">الأسئلة المعتمدة: {book.questions.length} من 2–3 مطلوبة</p>
            <label htmlFor={`note-${book.id}`} className="mt-4 block text-sm font-bold">ملاحظتي الشخصية (تُحفظ على هذا الجهاز فقط)</label>
            <textarea id={`note-${book.id}`} className="mt-2 w-full rounded-lg border p-3" rows={3} value={answers[book.id] ?? ""} onChange={(event) => setAnswers((old) => ({ ...old, [book.id]: event.target.value }))} placeholder="اكتب ملاحظتك بعد قراءة الكتاب من مصدر مشروع" />
            <button type="button" className="mt-2 rounded-xl bg-[#174f47] px-4 py-2 font-bold text-white" onClick={() => setEntries(saveLocalAnswers(window.localStorage, book, [answers[book.id] ?? ""]))}>حفظ الملاحظة محليًا</button>
            {entry && <p className="mt-2 text-sm" role="status">حُفظت الملاحظة محليًا. حالة الاعتماد: غير معتمد.</p>}
          </article>;
        })}
      </div>
      <div className="mt-8 rounded-2xl border bg-white p-5" aria-live="polite">
        <h3 className="font-bold">تقدمي على هذا المتصفح فقط</h3>
        <p className="mt-2">{ready ? `${progress.completed} من 50 كتابًا معتمدًا` : "جارٍ تحميل التقدم المحلي…"}</p>
        <p className="mt-1 text-sm text-[#52685c]">لا يُزامن التقدم مع الخادم أو مع أجهزة أخرى، ويمكن حذفه عند مسح بيانات المتصفح. التقدم المحلي ليس اعتمادًا رسميًا.</p>
      </div>
    </section>
  );
}
