import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import audit from "@/data/curriculum-completeness/bahrain-book-completeness-2026-2027.json";
import { getDashboardRequestViewer } from "@/lib/auth/request-viewer";
import { createAdminClient } from "@/lib/supabase/admin";
import { bookTocScopeKey } from "@/lib/curriculum/book-toc-review";
import { continuingLevel } from "@/lib/curriculum/bahrain-continuing-level-review";
import { inspectTocMatches, type TocCandidate } from "@/lib/curriculum/toc-title-matching";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function Failed({ topic }: { topic: string }) {
  return <section dir="rtl" role="alert" className="mx-auto max-w-5xl p-7">
    <h1 className="text-2xl font-black">تدقيق التعليم المستمر</h1>
    <p className="mt-4 rounded-xl bg-red-50 p-4 text-red-800">
      تعذرت قراءة {topic}؛ لم يُعتمد كتاب أو يتغير درس.
    </p>
  </section>;
}
export default async function ContinuingTocReview({
  params,
}: { params: Promise<{ level: string; term: string }> }) {
  const { level: slug, term: rawTerm } = await params;
  const level = continuingLevel(slug);
  const term = Number(rawTerm);
  if (!level || !/^[12]$/u.test(rawTerm)) notFound();
  const scope = audit.books.find(book => book.program === "التعليم المستمر" &&
    book.level === level && book.semesterOrBookPart === term);
  if (!scope) notFound();
  const { user, profile, userError, profileError } = await getDashboardRequestViewer();
  if (!user || userError || profileError || profile?.role?.trim().toLowerCase() !== "admin") redirect("/");
  const db = createAdminClient();
  const evidence = await db.from("curriculum_toc_evidence")
    .select("scope_key,toc_outline,source_url")
    .eq("scope_key", bookTocScopeKey(scope)).maybeSingle();
  if (evidence.error) return <Failed topic="فهرس الكتاب" />;
  let candidates: TocCandidate[] = [];
  if (evidence.data) {
    const country = await db.from("countries").select("id").eq("code", "BH").maybeSingle();
    if (country.error || !country.data) return <Failed topic="هوية الدولة" />;
    const curricula = await db.from("curricula").select("id")
      .eq("country_id", country.data.id).eq("name_ar", "اللغة العربية — التعليم المستمر");
    if (curricula.error || curricula.data?.length !== 1) return <Failed topic="منهج التعليم المستمر" />;
    const grades = await db.from("grades").select("id")
      .eq("curriculum_id", curricula.data[0].id).eq("name_ar", level);
    if (grades.error || grades.data?.length !== 1) return <Failed topic="هوية المستوى" />;
    const units = await db.from("units").select("id").eq("grade_id", grades.data[0].id);
    if (units.error || !units.data) return <Failed topic="وحدات المستوى" />;
    if (units.data.length) {
      const response = await db.from("lessons")
        .select("id,title,semester,official_content_scope")
        .in("unit_id", units.data.map(row => row.id))
        .eq("semester", term).eq("status", "published")
        .in("official_content_scope", ["plan-scheduled", "official-book-unscheduled"])
        .limit(300);
      if (response.error || !response.data || response.data.length === 300) return <Failed topic="قائمة الدروس كاملة" />;
      candidates = response.data as TocCandidate[];
    }
  }
  const matches = evidence.data
    ? inspectTocMatches(evidence.data.toc_outline, candidates, term) : [];
  const possible = matches.filter(row => row.status === "candidate_only").length;
  const missing = matches.filter(row => row.status === "missing").length;
  const ambiguous = matches.filter(row => row.status === "ambiguous").length;
  return <section dir="rtl" className="min-h-screen bg-[#f7f1e6] px-4 py-9 text-[#203a34]">
    <div className="mx-auto max-w-5xl space-y-6">
      <nav className="flex flex-wrap gap-3 text-sm font-black text-[#174f47]">
        <Link href="/admin">الإدارة</Link> ←
        <Link href="/admin/curriculum/coverage">المناهج</Link> ←
        <Link href="/admin/curriculum/coverage/toc-review">أدلة الكتب</Link>
      </nav>
      <header className="rounded-3xl border border-[#dfcfaf] bg-white p-7">
        <p className="text-sm font-black text-[#92702e]">التعليم المستمر • {level} • الفصل {term}</p>
        <h1 className="mt-2 text-3xl font-black text-[#123f39]">مطابقة عناوين فهرس التعليم المستمر</h1>
        <p className="mt-3 text-sm leading-8 text-[#685e51]">
          المقارنة محصورة في المستوى والفصل الحاليين، دون دمج المستويات.
          تطابق العنوان مرشح للمراجعة، وليس توثيقًا لنص الكتاب أو صفحاته.
        </p>
        {term === 2 && !scope.currentPlanPublished ? <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm font-black text-amber-900">
          خطة الفصل الثاني 2026–2027 لم تثبت بعد؛ لا تعتمد خطة تاريخية بوصفها المنهج الحالي.
        </p> : null}
      </header>
      {!evidence.data ? <section className="rounded-3xl border border-amber-200 bg-white p-6">
        <h2 className="font-black">ينتظر إدخال فهرس الكتاب الرسمي</h2>
        <Link href="/admin/curriculum/coverage/toc-review" className="mt-2 inline-block text-sm font-bold text-[#174f47] underline">
          فتح بوابة الفهارس
        </Link>
      </section> : <section className="rounded-3xl border border-[#ddcfb4] bg-white p-6">
        <a href={evidence.data.source_url} rel="noopener noreferrer" target="_blank"
          className="text-sm font-bold text-[#174f47] underline">الكتاب المُدخل للمراجعة ↗</a>
        <div className="mt-4 flex flex-wrap gap-3 text-sm font-black">
          <span className="rounded-lg bg-teal-50 px-3 py-2">مرشح واحد: {possible}</span>
          <span className="rounded-lg bg-amber-50 px-3 py-2">بلا مرشح: {missing}</span>
          <span className="rounded-lg bg-rose-50 px-3 py-2">مكرر/ملتبس: {ambiguous}</span>
        </div>
        <ol className="mt-4 space-y-3">
          {matches.map((item, i) => <li key={i} className="rounded-xl border border-[#e4d9c2] p-4">
            <p className="font-black">{i + 1}. {item.title}</p>
            <p className="mt-1 text-sm text-[#665b4c]">{item.status === "candidate_only"
              ? "مرشح عنوان فقط — لا اعتماد تلقائي"
              : item.status === "ambiguous" ? "مكرر يستدعي مراجعة" : "عنوان غير موجود في المستوى والفصل"}</p>
            {item.lessonId ? <Link href={"/admin/lessons/" + item.lessonId}
              className="mt-2 inline-block text-sm font-bold text-[#174f47] underline">
              فحص الدرس المقترح: {item.lessonTitle}
            </Link> : null}
          </li>)}
        </ol>
      </section>}
      <p className="rounded-xl bg-amber-50 p-4 text-sm font-black text-amber-900">
        لا يُعتمد أي كتاب مكتملًا عبر هذه الصفحة، ولا تتغير حالة أي درس.
      </p>
    </div>
  </section>;
}
