import type { Metadata } from "next";
import type { SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "سوق ضاديوم | دورات ودروس اللغة العربية",
  description:
    "اكتشف دورات اللغة العربية التي يقدمها معلمون على منصة ضاديوم.",
};

export default async function MarketplacePage() {
  const supabase = await createClient();
  const db = supabase as unknown as SupabaseClient;

  const { data: courses } = await db
    .from("edu_marketplace_courses")
    .select(
      "id,slug,title,description,price,currency,delivery_mode,created_at",
    )
    .eq("status", "published")
    .order("created_at", {
      ascending: false,
    });

  const rows = courses ?? [];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "سوق ضاديوم للدورات",
    itemListElement: rows.map((course, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: course.title,
      url:
        `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/marketplace/${course.slug}`,
    })),
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

      <div className="mx-auto max-w-7xl space-y-7">
        <section className="rounded-[2.4rem] bg-[#123f39] p-7 text-white">
          <div className="text-sm font-black text-[#f2ce7d]">
            سوق ضاديوم
          </div>
          <h1 className="mt-2 text-4xl font-black">
            تعلّم مع معلمين من مجتمع ضاديوم
          </h1>
          <p className="mt-3 max-w-3xl leading-8">
            دورات مسجلة ومباشرة، شراء آمن عبر PayPal أو تحويل بنكي.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((course) => (
            <Link
              key={course.id}
              href={`/marketplace/${course.slug}`}
              className="group rounded-[2rem] border border-[#dcc899] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="dadyoom-course-pattern h-28 rounded-2xl" />
              <h2 className="mt-4 text-xl font-black text-[#123f39]">
                {course.title}
              </h2>
              <p className="mt-2 line-clamp-3 leading-7 text-[#6d6356]">
                {course.description}
              </p>
              <div className="mt-4 font-black text-[#9a6c19]">
                {Number(course.price).toFixed(3)}{" "}
                {course.currency}
              </div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
