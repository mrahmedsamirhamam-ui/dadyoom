import "server-only";

import Link from "next/link";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 40;
const sourceNotReadyMarker = [
  { kind: "dadyoom_source", source_publication_ready: false },
];

type ReviewLesson = {
  id: string;
  title: string;
  summary: string | null;
  updated_at: string | null;
};

export default async function SourceReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  // Authorize here even though the parent admin layout is also protected.
  const session = await createClient();
  const { data: { user }, error: authError } = await session.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: profile, error: profileError } = await session
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError || profile?.role?.trim().toLowerCase() !== "admin") redirect("/");

  const params = await searchParams;
  const requestedPage = Number(params.page ?? "1");
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0
    ? Math.min(requestedPage, 1000)
    : 1;
  const offset = (page - 1) * PAGE_SIZE;

  let items: ReviewLesson[] = [];
  let count: number | null = null;
  let errorMessage: string | null = null;

  try {
    // Server-side only. The service key and source metadata never go to the client.
    const db = createAdminClient();
    const result = await db
      .from("lessons")
      .select("id,title,summary,updated_at", { count: "exact" })
      .eq("status", "published")
      .contains("instructions", sourceNotReadyMarker)
      .order("updated_at", { ascending: false })
      .order("id", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (result.error) {
      errorMessage = "تعذر جلب بيانات المراجعة من المصدر.";
    } else {
      items = (result.data ?? []) as ReviewLesson[];
      count = result.count;
    }
  } catch {
    errorMessage = "خدمة مراجعة المصدر غير متاحة في إعدادات الخادم الحالية.";
  }

  const totalPages = count === null ? 0 : Math.ceil(count / PAGE_SIZE);

  return (
    <main dir="rtl" className="px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-3">
          <Link href="/admin/curriculum" className="text-sm font-bold text-[#1b6757] hover:underline">
            العودة إلى بوابة المناهج
          </Link>
          <h1 className="text-3xl font-black text-[#173f35]">قائمة مراجعة جاهزية مصادر الدروس</h1>
          <p className="max-w-4xl text-sm leading-8 text-[#50675a]">
            هذه الدروس ما زالت منشورة داخل قاعدة المحتوى، لكن علم المصدر المحفوظ لها يشير إلى أنها غير جاهزة للاعتماد التحريري.
            لا يعني ظهورها أنها مطابقة لكتاب الوزارة، ولا يُسمح بتحويل حالتها إلى جاهزة دون مراجعة المصدر والشرح والأهداف والأسئلة.
          </p>
        </header>

        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-bold text-amber-900">تحتاج مراجعة بشرية موثقة</p>
          <p className="mt-2 text-3xl font-black text-amber-950">
            {count === null ? "غير متاح" : count.toLocaleString("ar-BH")} <span className="text-base">درسًا</span>
          </p>
          <p className="mt-2 text-xs leading-6 text-amber-950">
            هذا عدد سجلات تحمل علامة عدم الجاهزية، وليس عدد الدروس الناقصة في المناهج الرسمية.
          </p>
        </section>

        {errorMessage ? (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">
            {errorMessage}
          </p>
        ) : null}

        <section aria-label="الدروس التي تتطلب المراجعة" className="space-y-3">
          {items.map((lesson) => (
            <article key={lesson.id} className="rounded-2xl border border-[#dfe9e2] bg-white p-5">
              <h2 className="text-lg font-black text-[#173f35]">{lesson.title}</h2>
              <p className="mt-2 text-sm leading-7 text-[#64776b]">
                {lesson.summary?.trim() || "لا يوجد ملخص وصفي متاح."}
              </p>
              <p className="mt-2 text-xs text-[#6d8277]" dir="auto">
                {lesson.id}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={`/lessons/${lesson.id}`}
                  className="inline-flex min-h-10 items-center rounded-xl bg-[#174f47] px-4 py-2 text-sm font-bold text-white"
                >
                  افتح الدرس للمراجعة
                </Link>
                <Link
                  href="/admin/lessons"
                  className="inline-flex min-h-10 items-center rounded-xl border border-[#bdd7c6] px-4 py-2 text-sm font-bold text-[#174f47]"
                >
                  إدارة الدروس
                </Link>
              </div>
            </article>
          ))}
          {!errorMessage && items.length === 0 ? (
            <p className="rounded-2xl bg-white p-6 text-sm text-[#52685b]">
              لا توجد نتائج لهذه الصفحة.
            </p>
          ) : null}
        </section>

        {totalPages > 1 ? (
          <nav aria-label="صفحات قائمة المراجعة" className="flex items-center justify-between gap-4">
            {page > 1 ? (
              <Link className="rounded-xl border border-[#b9d0c4] px-4 py-2 font-bold" href={`?page=${page - 1}`}>
                الصفحة السابقة
              </Link>
            ) : <span />}
            <p className="text-sm text-[#52685b]">صفحة {page} من {totalPages}</p>
            {page < totalPages ? (
              <Link className="rounded-xl border border-[#b9d0c4] px-4 py-2 font-bold" href={`?page=${page + 1}`}>
                الصفحة التالية
              </Link>
            ) : <span />}
          </nav>
        ) : null}
      </div>
    </main>
  );
}
