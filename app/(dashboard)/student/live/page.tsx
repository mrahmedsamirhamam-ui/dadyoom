import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export default async function StudentLivePage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("edu_live_sessions")
    .select("id,title,starts_at,ends_at,status")
    .in("status", ["scheduled", "live"])
    .order("starts_at", { ascending: true });

  return (
    <main
      dir="rtl"
      className="dadyoom-arabic-surface min-h-screen px-3 py-6 sm:px-5"
    >
      <div className="mx-auto w-full max-w-4xl">
        <div className="text-xs font-black text-[#a16f18]">
          Dadyoom Live
        </div>

        <h1 className="mt-2 text-3xl font-black text-[#123f39]">
          حصصي المباشرة
        </h1>

        <div className="mt-6 space-y-3">
          {(data ?? []).map((session) => (
            <section
              key={session.id}
              className="flex flex-col gap-3 rounded-3xl border border-[#dcc899] bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h2 className="font-black">
                  {session.title}
                </h2>
                <div className="mt-1 text-sm text-[#756b5f]">
                  {new Date(
                    session.starts_at,
                  ).toLocaleString("ar")}
                </div>
              </div>

              <Link
                href={`/live/${session.id}`}
                className="rounded-2xl bg-[#123f39] px-5 py-3 text-center font-black text-white"
              >
                ادخل الحصة
              </Link>
            </section>
          ))}

          {!data?.length ? (
            <div className="rounded-3xl bg-white p-6 text-center font-bold text-[#756b5f]">
              لا توجد حصص متاحة لك الآن.
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
