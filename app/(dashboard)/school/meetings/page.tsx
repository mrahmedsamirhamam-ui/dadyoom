import type { SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";
import { redirect } from "next/navigation";

import CopyLiveLinkButton from "@/components/live/CopyLiveLinkButton";
import SchoolMeetingCreationForm from "./SchoolMeetingCreationForm";
import { getDashboardRequestViewer } from "@/lib/auth/request-viewer";

function formatBahrainDateTime(value: string | null) {
  if (!value) return "الموعد غير محدد";

  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "الموعد غير محدد";

  const date = new Date(timestamp + 3 * 60 * 60 * 1000);
  const pad = (part: number) => String(part).padStart(2, "0");

  return [
    pad(date.getUTCDate()),
    pad(date.getUTCMonth() + 1),
    date.getUTCFullYear(),
  ].join("/") +
    " " +
    [
      pad(date.getUTCHours()),
      pad(date.getUTCMinutes()),
    ].join(":");
}

export default async function SchoolMeetingsPage() {
  // Reuse request-scoped authentication and profile across the dashboard.
  // Avoid another independent getUser() + profile query during Cloudflare SSR.
  const { supabase, user, userError, profile, profileError } =
    await getDashboardRequestViewer();
  if (userError || !user) {
    redirect("/login");
  }
  if (profileError || !profile) {
    throw new Error("تعذر التحقق من صلاحيات المدرسة.");
  }
  const db = supabase as unknown as SupabaseClient;
  const role = String(profile.role ?? "").trim().toLowerCase();

  if (
    role !== "school" &&
    role !== "admin"
  ) {
    redirect("/student");
  }

  const schoolResult = await supabase
    .from("schools")
    .select("id,name")
    .eq("owner_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (schoolResult.error) {
    throw schoolResult.error;
  }

  const school =
    schoolResult.data;

  if (!school) {
    redirect("/school");
  }

  const {
    data: sessions,
    error: sessionsError,
  } = await db
    .from("edu_live_sessions")
    .select("id,title,description,starts_at,ends_at,status")
    .eq("school_id", school.id)
    .order("starts_at", { ascending: true })
    .limit(50);

  if (sessionsError) {
    throw sessionsError;
  }

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
          <SchoolMeetingCreationForm />

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
                    {formatBahrainDateTime(session.starts_at)}
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
