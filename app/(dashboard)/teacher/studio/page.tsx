import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import TeacherLessonPackClient from "./TeacherLessonPackClient";

export const metadata: Metadata = {
  title: "Teacher Studio | حزمة الدرس بالذكاء الاصطناعي",
  robots: {
    index: false,
    follow: false,
  },
};

type LessonRow = {
  id: string;
  title: string;
  summary: string | null;
  updated_at: string | null;
  estimated_minutes: number | null;
};

export default async function TeacherStudioPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    lesson?: string;
  }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = String(profile?.role ?? "").trim().toLowerCase();

  if (role !== "teacher" && role !== "admin") {
    redirect("/student");
  }

  const params = await searchParams;
  const q = String(params.q ?? "").trim().slice(0, 120);
  const selectedLessonId = String(params.lesson ?? "").trim();

  let query = supabase
    .from("lessons")
    .select("id,title,summary,updated_at,estimated_minutes")
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(30);

  if (q) {
    query = query.ilike("title", "%" + q + "%");
  }

  const { data, error } = await query;

  if (error) {
    console.error("TEACHER_STUDIO_LESSON_SEARCH_FAILED", error.message);
  }

  const lessons = (data ?? []) as LessonRow[];

  let selectedLesson =
    lessons.find((lesson) => lesson.id === selectedLessonId) ?? null;

  if (selectedLessonId && !selectedLesson) {
    const { data: directLesson } = await supabase
      .from("lessons")
      .select("id,title,summary,updated_at,estimated_minutes")
      .eq("id", selectedLessonId)
      .eq("status", "published")
      .maybeSingle();

    selectedLesson = (directLesson as LessonRow | null) ?? null;
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl space-y-7">
        <section className="rounded-[2rem] bg-gradient-to-l from-[#123f39] to-teal-600 p-7 text-white shadow-lg">
          <p className="text-sm font-black text-teal-100">
            Dadyoom Teacher Studio
          </p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            حزمة الدرس كاملة من زر واحد
          </h1>
          <p className="mt-3 max-w-4xl leading-8 text-teal-50">
            اختر أي درس منشور في ضاديوم ليبني الذكاء الاصطناعي خطة الحصة
            وأهداف بلوم والأنشطة المتمايزة وورقة العمل والتقويم والواجب
            ومخطط العرض، ثم استخدم PowerPoint والألعاب وQR الجاهزة.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="space-y-4">
            <form
              action="/teacher/studio"
              method="get"
              className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
            >
              <label
                htmlFor="studio-search"
                className="font-black text-slate-800"
              >
                ابحث عن درس
              </label>
              <input
                id="studio-search"
                name="q"
                type="search"
                defaultValue={q}
                placeholder="مثال: أسماء الإشارة"
                className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-teal-500"
              />
              <button
                type="submit"
                className="mt-3 w-full rounded-xl bg-teal-700 px-4 py-3 font-black text-white"
              >
                بحث
              </button>
            </form>

            <div className="max-h-[680px] space-y-2 overflow-y-auto rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              {lessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  href={
                    "/teacher/studio?lesson=" +
                    lesson.id +
                    (q ? "&q=" + encodeURIComponent(q) : "")
                  }
                  prefetch={false}
                  className={[
                    "block rounded-2xl border p-4 transition",
                    selectedLesson?.id === lesson.id
                      ? "border-teal-400 bg-teal-50"
                      : "border-slate-200 hover:border-teal-300",
                  ].join(" ")}
                >
                  <h2 className="font-black leading-7 text-slate-900">
                    {lesson.title}
                  </h2>
                  {lesson.summary ? (
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                      {lesson.summary}
                    </p>
                  ) : null}
                </Link>
              ))}

              {!error && lessons.length === 0 ? (
                <p className="p-4 text-center text-slate-500">
                  لم نجد درسًا مطابقًا.
                </p>
              ) : null}
            </div>
          </aside>

          <div>
            {selectedLesson ? (
              <TeacherLessonPackClient
                lessonId={selectedLesson.id}
                lessonTitle={selectedLesson.title}
              />
            ) : (
              <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <div className="text-5xl">✨</div>
                <h2 className="mt-4 text-2xl font-black text-slate-900">
                  اختر درسًا للبدء
                </h2>
                <p className="mx-auto mt-3 max-w-xl leading-8 text-slate-500">
                  ابحث باسم الدرس من القائمة، ثم اضغط عليه. ستظهر إعدادات
                  الحصة ويمكنك إنشاء الحزمة كاملة مباشرة.
                </p>
                <Link
                  href="/curriculum"
                  className="mt-5 inline-flex rounded-xl border border-teal-200 bg-teal-50 px-5 py-3 font-black text-teal-800"
                >
                  استعرض دليل المناهج
                </Link>
              </section>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
