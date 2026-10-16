import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PAGE_SIZE = 30;

type Relation<T> = T | T[] | null;
function first<T>(input: Relation<T> | undefined): T | null {
  return Array.isArray(input) ? input[0] ?? null : input ?? null;
}

type Country = { code: string; name_ar: string };
type Curriculum = { countries: Relation<Country> };
type Grade = { name_ar: string; grade_number: number | null; curricula: Relation<Curriculum> };
type Unit = { title: string; grades: Relation<Grade> };
type Lesson = {
  id: string;
  title: string;
  lesson_number: number | null;
  lesson_type: string;
  status: string;
  source_page_start: number | null;
  source_page_end: number | null;
  estimated_minutes: number | null;
  units: Relation<Unit>;
};
type Search = {
  page?: string;
  q?: string;
  status?: string;
  country?: string;
  grade?: string;
  review?: string;
};
type Props = { searchParams: Promise<Search> };

function urlFor(search: Search, page: number) {
  const p = new URLSearchParams();
  for (const key of ["q", "status", "country", "grade", "review"] as const) {
    const value = search[key];
    if (value) p.set(key, value);
  }
  if (page > 1) p.set("page", String(page));
  const qs = p.toString();
  return "/admin/lessons" + (qs ? "?" + qs : "");
}
function sanitizeSearch(raw: Search): Search {
  const q = typeof raw.q === "string" ? raw.q.trim().slice(0, 100) : "";
  const status = ["published", "draft", "archived"].includes(raw.status ?? "") ? raw.status : "";
  const country = /^[A-Za-z]{2}$/u.test(raw.country ?? "") ? raw.country!.toUpperCase() : "";
  const n = Number(raw.grade);
  const grade = raw.grade && Number.isInteger(n) && n >= 1 && n <= 12 ? String(n) : "";
  const review = ["missing-pages", "generic-intro", "unresolved-ocr", "missing-link"].includes(raw.review ?? "")
    ? raw.review : "";
  const p = Number(raw.page);
  const page = Number.isSafeInteger(p) && p > 0 ? Math.min(p, 10000) : 1;
  return { q, status, country, grade, review, page: String(page) };
}
function Alert({ message }: { message: string }) {
  return <p role="alert" className="rounded-2xl border border-rose-300 bg-rose-50 p-5 font-bold text-rose-900">{message}</p>;
}

