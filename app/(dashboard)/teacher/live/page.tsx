import Link from "next/link";

import { createLiveSessionAction } from "@/features/live/actions";
import { createClient } from "@/lib/supabase/server";

export default async function TeacherLivePage() {
  const supabase = await createClient();

  const [
    sessions,
    courses,
    classes,
  ] = await Promise.all([
    supabase
      .from("edu_live_sessions")
      .select("id,title,starts_at,status")
      .order("starts_at", { ascending: true }),
    supabase
      .from("edu_marketplace_courses")
      .select("id,title")
      .in("status", ["draft", "published"])
      .order("created_at", { ascending: false }),
    supabase
      .from("teacher_classes")
      .select("id,name")
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <main
      dir="rtl"
      className="dadyoom-arabic-surface min-h-screen px-3 py-6 sm:px-5"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section className="rounded-[2rem] border border-[#dcc899] bg-white p-6">
          <div className="text-xs font-black text-[#a16f18]">
            Dadyoom Live
          </div>

          <h1 className="mt-2 text-2xl font-black text-[#123f39]">
            جدولة حصة مباشرة
          </h1>

          <form
            action={createLiveSessionAction}
            className="mt-5 space-y-4"
          >
            <input
              name="title"
              required
              placeholder="عنوان الحصة"
              className="w-full rounded-2xl border p-3"
            />

            <textarea
              name="description"
              placeholder="وصف مختصر"
              className="min-h-24 w-full rounded-2xl border p-3"
            />

            <label className="block font-bold">
              تبدأ
              <input
                type="datetime-local"
                name="startsAt"
                required
                className="mt-2 w-full rounded-2xl border p-3"
              />
            </label>

            <label className="block font-bold">
              تنتهي
              <input
                type="datetime-local"
                name="endsAt"
                className="mt-2 w-full rounded-2xl border p-3"
              />
            </label>

            <select
              name="courseId"
              className="w-full rounded-2xl border p-3"
              defaultValue=""
            >
              <option value="">
                اربط بكورس مدفوع (اختياري)
              </option>
              {(courses.data ?? []).map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>

            <select
              name="classId"
              className="w-full rounded-2xl border p-3"
              defaultValue=""
            >
              <option value="">
                أو اربط بفصل (اختياري)
              </option>
              {(classes.data ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="dadyoom-arabic-button rounded-2xl px-5 py-3 font-black text-white"
            >
              أنشئ الحصة
            </button>
          </form>
        </section>

        <section className="rounded-[2rem] border border-[#dcc899] bg-white p-6">
          <h2 className="text-2xl font-black text-[#123f39]">
            حصصي القادمة
          </h2>

          <div className="mt-5 space-y-3">
            {(sessions.data ?? []).map((session) => (
              <div
                key={session.id}
                className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="font-black">
                    {session.title}
                  </div>
                  <div className="mt-1 text-sm text-[#756b5f]">
                    {new Date(
                      session.starts_at,
                    ).toLocaleString("ar")}
                  </div>
                </div>

                <Link
                  href={`/live/${session.id}`}
                  className="rounded-2xl bg-[#123f39] px-4 py-2 text-center font-black text-white"
                >
                  افتح الغرفة
                </Link>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
