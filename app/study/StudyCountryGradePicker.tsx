"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatArabicCount } from "@/lib/i18n/arabic-count";

type Country = { code: string; name: string };
const KEY = "dadyoom.study.selection.v1";
type Saved = { country: string; grade: number | null };

export default function StudyCountryGradePicker({
  countries, initialCountry, initialGrade, resumeLessonId, authenticated,
}: {
  countries: Country[];
  initialCountry: string;
  initialGrade: number | null;
  resumeLessonId: string | null;
  authenticated: boolean;
}) {
  const [country, setCountry] = useState(initialCountry);
  const [grade, setGrade] = useState<number | null>(initialGrade);
  const [query, setQuery] = useState("");
  const [ready, setReady] = useState(false);
  const [showCountries, setShowCountries] = useState(!initialCountry);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(KEY) || "null") as Saved | null;
      if (saved && countries.some(item => item.code === saved.country)) {
        setCountry(saved.country);
        setGrade(Number.isInteger(saved.grade) && (saved.grade ?? 0) >= 1 && (saved.grade ?? 0) <= 12
          ? saved.grade : null);
        setShowCountries(false);
      }
    } catch { /* Ignore corrupt or disabled local storage. */ }
    setReady(true);
  }, [countries]);

  const list = useMemo(() => countries.filter(item =>
    `${item.name} ${item.code}`.toLocaleLowerCase("ar").includes(query.trim().toLocaleLowerCase("ar"))),
    [countries, query]);
  const selected = countries.find(item => item.code === country);
  function save(nextCountry: string, nextGrade: number | null) {
    setCountry(nextCountry); setGrade(nextGrade);
    try { window.localStorage.setItem(KEY, JSON.stringify({ country: nextCountry, grade: nextGrade })); }
    catch { /* Browser storage is optional; account settings still work. */ }
  }
  const lessonHref = country && grade
    ? `/courses?country=${encodeURIComponent(country)}&grade=${grade}`
    : "/courses";
  return (
    <main dir="rtl" className="min-h-screen bg-[#f8faf9] px-4 py-7 text-[#1b3831] sm:px-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="rounded-3xl border border-[#e2ebe4] bg-white p-6 sm:p-8">
          <Link href="/" className="text-sm font-semibold text-[#376f63]">ضاديوم · بيت العربية الرقمي</Link>
          <h1 className="mt-3 text-3xl font-bold leading-normal">ابدأ من هنا</h1>
          <p className="mt-2 text-base leading-8 text-[#597369]">
            اختر دولتك، ثم صفك الدراسي. سيبقى الاختيار محفوظًا على هذا الجهاز.
          </p>
          <p className="mt-2 text-sm text-[#526e63]">المرحلة المدرسية: {formatArabicCount(12, "grade")}</p>
        </header>

        <section aria-labelledby="country-title" className="rounded-3xl border border-[#e2ebe4] bg-white p-5 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <h2 id="country-title" className="text-xl font-bold">1. اختر الدولة</h2>
            {selected && <button type="button" onClick={() => setShowCountries(value => !value)}
              className="min-h-11 rounded-xl border px-4 text-sm font-semibold text-[#245548]">
              {showCountries ? "إغلاق القائمة" : "تغيير الدولة"}
            </button>}
          </div>
          {selected && <p className="mt-3 rounded-xl bg-[#eef7f1] p-3 font-semibold" aria-live="polite">{selected.name}</p>}
          {(showCountries || !selected) && (
            <div className="mt-4 space-y-3">
              <label htmlFor="country-search" className="block text-sm font-semibold">ابحث عن دولتك</label>
              <input id="country-search" type="search" value={query} onChange={event => setQuery(event.target.value)}
                placeholder="اكتب اسم الدولة" autoComplete="country-name"
                className="min-h-12 w-full rounded-xl border border-[#c6d7cc] bg-white px-4 text-base focus-visible:outline-2 focus-visible:outline-[#17564b]" />
              <div role="group" aria-label="الدول المتاحة" className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
                {list.map(item => (
                  <button key={item.code} type="button" aria-pressed={country === item.code}
                    onClick={() => { save(item.code, null); setShowCountries(false); setQuery(""); }}
                    className="min-h-12 rounded-xl border border-[#cfdfd2] bg-[#fbfdfb] p-3 text-sm font-semibold aria-pressed:border-[#17564b] aria-pressed:bg-[#edf7f1]">
                    {item.name}
                  </button>
                ))}
              </div>
              {list.length === 0 && <p role="status" className="text-sm text-[#6c7970]">لم نجد دولة بهذا الاسم.</p>}
            </div>
          )}
        </section>

        {selected && (
          <section aria-labelledby="grade-title" className="rounded-3xl border border-[#e2ebe4] bg-white p-5 sm:p-7">
            <h2 id="grade-title" className="text-xl font-bold">2. اختر الصف</h2>
            <p className="mt-2 text-sm text-[#61776b]">من الصف الأول إلى الصف الثاني عشر.</p>
            <div role="group" aria-label="الصفوف الدراسية" className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {Array.from({length: 12}, (_, index) => index + 1).map(number => (
                <button type="button" key={number} aria-pressed={grade === number}
                  onClick={() => save(country, number)}
                  className="min-h-14 rounded-xl border border-[#cfdfd2] bg-[#fbfdfb] p-3 text-lg font-bold aria-pressed:border-[#17564b] aria-pressed:bg-[#17564b] aria-pressed:text-white">
                  {number}
                </button>
              ))}
            </div>
          </section>
        )}

        <nav aria-label="متابعة التعلم" className="flex flex-col gap-3 rounded-3xl border border-[#e2ebe4] bg-white p-5 sm:flex-row sm:p-7">
          {country && grade ? (
            <Link href={authenticated ? lessonHref : "/login"} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-[#17564b] px-6 py-3 font-bold text-white">
              افتح دروس صفي
            </Link>
          ) : <span className="flex flex-1 items-center text-sm text-[#6b776e]">اختر الدولة والصف أولًا.</span>}
          <Link href={authenticated && resumeLessonId ? `/lessons/${resumeLessonId}` : authenticated ? lessonHref : "/login"}
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-[#a9cabb] px-6 py-3 text-center font-bold text-[#17564b]">
            تابع من حيث توقفت
          </Link>
        </nav>
        {!authenticated && <p className="text-sm leading-7 text-[#62766c]">
          يمكنك اختيار الدولة والصف الآن. عند فتح الدروس ستدخل إلى حسابك، ثم تعود إلى منهجك.
        </p>}
        <p className="text-xs leading-6 text-[#7b8780]" aria-live="polite">
          {ready ? "يمكنك تعديل الاختيار في أي وقت." : "جارٍ استعادة اختياراتك المحفوظة…"}
        </p>
      </div>
    </main>
  );
}
