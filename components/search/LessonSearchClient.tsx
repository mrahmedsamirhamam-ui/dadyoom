"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type CountryOption = { code: string; name: string; maxGrade: number };
type SearchResult = {
  id: string;
  title: string;
  summary: string | null;
  country: string;
  countryCode: string;
  grade: string;
  gradeNumber: number | null;
  curriculum: string;
  unit: string;
  semester: number | null;
  href: string;
  resourceKind?: "lesson" | "curriculum-scope" | "book-reference";
};
type ResponsePayload = {
  lessons?: SearchResult[];
  hasMore?: boolean;
  error?: string;
};

export default function LessonSearchClient({
  countries,
  initialQuery,
  initialCountry,
  initialGrade,
}: {
  countries: CountryOption[];
  initialQuery: string;
  initialCountry: string;
  initialGrade: string;
}) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(initialQuery.trim().length >= 2);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(initialCountry);
  const [selectedGrade, setSelectedGrade] = useState(initialGrade);
  const activeCountry = countries.find(item => item.code === selectedCountry);
  const query = initialQuery.trim();

  useEffect(() => {
    if (query.length < 2) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ q: query, page: "1" });
    if (initialCountry) params.set("country", initialCountry);
    if (initialGrade) params.set("grade", initialGrade);
    void fetch(`/api/lessons/search?${params}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async response => {
        const body = (await response.json()) as ResponsePayload;
        if (!response.ok) throw new Error(body.error || "تعذر تحميل الدروس");
        return body;
      })
      .then(body => {
        if (controller.signal.aborted) return;
        setResults(body.lessons ?? []);
        setHasMore(Boolean(body.hasMore));
        setPage(1);
        setError("");
        setLoading(false);
      })
      .catch(reason => {
        if (controller.signal.aborted) return;
        setError(reason instanceof Error ? reason.message : "تعذر البحث");
        setLoading(false);
      });
    return () => { controller.abort(); };
  }, [query, initialCountry, initialGrade]);

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    const next = page + 1;
    setLoadingMore(true);
    const params = new URLSearchParams({ q: query, page: String(next) });
    if (initialCountry) params.set("country", initialCountry);
    if (initialGrade) params.set("grade", initialGrade);
    try {
      const response = await fetch(`/api/lessons/search?${params}`, { cache: "no-store" });
      const body = (await response.json()) as ResponsePayload;
      if (!response.ok) throw new Error(body.error || "تعذر جلب المزيد");
      setResults(previous => [...previous, ...(body.lessons ?? [])]);
      setHasMore(Boolean(body.hasMore));
      setPage(next);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر تحميل المزيد");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f1e6] px-3 py-6 text-[#223b35] sm:px-5 sm:py-10">
      <div className="mx-auto w-full max-w-5xl space-y-5">
        <nav aria-label="مسار التنقل" className="text-sm font-bold">
          <Link href="/" className="underline">ضاديوم</Link>
          <span className="mx-2">←</span>
          <Link href="/curriculum" className="underline">المناهج</Link>
          <span className="mx-2">←</span>
          البحث عن درس
        </nav>
        <section className="rounded-[2rem] border border-[#d9c5a2] bg-[#fffdf8] p-5 shadow-sm sm:p-8">
          <p className="font-black text-[#a37222]">عدسة ضاديوم التعليمية</p>
          <h1 className="mt-2 font-arabic-display text-3xl font-black leading-relaxed text-[#123f39]">
            ابحث عن الدرس الذي تحتاجه
          </h1>
          <p className="mt-2 text-sm leading-8 text-[#6c6255]">
            البحث يشمل عناوين الدروس المنشورة داخل ضاديوم، حتى إن لم تكن مؤهلة للفهرسة في Google.
            اختر دولة وصفًا للتأكد من وصولك إلى منهجك.
          </p>
          <form role="search" action="/search" method="get" className="mt-6 grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2 block font-black text-[#123f39]">
              اسم الدرس أو كلمة من عنوانه
              <div className="mt-2 flex min-h-12 items-center rounded-xl border border-[#bda779] bg-white px-3 focus-within:ring-2 focus-within:ring-[#b68a3a]">
                <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>
                </svg>
                <input name="q" type="search" minLength={2} maxLength={80}
                  autoComplete="off" defaultValue={initialQuery} required
                  placeholder="مثل: المفعول به، القراءة، الهمزة..."
                  className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base outline-none"
                />
              </div>
            </label>
            <label className="block font-black text-[#123f39]">
              الدولة
              <select name="country" value={selectedCountry}
                onChange={(event) => {
                  const nextCountry = event.target.value;
                  setSelectedCountry(nextCountry);
                  const maxGrade = countries.find(item => item.code === nextCountry)?.maxGrade ?? 13;
                  if (selectedGrade && Number(selectedGrade) > maxGrade) setSelectedGrade("");
                }}
                className="mt-2 min-h-12 w-full rounded-xl border border-[#bda779] bg-white px-3 py-2 text-base">
                <option value="">جميع الدول العربية</option>
                {countries.map(item => (
                  <option key={item.code} value={item.code}>{item.name}</option>
                ))}
              </select>
            </label>
            <label className="block font-black text-[#123f39]">
              الصف الدراسي
              <select name="grade" value={selectedGrade}
                onChange={(event) => setSelectedGrade(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-xl border border-[#bda779] bg-white px-3 py-2 text-base">
                <option value="">كل الصفوف</option>
                {Array.from({ length: activeCountry?.maxGrade ?? 13 }, (_, i) => i + 1)
                  .map(grade => (
                    <option key={grade} value={grade}>الصف {grade}</option>
                  ))}
              </select>
            </label>
            <div className="sm:col-span-2 flex flex-wrap gap-3">
              <button type="submit" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#123f39] px-7 py-3 font-black text-white hover:bg-[#1b6154]">
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></svg>
                ابحث عن الدروس
              </button>
              <Link href="/search" className="inline-flex min-h-12 items-center rounded-full border border-[#d4c09a] px-5 py-3 font-black">مسح البحث</Link>
            </div>
          </form>
        </section>

        {query.length >= 2 ? (
          <section aria-live="polite" aria-busy={loading}>
            <h2 className="mb-4 text-xl font-black text-[#123f39]">نتائج البحث عن «{query}»</h2>
            {loading ? <p className="rounded-xl bg-white p-6 font-bold">جارٍ البحث في الدروس المنشورة…</p> : null}
            {error ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 font-bold text-rose-800">{error}</p> : null}
            {!loading && !error && results.length === 0 ? (
              <div className="rounded-xl border border-[#ddcfb4] bg-white p-6">
                <p className="font-black">لا توجد دروس مطابقة بهذه الكلمات حاليًا.</p>
                <p className="mt-2 text-sm leading-7">جرّب كلمة أقصر أو ابحث في جميع الدول والصفوف.</p>
              </div>
            ) : null}
            <div className="grid gap-3">
              {results.map(lesson => (
                <Link key={lesson.id} href={lesson.href} prefetch={false}
                  className="block min-h-16 rounded-2xl border border-[#dfcfad] bg-[#fffdf8] p-5 transition hover:border-[#96ada0] hover:shadow-md">
                  {lesson.resourceKind && lesson.resourceKind !== "lesson" ? (
                    <span className="mb-2 inline-flex rounded-full bg-[#f2e9d8] px-3 py-1 text-xs font-black text-[#805e2a]">
                      {lesson.resourceKind === "curriculum-scope" ? "مجال دراسي — يحتاج تفصيل الدروس" : "مرجع كتاب — ليس درسًا مستقلًا"}
                    </span>
                  ) : null}
                  <h3 className="text-lg font-black text-[#123f39]">{lesson.title}</h3>
                  <p className="mt-2 text-sm font-bold text-[#8c6425]">
                    {lesson.country} • {lesson.grade} • {lesson.curriculum} • {lesson.unit}
                    {lesson.semester === 1 ? " • الفصل الأول" : lesson.semester === 2 ? " • الفصل الثاني" : lesson.semester === 3 ? " • الفصل الثالث" : ""}
                  </p>
                  {lesson.summary ? <p className="mt-2 line-clamp-2 text-sm leading-7 text-[#666055]">{lesson.summary}</p> : null}
                  <p className="mt-2 text-sm font-black text-[#174f47]">
                    {lesson.resourceKind === "curriculum-scope"
                      ? "اعرف حالة المجال وابحث عن الدروس التفصيلية ←"
                      : lesson.resourceKind === "book-reference"
                        ? "اطّلع على مرجع الكتاب وحالة التوثيق ←"
                        : "افتح الدرس ←"}
                  </p>
                </Link>
              ))}
            </div>
            {hasMore ? (
              <button type="button" onClick={loadMore} disabled={loadingMore}
                className="mt-5 min-h-12 rounded-full bg-[#123f39] px-6 py-3 font-black text-white disabled:opacity-60">
                {loadingMore ? "جارٍ التحميل…" : "عرض المزيد من الدروس"}
              </button>
            ) : null}
            {results.length > 0 ? <p className="mt-3 text-sm text-[#6d6456]">النتائج الظاهرة: {results.length}. اختر الدرس لفتح محتواه.</p> : null}
          </section>
        ) : <section className="rounded-2xl border border-[#ddcfb4] bg-white p-6 font-bold text-[#655c50]">
          اكتب اسم الدرس، ثم اضغط على العدسة للبحث.
        </section>}
      </div>
    </main>
  );
}
