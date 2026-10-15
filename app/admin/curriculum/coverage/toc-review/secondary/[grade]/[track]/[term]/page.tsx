import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import audit from "@/data/curriculum-completeness/bahrain-book-completeness-2026-2027.json";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDashboardRequestViewer } from "@/lib/auth/request-viewer";
import { bookTocScopeKey } from "@/lib/curriculum/book-toc-review";
import { inspectTocMatches, type TocCandidate } from "@/lib/curriculum/toc-title-matching";
import { secondaryTrackTitle } from "@/lib/curriculum/bahrain-secondary-track-review";

export const dynamic = "force-dynamic";
export const revalidate = 0;
type PageProps = { params: Promise<{ grade: string; track: string; term: string }> };
function ErrorDisplay({ topic }: { topic: string }) {
  return <main dir="rtl" className="mx-auto max-w-5xl p-8">
    <h1 className="text-2xl font-black">تدقيق مسارات الثانوية</h1>
    <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-4 text-rose-900">
      تعذرت قراءة {topic}؛ لم يُعتمد أي كتاب أو يُعدّل أي درس.
    </p>
  </main>;
}

export default async function BahrainSecondaryTextbookReview({ params }: PageProps) {
  const input = await params;
  const grade = Number(input.grade);
  const term = Number(input.term);
  const track = secondaryTrackTitle(input.track);
  if (!Number.isInteger(grade) || grade < 10 || grade > 12 ||
      !track || ![1, 2].includes(term)) notFound();
  const book = audit.books.find(row =>
    row.program === "الثانوي العام/النوعي" &&
    row.grade === grade && row.track === track && row.semesterOrBookPart === term
  );
  if (!book) notFound();
  const { user, profile, userError, profileError } = await getDashboardRequestViewer();
  if (userError || profileError || !user || profile?.role?.trim().toLowerCase() !== "admin") {
    redirect("/");
  }

  const db = createAdminClient();
  const evidence = await db.from("curriculum_toc_evidence")
    .select("scope_key,source_url,toc_outline")
    .eq("scope_key", bookTocScopeKey(book)).maybeSingle();
  if (evidence.error) return <ErrorDisplay topic="دليل الكتاب الرسمي" />;
  let candidates: TocCandidate[] = [];

  if (evidence.data) {
    // Exact recorded curriculum name isolates the four secondary pathways;
    // do not merge lessons by title, subject or grade alone.
    const curriculumName = book.liveSnapshotReconciliation?.curriculumName;
    if (!curriculumName) return <ErrorDisplay topic="اسم المسار الدقيق" />;
    const bh = await db.from("countries").select("id").eq("code", "BH").maybeSingle();
    if (bh.error || !bh.data) return <ErrorDisplay topic="هوية الدولة" />;
    const curricula = await db.from("curricula").select("id")
      .eq("country_id", bh.data.id).eq("name_ar", curriculumName);
    if (curricula.error || !curricula.data || curricula.data.length !== 1) {
      return <ErrorDisplay topic="هوية المنهج المنفردة" />;
    }
    const grades = await db.from("grades").select("id")
      .eq("curriculum_id", curricula.data[0].id).eq("grade_number", grade);
    if (grades.error || !grades.data || grades.data.length !== 1) {
      return <ErrorDisplay topic="الصف التابع للمسار" />;
    }
    const units = await db.from("units").select("id").eq("grade_id", grades.data[0].id);
    if (units.error || !units.data) return <ErrorDisplay topic="وحدات المسار" />;
    if (units.data.length) {
      const response = await db.from("lessons")
        .select("id,title,semester,official_content_scope")
        .in("unit_id", units.data.map(row => row.id))
        .eq("status", "published")
        .eq("semester", term)
        .in("official_content_scope", ["plan-scheduled", "official-book-unscheduled"])
        .limit(200);
      if (response.error || !response.data || response.data.length === 200) {
        return <ErrorDisplay topic="العدد الكامل لعناوين الدروس" />;
      }
      candidates = response.data as TocCandidate[];
    }
  }

  const matches = evidence.data
    ? inspectTocMatches(evidence.data.toc_outline, candidates, term)
    : [];
  const possible = matches.filter(x => x.status === "candidate_only").length;
  const missing = matches.filter(x => x.status === "missing").length;
  const ambiguous = matches.filter(x => x.status === "ambiguous").length;

  return <main dir="rtl" className="min-h-screen bg-[#f7f1e6] px-4 py-8 text-[#203a34]">
    <div className="mx-auto max-w-5xl space-y-6">
      <nav className="flex flex-wrap gap-3 text-sm font-bold text-[#174f47]">
        <Link href="/admin">الإدارة</Link> ←
        <Link href="/admin/curriculum/coverage">تدقيق البحرين</Link> ←
        <Link href="/admin/curriculum/coverage/toc-review">مصادر الكتب</Link>
      </nav>
      <header className="rounded-3xl border border-[#ddcfb4] bg-white p-7">
        <p className="text-sm font-bold text-[#9a712c]">الصف {grade} • الفصل {term}</p>
        <h1 className="mt-2 text-3xl font-black text-[#123f39]">معاينة فهرس {track}</h1>
        <p className="mt-3 text-sm leading-8 text-[#655a4e]">
          مقارنة عنوان داخل المسار والصف والفصل نفسه فقط. المرشح لا يعني
          مطابقة نص الكتاب أو الطبعة أو صفحاته، ولا يحدث اعتماد أو نشر تلقائي.
        </p>
        {term === 2 && !book.currentPlanPublished ? <p className="mt-3 rounded-xl bg-amber-50 p-4 text-sm font-bold text-amber-950">
          خطة الفصل الثاني الرسمية لعام 2026–2027 لم تثبت بعد؛
          خطة 2025–2026 مرجع تاريخي لا يثبت المقرر الحالي.
        </p> : null}
      </header>
      {!evidence.data ? <section className="rounded-3xl border border-amber-200 bg-white p-6">
        <h2 className="font-black">ينتظر إدخال فهرس الكتاب الفعلي</h2>
        <p className="mt-2 text-sm leading-7">
          لم تُسجل عناوين الفهرس لهذا المسار بعد.
          <Link className="mr-2 font-bold text-[#174f47] underline"
            href="/admin/curriculum/coverage/toc-review">فتح بوابة أدلة الكتب</Link>
        </p>
      </section> : <section className="rounded-3xl border border-[#ddcfb4] bg-white p-6">
        <a href={evidence.data.source_url} target="_blank" rel="noopener noreferrer"
          className="text-sm font-bold text-[#174f47] underline">رابط مصدر الكتاب المسجل ↗</a>
        <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold">
          <span className="rounded-lg bg-teal-50 px-3 py-2">مرشح واحد: {possible}</span>
          <span className="rounded-lg bg-amber-50 px-3 py-2">بلا تطابق: {missing}</span>
          <span className="rounded-lg bg-rose-50 px-3 py-2">مكرر أو ملتبس: {ambiguous}</span>
        </div>
        <ol className="mt-4 space-y-3">
          {matches.map((item, i) => <li key={i} className="rounded-xl border border-[#e8ddc8] p-4">
            <p className="font-black">{i + 1}. {item.title}</p>
            <p className="mt-1 text-sm text-[#6e655b]">
              {item.status === "candidate_only"
                ? "مرشح عنوان فقط — لا اعتماد تلقائي"
                : item.status === "ambiguous" ? "مكرر يحتاج فحصًا" : "غير موجود في المسار والفصل"}
            </p>
            {item.lessonId ? <Link href={"/admin/lessons/" + item.lessonId}
              className="mt-2 inline-block text-sm font-bold text-[#174f47] underline">
              مراجعة درس: {item.lessonTitle}</Link> : null}
          </li>)}
        </ol>
      </section>}
      <p className="rounded-xl bg-amber-50 p-4 font-bold text-amber-950">
        هذا التقرير ليس شهادة اكتمال كتاب. يلزم تدقيق المصدر والمحتوى صفحة بصفحة.
      </p>
    </div>
  </main>;
}
