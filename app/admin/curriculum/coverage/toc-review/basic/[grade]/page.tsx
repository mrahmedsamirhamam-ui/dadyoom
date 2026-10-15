import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import audit from "@/data/curriculum-completeness/bahrain-book-completeness-2026-2027.json";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDashboardRequestViewer } from "@/lib/auth/request-viewer";
import { bookTocScopeKey } from "@/lib/curriculum/book-toc-review";
import { inspectTocMatches, type TocCandidate } from "@/lib/curriculum/toc-title-matching";

export const dynamic = "force-dynamic";
export const revalidate = 0;
type IdRow = { id: string };
type LessonRow = TocCandidate;
function DataError({ message }: { message: string }) {
  return <section dir="rtl" className="mx-auto max-w-5xl p-8">
    <h1 className="text-2xl font-black">مطابقة فهرس الصف المحدد</h1>
    <p role="alert" className="mt-5 rounded-xl bg-red-50 p-5 text-red-800">
      تعذر قراءة {message}. لا توجد نتيجة مطابقة يمكن اعتمادها، ولم تتغير أي بيانات دروس.
    </p>
  </section>;
}
function basicGradeScopes(grade: number) {
  return audit.books.filter(row => row.program === "التعليم الأساسي" &&
    row.grade === grade && [1, 2].includes(row.semesterOrBookPart));
}

