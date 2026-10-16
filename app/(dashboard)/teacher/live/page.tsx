import Link from "next/link";
import { redirect } from "next/navigation";

import CopyLiveLinkButton from "@/components/live/CopyLiveLinkButton";

import TeacherLiveCreationForm from "./TeacherLiveCreationForm";
import { createClient } from "@/lib/supabase/server";

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

export default async function TeacherLivePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    sessions,
    courses,
    classes,
  ] = await Promise.all([
    supabase
      .from("edu_live_sessions")
      .select("id,title,starts_at,status")
      .eq("teacher_id", user.id)
      .order("starts_at", { ascending: true }),
    supabase
      .from("edu_marketplace_courses")
      .select("id,title")
      .in("status", ["draft", "published"])
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("teacher_classes")
      .select("id,name")
      .eq("is_active", true)
      .eq("teacher_id", user.id)
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

          <TeacherLiveCreationForm courses={courses.data ?? []} classes={classes.data ?? []} />        </section>

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
                    {formatBahrainDateTime(
                      session.starts_at,
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/live/${session.id}`}
                    prefetch={false}
                    className="rounded-2xl bg-[#123f39] px-4 py-2 text-center font-black text-white"
                  >
                    افتح الغرفة
                  </Link>
                  <CopyLiveLinkButton sessionId={session.id} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
