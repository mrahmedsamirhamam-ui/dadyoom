import type { Metadata } from "next";
import type { SupabaseClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";

import CheckoutButtons from "@/components/billing/CheckoutButtons";
import { createClient } from "@/lib/supabase/server";

type Params = {
  slug: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const db = supabase as unknown as SupabaseClient;

  const { data } = await db
    .from("edu_marketplace_courses")
    .select("title,description")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  return {
    title: data?.title
      ? `${data.title} | سوق ضاديوم`
      : "دورة | سوق ضاديوم",
    description:
      String(data?.description ?? "").slice(0, 155) ||
      "دورة تعليمية على منصة ضاديوم.",
  };
}

export default async function CoursePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const db = supabase as unknown as SupabaseClient;
  const { data: { user } } = await supabase.auth.getUser();

  const { data: course } = await db
    .from("edu_marketplace_courses")
    .select(
      "id,teacher_id,slug,title,description,price,currency,delivery_mode,status",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!course) notFound();

  const { data: purchase } = user
    ? await db
        .from("edu_marketplace_purchases")
        .select("id,status")
        .eq("buyer_id", user.id)
        .eq("course_id", course.id)
        .eq("status", "active")
        .maybeSingle()
    : { data: null };

  const isOwner = Boolean(user) && user?.id === course.teacher_id;
  const hasAccess = Boolean(purchase) || isOwner;

  const { data: lessons } = await db
    .from("edu_marketplace_course_lessons")
    .select(
      "id,title,description,content,video_url,live_url,live_at,sort_order,is_preview",
    )
    .eq("course_id", course.id)
    .order("sort_order");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description,
    provider: {
      "@type": "Organization",
      name: "ضاديوم",
      sameAs:
        process.env.NEXT_PUBLIC_SITE_URL ??
        "http://localhost:3000",
    },
    offers: {
      "@type": "Offer",
      price: Number(course.price).toFixed(3),
      priceCurrency: course.currency,
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <main
      dir="rtl"
      className="dadyoom-arabic-surface min-h-screen px-4 py-10"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />

      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-[2.4rem] bg-[#123f39] p-7 text-white">
          <div className="text-sm font-black text-[#f2ce7d]">
            دورة من سوق ضاديوم
          </div>
          <h1 className="mt-2 text-4xl font-black">
            {course.title}
          </h1>
          <p className="mt-3 leading-8">
            {course.description}
          </p>
          <div className="mt-4 text-xl font-black text-[#f3d18a]">
            {Number(course.price).toFixed(3)}{" "}
            {course.currency}
          </div>
        </section>

        {!hasAccess ? (
          <section className="rounded-[2rem] border bg-white p-5">
            <h2 className="text-xl font-black text-[#123f39]">
              الالتحاق بالدورة
            </h2>
            <div className="mt-4">
              <CheckoutButtons
                kind="course"
                courseId={course.id}
              />
            </div>
          </section>
        ) : (
          <div className="rounded-2xl bg-[#eaf6f0] p-4 font-black text-[#123f39]">
            لديك وصول كامل إلى الدورة.
          </div>
        )}

        <section className="space-y-3">
          {(lessons ?? []).map((lesson, index) => {
            const unlocked = hasAccess || lesson.is_preview;

            return (
              <article
                key={lesson.id}
                className="rounded-2xl border bg-white p-5"
              >
                <div className="text-xs font-black text-[#9b762f]">
                  الدرس {index + 1}
                </div>
                <h2 className="mt-1 text-xl font-black text-[#123f39]">
                  {lesson.title}
                </h2>

                {unlocked ? (
                  <div className="mt-3 space-y-3">
                    <p className="leading-8">
                      {lesson.description}
                    </p>
                    {lesson.content ? (
                      <div className="rounded-xl bg-[#fffaf0] p-4 leading-8">
                        {lesson.content}
                      </div>
                    ) : null}
                    {lesson.video_url ? (
                      <a
                        href={lesson.video_url}
                        target="_blank"
                        rel="noreferrer"
                        className="dadyoom-arabic-button inline-flex rounded-xl px-4 py-2 font-black text-white"
                      >
                        فتح فيديو الدرس
                      </a>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-3 text-sm font-bold text-[#776a59]">
                    هذا الدرس متاح بعد شراء الدورة.
                  </p>
                )}
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