export default async function BasicGradeTextbookComparison({ params }: { params: Promise<{ grade: string }> }) {
  const { grade: gradeRaw } = await params;
  const grade = Number(gradeRaw);
  if (!Number.isInteger(grade) || grade < 1 || grade > 9) notFound();
  const rows = basicGradeScopes(grade);
  const { user, profile, userError, profileError } = await getDashboardRequestViewer();
  if (!user || userError || profileError || profile?.role?.trim().toLowerCase() !== "admin") redirect("/");
  const db = createAdminClient();
  const scopes = rows.map(bookTocScopeKey);
  const evidence = await db.from("curriculum_toc_evidence")
    .select("scope_key,toc_outline,source_url")
    .in("scope_key", scopes);
  if (evidence.error) return <DataError message="أدلة فهارس الكتب" />;
  const bookEvidence = new Map((evidence.data ?? []).map(row => [row.scope_key, row]));
  let candidates: LessonRow[] = [];

  if (evidence.data?.length) {
    const co = await db.from("countries").select("id").eq("code", "BH").maybeSingle();
    if (co.error || !co.data) return <DataError message="بيانات الدولة" />;
    const curricula = await db.from("curricula").select("id,name_ar").eq("country_id", co.data.id);
    if (curricula.error || !curricula.data?.length) return <DataError message="المناهج" />;
    const basicCurricula = curricula.data.filter(row => row.name_ar === "اللغة العربية").map(row => row.id);
    if (!basicCurricula.length) return <DataError message="مسار اللغة العربية الأساسي" />;
    const grades = await db.from("grades").select("id")
      .in("curriculum_id", basicCurricula)
      .eq("grade_number", grade);
    if (grades.error || !grades.data?.length) return <DataError message="الصف المحدد" />;
    const units = await db.from("units").select("id")
      .in("grade_id", (grades.data as IdRow[]).map(x => x.id));
    if (units.error || !units.data?.length) return <DataError message="الوحدات" />;
    const lessons = await db.from("lessons")
      .select("id,title,semester,official_content_scope")
      .in("unit_id", (units.data as IdRow[]).map(x => x.id))
      .eq("status", "published")
      .in("semester", [1, 2]).limit(700);
    if (lessons.error) return <DataError message="عناوين الدروس" />;
    if ((lessons.data ?? []).length === 700) return <DataError message="كل الدروس: القائمة وصلت حد العرض" />;
    candidates = (lessons.data ?? []) as LessonRow[];
  }

  return <section dir="rtl" className="min-h-screen bg-[#f7f1e6] px-4 py-9 text-[#203a34]">
    <div className="mx-auto max-w-5xl space-y-6">
      <nav className="flex flex-wrap gap-3 text-sm font-bold text-[#174f47]">
        <Link href="/admin">الإدارة</Link><span>←</span>
        <Link href="/admin/curriculum/coverage">مراجعة البحرين</Link><span>←</span>
        <Link href="/admin/curriculum/coverage/toc-review">مدخل فهارس الكتب</Link>
      </nav>
      <header className="rounded-3xl border border-[#ddcfb4] bg-white p-7">
        <p className="text-sm font-black text-[#9a712c]">اللغة العربية • الصف {grade} • 2026–2027</p>
        <h1 className="mt-2 text-3xl font-black text-[#123f39]">مطابقة فهرس كتب الصف {grade} مع الدروس</h1>
        <p className="mt-3 leading-8 text-[#62594c]">
          نعرض تطابق العنوان الحرفي بعد توحيد تشكيله فقط، داخل الفصل نفسه،
          مع استبعاد دروس ضاديوم الإثرائية المستقلة. هذه اقتراحات للمراجع
          وليست إثباتًا بأن المحتوى أو الطبعة مطابقان؛ الاعتماد يحتاج
          مراجعة الفهرس والنص وصفحاته من مختص مستقل.
        </p>
      </header>
      {rows.map(book => {
        const scope = bookTocScopeKey(book);
        const saved = bookEvidence.get(scope);
        const matches = saved
          ? inspectTocMatches(saved.toc_outline, candidates, book.semesterOrBookPart)
          : [];
        const possible = matches.filter(item => item.status === "candidate_only").length;
        const missing = matches.filter(item => item.status === "missing").length;
        const ambiguous = matches.filter(item => item.status === "ambiguous").length;
        return <section key={scope} className="rounded-3xl border border-[#ddcfb4] bg-white p-6">
          <h2 className="text-xl font-black text-[#123f39]">الجزء / الفصل {book.semesterOrBookPart}</h2>
          {!saved ? <p className="mt-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-950">
            لم يُدخل فهرس الكتاب الرسمي بعد. ابدأ بإدخال مصدر الكتاب وعناوين فهرسه في
            {" "}<Link href="/admin/curriculum/coverage/toc-review" className="font-black underline">
              بوابة إدخال الأدلة
            </Link>. لا نستخدم خطة التدريس بدل فهرس الكتاب.
          </p> : <>
            <a href={saved.source_url} target="_blank" rel="noopener noreferrer"
              className="mt-3 inline-block text-sm font-bold text-[#174f47] underline">فتح المصدر المُدخل للمراجعة ↗</a>
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold">
              <span className="rounded-lg bg-teal-50 px-3 py-2">مرشح عنوان فريد: {possible}</span>
              <span className="rounded-lg bg-amber-50 px-3 py-2">غير موجود في هذا الفصل: {missing}</span>
              <span className="rounded-lg bg-rose-50 px-3 py-2">ملتبس أو مكرر: {ambiguous}</span>
            </div>
            <ol className="mt-4 space-y-3">
              {matches.map((item, index) => <li key={index}
                className="rounded-xl border border-[#ebe3d1] p-4 text-sm leading-7">
                <strong>{index + 1}. {item.title}</strong>
                <p className="text-[#796956]">{item.status === "candidate_only"
                  ? "مرشح عنوان فقط — لا اعتماد تلقائي"
                  : item.status === "ambiguous"
                    ? "عنوان متكرر أو أكثر من مرشح — قرار المراجع"
                    : "لا يوجد عنوان مطابق في دروس هذا الفصل"}</p>
                {item.lessonId ? <Link href={"/admin/lessons/" + item.lessonId}
                  className="font-bold text-[#174f47] underline">مراجعة الدرس المقترح: {item.lessonTitle}</Link> : null}
              </li>)}
            </ol>
          </>}
          <p className="mt-4 font-bold text-rose-800">الاكتمال المعتمد لهذا الجزء: غير مثبت (0 شهادة جديدة).</p>
        </section>;
      })}
    </div>
  </section>;
}