export default async function AdminLessonsPage({ searchParams }: Props) {
  const filters = sanitizeSearch(await searchParams);
  const page = Number(filters.page);
  const supabase = await createClient();

  // Bounded list of country names, not one request per lesson.
  const countriesResult = await supabase
    .from("countries").select("code,name_ar").order("name_ar").limit(50);
  if (countriesResult.error) return <Alert message="تعذر تحميل قائمة الدول." />;
  const countries = (countriesResult.data ?? []) as Country[];

  // All filters are applied in PostgREST BEFORE pagination and counting.
  // Every lesson can be reached, not just the first 50 in arbitrary order.
  let query = supabase.from("lessons")
    .select(
      "id,title,lesson_number,lesson_type,status,source_page_start,source_page_end,estimated_minutes,units!inner(title,grades!inner(name_ar,grade_number,curricula!inner(countries!inner(code,name_ar))))",
      { count: "exact" },
    );
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.country) query = query.eq("units.grades.curricula.countries.code", filters.country);
  if (filters.grade) query = query.eq("units.grades.grade_number", Number(filters.grade));
  // Evidence issue filters are applied in PostgREST, not sliced after
  // pagination. These are *review queues*, not book-completeness verdicts.
  if (filters.review === "missing-pages") {
    query = query.or("source_page_start.is.null,source_page_end.is.null");
  } else if (filters.review === "missing-link") {
    query = query.is("source_pdf_url", null);
  } else if (filters.review === "generic-intro") {
    query = query.like("content", "يتناول هذا الدرس موضوع «%");
  } else if (filters.review === "unresolved-ocr") {
    query = query.ilike("content", "%مدخل OCR غير محسوم%");
  }
  if (filters.q) {
    // Supabase "ilike" treats % and _ as wildcards. Escape them to keep
    // the search literal rather than expanding into an unbounded scan.
    const term = filters.q.replace(/[\\%_]/gu, "\\$&");
    query = query.ilike("title", `%${term}%`);
  }
  const from = (page - 1) * PAGE_SIZE;
  const result = await query
    .order("title", { ascending: true })
    .order("id", { ascending: true })
    .range(from, from + PAGE_SIZE - 1);
  if (result.error) {
    console.error("ADMIN_LESSONS_FILTER_QUERY_FAILED", result.error.code);
    return <Alert message="تعذر قراءة الدروس بهذه التصفية. لم تتغير أي بيانات." />;
  }
  const lessons = (result.data ?? []) as unknown as Lesson[];
  const count = result.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const next = page < totalPages;
  const prev = page > 1 && page <= totalPages;
  const countryValid = !filters.country || countries.some(x => x.code === filters.country);

  return <main dir="rtl" className="space-y-6 p-4 sm:p-7">
    <header className="rounded-3xl border border-[#dfcfad] bg-white p-6">
      <p className="text-sm font-black text-[#9a7028]">بوابة المناهج • مكتبة الدروس</p>
      <h1 className="mt-2 text-3xl font-black text-[#123f39]">كل الدروس والمسودات</h1>
      <p className="mt-3 text-sm leading-7 text-[#625b51]">
        تصفح الدروس دولةً وصفًا وحالةً، ثم افتح كل درس لتصحيح المصدر والمحتوى.
        «منشور» لا يعني «مطابق لفهرس الكتاب الرسمي».
      </p>
      <div className="mt-4 flex flex-wrap gap-3 text-sm font-black">
        <Link href="/admin/curriculum/coverage" className="text-[#174f47] underline">تدقيق كتب البحرين ←</Link>
        <Link href="/admin/curriculum/coverage/countries" className="text-[#174f47] underline">فجوات مصادر جميع الدول ←</Link>
        <Link href="/admin/curriculum/coverage/drafts" className="text-[#174f47] underline">قائمة المسودات ومشكلات OCR ←</Link>
        <Link href="/admin/curriculum/coverage/toc-review" className="text-[#174f47] underline">مطابقة فهارس الكتب ←</Link>
      </div>
    </header>
    <form method="GET" action="/admin/lessons" className="grid gap-3 rounded-3xl border border-[#dfcfad] bg-[#fffdf8] p-5 md:grid-cols-6">
      <label className="text-sm font-bold">ابحث بعنوان الدرس
        <input name="q" type="search" defaultValue={filters.q} maxLength={100} placeholder="مثلاً: حرف الباء"
          className="mt-2 w-full rounded-xl border border-[#d6c9b0] bg-white p-3" />
      </label>
      <label className="text-sm font-bold">الدولة
        <select name="country" defaultValue={countryValid ? filters.country : ""}
          className="mt-2 w-full rounded-xl border border-[#d6c9b0] bg-white p-3">
          <option value="">كل الدول</option>
          {countries.map(x => <option key={x.code} value={x.code}>{x.name_ar}</option>)}
        </select>
      </label>
      <label className="text-sm font-bold">الصف
        <select name="grade" defaultValue={filters.grade}
          className="mt-2 w-full rounded-xl border border-[#d6c9b0] bg-white p-3">
          <option value="">كل الصفوف</option>
          {Array.from({ length: 12 }, (_, index) => index + 1).map(n =>
            <option key={n} value={n}>الصف {n}</option>)}
        </select>
      </label>
      <label className="text-sm font-bold">الحالة
        <select name="status" defaultValue={filters.status}
          className="mt-2 w-full rounded-xl border border-[#d6c9b0] bg-white p-3">
          <option value="">كل الحالات</option>
          <option value="published">منشور</option>
          <option value="draft">مسودة</option>
          <option value="archived">مؤرشف</option>
        </select>
      </label>
      <label className="text-sm font-bold">نوع المشكلة للمراجعة
        <select name="review" defaultValue={filters.review}
          className="mt-2 w-full rounded-xl border border-[#d6c9b0] bg-white p-3">
          <option value="">جميع الدروس</option>
          <option value="missing-pages">صفحات المصدر غير محددة</option>
          <option value="missing-link">بلا رابط مصدر مسجل</option>
          <option value="generic-intro">شرح عام مستورد</option>
          <option value="unresolved-ocr">استخراج OCR غير محسوم</option>
        </select>
      </label>
      <div className="flex items-end gap-2">
        <button type="submit" className="rounded-xl bg-[#174f47] px-5 py-3 font-black text-white">بحث</button>
        <Link href="/admin/lessons" className="rounded-xl border border-[#d6c9b0] px-4 py-3 text-sm font-black">إلغاء</Link>
      </div>
    </form>
    <section className="rounded-3xl border border-[#dfcfad] bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="font-black text-[#123f39]">
          {count.toLocaleString("ar-BH")} نتيجة مطابقة للبحث — صفحة {page} من {totalPages}
        </p>
        <p className="text-xs text-[#685d4d]">30 درسًا كحد أقصى في الصفحة لحماية سرعة الموقع</p>
      </div>
      {page > totalPages ? <Alert message="رقم الصفحة خارج نطاق النتائج. عد إلى الصفحة الأولى." /> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[840px] text-right text-sm">
          <thead><tr className="border-b bg-[#f7f1e6] text-[#123f39]">
            <th className="p-3">الدرس</th><th className="p-3">الدولة</th>
            <th className="p-3">الصف / الوحدة</th><th className="p-3">الحالة</th>
            <th className="p-3">صفحات المصدر</th><th className="p-3">المراجعة</th>
          </tr></thead>
          <tbody>
            {lessons.map(lesson => {
              const unit = first(lesson.units);
              const grade = first(unit?.grades);
              const curriculum = first(grade?.curricula);
              const country = first(curriculum?.countries);
              const pages = lesson.source_page_start && lesson.source_page_end
                ? `${lesson.source_page_start}–${lesson.source_page_end}` : "غير محددة";
              return <tr key={lesson.id} className="border-b last:border-b-0">
                <td className="p-3 font-black text-[#174f47]">{lesson.title}</td>
                <td className="p-3">{country?.name_ar ?? "—"}</td>
                <td className="p-3">{grade?.name_ar ?? "—"} • {unit?.title ?? "—"}</td>
                <td className="p-3 font-bold">{lesson.status === "published" ? "منشور" : lesson.status === "draft" ? "مسودة" : "مؤرشف"}</td>
                <td className="p-3" dir="ltr">{pages}</td>
                <td className="p-3"><Link prefetch={false}
                  href={`/admin/lessons/${lesson.id}`}
                  className="font-black text-[#174f47] underline">فتح الدرس ←</Link></td>
              </tr>;
            })}
            {!lessons.length ? <tr><td colSpan={6} className="p-9 text-center font-bold text-[#766953]">
              لا توجد دروس بهذه المعايير.
            </td></tr> : null}
          </tbody>
        </table>
      </div>
      <nav aria-label="تصفح صفحات الدروس" className="mt-5 flex flex-wrap items-center justify-between gap-4">
        {prev ? <Link prefetch={false} href={urlFor(filters, page - 1)}
          className="rounded-xl border border-[#c9b992] px-5 py-3 font-black text-[#174f47]">← الصفحة السابقة</Link>
          : <span />}
        {next ? <Link prefetch={false} href={urlFor(filters, page + 1)}
          className="rounded-xl bg-[#174f47] px-5 py-3 font-black text-white">الصفحة التالية ←</Link>
          : <span />}
      </nav>
    </section>
  </main>;
}
