import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

/**
 * Public aggregate counts only. A failed or RLS-restricted query must not
 * turn into a fictional number, or expose profile/student information.
 * The surrounding Suspense boundary keeps the hero independent of DB latency.
 */
export default async function HomeTrustStrip() {
  try {
    const db = await createClient();
    const [lessonResult, curriculumResult] = await Promise.all([
      db.from("lessons")
        .select("id,title", { count: "exact" })
        .eq("status", "published")
        .order("id", { ascending: true })
        .limit(1),
      db.from("curricula")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
    ]);

    if (lessonResult.error || curriculumResult.error) return null;
    const lessons = lessonResult.count;
    const curricula = curriculumResult.count;
    if (!lessons || !curricula) return null;

    const format = new Intl.NumberFormat("ar-BH");
    const sample = lessonResult.data?.[0];

    return (
      <section aria-labelledby="home-trust-title" className="border-b border-[#e2d4b8] bg-[#f7f0e3] py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 id="home-trust-title" className="font-arabic-display text-2xl font-black text-[#173f35]">تعلّم من محتوى ضاديوم المنشور</h2>
          <p className="mt-2 text-sm leading-7 text-[#3d4a46]">الأعداد من الدروس المنشورة والمناهج النشطة الظاهرة في قاعدة البيانات، ولا تعني اكتمال المطابقة الرسمية.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#dac7a0] bg-white p-4">
              <p className="text-sm font-bold text-[#3d4a46]">دروس منشورة</p>
              <p className="mt-1 text-3xl font-black text-[#174d44]" aria-label={format.format(lessons) + " درسًا منشورًا"}>{format.format(lessons)}</p>
            </div>
            <div className="rounded-2xl border border-[#dac7a0] bg-white p-4">
              <p className="text-sm font-bold text-[#3d4a46]">مناهج نشطة</p>
              <p className="mt-1 text-3xl font-black text-[#174d44]" aria-label={format.format(curricula) + " منهجًا نشطًا"}>{format.format(curricula)}</p>
            </div>
          </div>
          {sample?.id && sample?.title ? (
            <p className="mt-4 text-sm leading-8 text-[#3d4a46]">
              من الدروس المنشورة: <Link href={"/lessons/" + encodeURIComponent(sample.id)} className="font-bold text-[#174d44] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2">{sample.title}</Link>
            </p>
          ) : null}
        </div>
      </section>
    );
  } catch {
    // No production metrics without a verified read; homepage remains useful.
    return null;
  }
}
