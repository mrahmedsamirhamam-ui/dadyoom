import type { SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";
import { redirect } from "next/navigation";

import CopyLiveLinkButton from "@/components/live/CopyLiveLinkButton";
import { createSchoolMeetingAction } from "@/features/live/actions";
import { createClient } from "@/lib/supabase/server";

export default async function SchoolMeetingsPage() {
  const supabase = await createClient();
  const db = supabase as unknown as SupabaseClient;
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

  if (role !== "school" && role !== "admin") {
    redirect("/student");
  }

  const { data: school } = await supabase
    .from("schools")
    .select("id,name")
    .eq("owner_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!school) {
    redirect("/school");
  }

  const { data: sessions } = await db
    .from("edu_live_sessions")
    .select("id,title,description,starts_at,ends_at,status")
    .eq("school_id", school.id)
    .order("starts_at", { ascending: true });

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6"
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-violet-700">
              اجتماعات المدرسة المباشرة
            </p>
            <h1 className="mt-1 text-3xl font-black text-slate-950">
              غرفة اجتماع للمعلمين
            </h1>
            <p className="mt-2 text-slate-600">
              أنشئ اجتماعًا بالصوت والصورة والمحادثة داخل ضاديوم، ثم شارك رابط الغرفة مع معلمي المدرسة.
            </p>
          </div>

          <Link
            prefetch={false}
            href="/school"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-black text-slate-700"
          >
            ← لوحة المدرسة
          </Link>
        </div>

        <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <form
            action={createSchoolMeetingAction}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-xl font-black text-slate-900">
              اجتماع جديد
            </h2>

            <div className="mt-5 space-y-4">
              <input
                name="title"
                required
                placeholder="مثال: اجتماع قسم اللغة العربية"
                className="w-full rounded-xl border border-slate-300 p-3"
              />

              <textarea
                name="description"
                rows={3}
                placeholder="موضوع الاجتماع أو جدول الأعمال"
                className="w-full rounded-xl border border-slate-300 p-3"
              />

              <label className="block text-sm font-bold text-slate-700">
                يبدأ
                <input
                  type="datetime-local"
                  name="startsAt"
                  required
                  className="mt-2 w-full rounded-xl border border-slate-300 p-3"
                />
              </label>

              <label className="block text-sm font-bold text-slate-700">
                ينتهي
                <input
                  type="datetime-local"
                  name="endsAt"
                  className="mt-2 w-full rounded-xl border border-slate-300 p-3"
                />
              </label>

              <button
                type="submit"
                className="w-full rounded-xl bg-violet-700 px-5 py-3 font-black text-white"
              >
                إنشاء غرفة الاجتماع
              </button>
            </div>
          </form>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">
              الاجتماعات المجدولة — {school.name}
            </h2>

            <div className="mt-5 space-y-3">
              {(sessions ?? []).map((session) => (
                <article
                  key={session.id}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="font-black text-slate-900">
                    {session.title}
                  </div>

                  {session.description ? (
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {session.description}
                    </p>
                  ) : null}

                  <div className="mt-2 text-sm text-slate-500">
                    {new Date(session.starts_at).toLocaleString("ar-BH")}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      prefetch={false}
                      href={`/live/${session.id}`}
                      className="rounded-2xl bg-[#123f39] px-4 py-2 text-sm font-black text-white"
                    >
                      فتح الغرفة
                    </Link>

                    <CopyLiveLinkButton sessionId={session.id} />
                  </div>
                </article>
              ))}

              {!sessions?.length ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
                  لا توجد اجتماعات مجدولة بعد.
                </div>
              ) : null}
            </div>
          </section>
        </section>

        <section className="rounded-2xl border border-violet-200 bg-violet-50 p-5 text-sm leading-7 text-violet-900">
          الرابط يعمل داخل ضاديوم لمعلمي المدرسة المرتبطين بالحساب. عند تفعيل بيانات LiveKit في الإنتاج ستعمل الكاميرا والميكروفون والمحادثة داخل نفس الغرفة.
        </section>
      </div>
    </main>
  );
}
