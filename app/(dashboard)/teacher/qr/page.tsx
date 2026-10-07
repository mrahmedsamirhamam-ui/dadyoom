import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "QR الذكي للمعلم",
  robots: { index: false, follow: false },
};

type QrLessonRow = {
  id: string;
  title: string;
  updated_at: string | null;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export default async function TeacherQrPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
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

  const { q: rawQ = "" } = await searchParams;
  const q = rawQ.trim().slice(0, 120);

  let query = supabase
    .from("lessons")
    .select("id,title,updated_at")
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(36);

  if (q) {
    query = UUID_RE.test(q)
      ? query.eq("id", q)
      : query.ilike("title", "%" + q + "%");
  }

  const { data, error } = await query;

  if (error) {
    console.error("TEACHER_SMART_QR_SEARCH_FAILED", error.message);
  }

  const lessons = (data ?? []) as QrLessonRow[];

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl space-y-7">
        <section className="rounded-[2rem] bg-[#123f39] p-7 text-white shadow-lg">
          <p className="text-sm font-black text-teal-100">
            Dadyoom Smart QR
          </p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            حوّل أي درس إلى بوابة رقمية
          </h1>
          <p className="mt-3 max-w-3xl leading-8 text-teal-50">
            كل درس منشور في ضاديوم يمتلك رمز QR تلقائيًا. ابحث عن الدرس،
            نزّل الرمز، ثم ضعه في الكتاب أو ورقة العمل أو الواجب.
          </p>
        </section>

        <form
          action="/teacher/qr"
          method="get"
          className="flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:flex-row"
        >
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="ابحث باسم الدرس أو الصق معرّف الدرس..."
            className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-teal-500"
          />
          <button
            type="submit"
            className="rounded-2xl bg-teal-700 px-6 py-3 font-black text-white"
          >
            بحث
          </button>
        </form>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-800">
            تعذر تحميل الدروس الآن.
          </div>
        ) : null}

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {lessons.map((lesson) => {
            const qrSrc = "/api/qr/lesson/" + lesson.id;
            const context =
              "درس منشور في ضاديوم • QR متاح للطباعة";

            return (
              <article
                key={lesson.id}
                className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
              >
                <div className="flex gap-4">
                  <div className="shrink-0 rounded-2xl bg-white p-2 ring-1 ring-slate-200">
                    <Image
                      src={qrSrc}
                      alt={"QR لدرس " + lesson.title}
                      width={112}
                      height={112}
                      unoptimized
                      className="h-28 w-28 rounded-xl"
                    />
                  </div>

                  <div className="min-w-0">
                    <h2 className="font-black leading-7 text-slate-900">
                      {lesson.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {context}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <a
                    href={qrSrc + "?download=1"}
                    className="rounded-xl bg-[#123f39] px-4 py-2 text-sm font-black text-white"
                  >
                    تنزيل QR
                  </a>
                  <Link
                    href={"/lessons/" + lesson.id}
                    prefetch={false}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700"
                  >
                    فتح الدرس
                  </Link>
                  <Link
                    href={"/q/" + lesson.id}
                    rel="nofollow"
                    prefetch={false}
                    className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-black text-teal-800"
                  >
                    اختبار المسح
                  </Link>
                </div>
              </article>
            );
          })}
        </section>

        {!error && lessons.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            لم نجد درسًا مطابقًا. جرّب جزءًا آخر من اسم الدرس.
          </div>
        ) : null}
      </div>
    </main>
  );
}
