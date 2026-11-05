import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type LessonRow = { id: string; title: string | null; lesson_number: number | null };
type ProgressRow = { lesson_id: string; status: string; progress_percent: number | null };

export default async function StudentPage() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await db.from("profiles")
    .select("full_name,role,country,grade_number")
    .eq("id", user.id).maybeSingle();
  const role = profile?.role?.trim().toLowerCase();
  if (role === "teacher") redirect("/teacher");
  if (role === "parent") redirect("/parent");
  if (role === "school") redirect("/school");
  if (role && role !== "student" && role !== "admin") redirect("/");

  const countryCode = profile?.country?.trim().toUpperCase() || "";
  const grade = profile?.grade_number;
  let lessons: LessonRow[] = [];
  let progresses: ProgressRow[] = [];
  let issue = "";

  // Never pull a global all-country lesson list into a child's home.
  if (countryCode && Number.isInteger(grade) && grade! >= 1 && grade! <= 13) {
    const { data: country } = await db.from("countries").select("id")
      .eq("code", countryCode).maybeSingle();
    if (country) {
      const { data: curricula, error: curriculumError } = await db.from("curricula")
        .select("id").eq("country_id", country.id);
      if (curriculumError) issue = "تعذر تحميل المنهج حاليًا.";
      const curriculumIds = (curricula ?? []).map((item) => item.id);
      if (curriculumIds.length) {
        const { data: grades, error: gradesError } = await db.from("grades")
          .select("id").in("curriculum_id", curriculumIds).eq("grade_number", grade);
        if (gradesError) issue = "تعذر تحميل الصف حاليًا.";
        const gradeIds = (grades ?? []).map((item) => item.id);
        if (gradeIds.length) {
          const { data: units, error: unitsError } = await db.from("units")
            .select("id").in("grade_id", gradeIds);
          if (unitsError) issue = "تعذر تحميل وحدات المنهج.";
          const unitIds = (units ?? []).map((item) => item.id);
          if (unitIds.length) {
            const result = await db.from("lessons").select("id,title,lesson_number")
              .in("unit_id", unitIds).eq("status", "published")
              .order("lesson_number", { ascending: true }).limit(120);
            if (result.error) issue = "تعذر تحميل الدروس.";
            lessons = (result.data ?? []) as LessonRow[];
          }
        }
      }
    }
    const ids = lessons.map((lesson) => lesson.id);
    if (ids.length) {
      const { data } = await db.from("student_lesson_progress")
        .select("lesson_id,status,progress_percent")
        .eq("student_id", user.id).in("lesson_id", ids);
      progresses = (data ?? []) as ProgressRow[];
    }
  }

  const progress = new Map(progresses.map((item) => [item.lesson_id, item]));
  const completed = lessons.filter((item) =>
    ["completed","mastered"].includes(progress.get(item.id)?.status ?? "")).length;
  const next = lessons.find((item) => progress.get(item.id)?.status === "in_progress")
    ?? lessons.find((item) => !["completed","mastered"].includes(progress.get(item.id)?.status ?? ""));
  const studentName = profile?.full_name?.trim() || "صديق العربية";
  const setupNeeded = !countryCode || !Number.isInteger(grade) || grade! < 1 || grade! > 13;

  return (
    <main dir="rtl" className="min-h-[70vh] bg-[#f8faf9] px-4 py-6 text-[#19362f] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-3xl border border-[#e1ebe5] bg-white p-6 sm:p-8">
          <p className="text-sm font-semibold text-[#47766a]">ضاديوم · بيت العربية الرقمي</p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">أهلًا {studentName}</h1>
          <p className="mt-2 text-base leading-8 text-[#61736b]">
            {setupNeeded ? "اختر صفك ومسارك مرة واحدة، ثم ستجد منهجك هنا." :
              `هذا مكانك للتعلّم. ${countryCode} · الصف ${grade}`}
          </p>
          {setupNeeded ? (
            <Link href="/student/setup" className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-[#17564b] px-6 py-3 font-bold text-white">
              إعداد منهجي مرة واحدة
            </Link>
          ) : next ? (
            <Link href={`/lessons/${next.id}`} className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-[#17564b] px-6 py-3 font-bold text-white">
              {progress.get(next.id)?.status === "in_progress" ? "أكمل درسي" : "ابدأ درسي"}: {next.title || "درس العربية"}
            </Link>
          ) : (
            <Link href="/courses" className="mt-5 inline-flex min-h-12 items-center rounded-xl border border-[#c9d9d0] px-6 py-3 font-bold text-[#17564b]">
              افتح منهجي
            </Link>
          )}
        </header>

        <nav aria-label="اختصارات الطالب" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { href: "/courses", title: "منهجي", subtitle: "الدروس والوحدات" },
            { href: "/ask", title: "اسأل ضاد", subtitle: "مساعدة في العربية" },
            { href: "/student/details", title: "تقدمي", subtitle: "تفاصيل رحلتي" },
          ].map((item) => (
            <Link href={item.href} key={item.href}
              className="rounded-2xl border border-[#e1e9e3] bg-white p-4 text-right focus-visible:outline-2 focus-visible:outline-[#17564b]">
              <span className="block text-lg font-bold">{item.title}</span>
              <span className="mt-1 block text-xs leading-6 text-[#687a71]">{item.subtitle}</span>
            </Link>
          ))}
        </nav>

        {!setupNeeded ? (
          <section className="rounded-3xl border border-[#e1ebe5] bg-white p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold">دروسي</h2>
              <span className="text-sm text-[#61736b]">أنجزت {completed} من {lessons.length} من الدروس المحمّلة</span>
            </div>
            {issue ? <p role="alert" className="mt-4 text-rose-700">{issue}</p> : null}
            {lessons.length ? (
              <div className="mt-4 divide-y divide-[#edf2ed]">
                {lessons.slice(0, 8).map((lesson) => (
                  <Link key={lesson.id} href={`/lessons/${lesson.id}`}
                    className="flex min-h-14 items-center justify-between gap-3 py-3 text-base hover:text-[#0e7462]">
                    <span className="font-semibold">{lesson.title || "درس العربية"}</span>
                    <span className="shrink-0 text-xs text-[#667a70]">
                      {["completed","mastered"].includes(progress.get(lesson.id)?.status ?? "") ? "مكتمل" :
                        progress.get(lesson.id)?.status === "in_progress" ? "أكمل" : "افتح"}
                    </span>
                  </Link>
                ))}
              </div>
            ) : <p className="mt-4 text-sm leading-8 text-[#667a70]">
              لم تظهر دروس منشورة لهذا الصف في البيانات الحالية. لن نعرض لك دروس دولة أو صف مختلف.
            </p>}
          </section>
        ) : null}
        <Link href="/student/setup" className="inline-block text-sm font-semibold text-[#47766a] underline underline-offset-4">
          {setupNeeded ? "إعداد حسابي" : "تغيير الصف أو المسار عند الحاجة"}
        </Link>
      </div>
    </main>
  );
}
