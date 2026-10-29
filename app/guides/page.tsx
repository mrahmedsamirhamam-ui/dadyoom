import type { Metadata } from "next";
import Link from "next/link";
import { learningGuides } from "@/content/learning-guides";
export const metadata: Metadata = {
 title: "أدلة تعلّم العربية | ضاديوم",
 description: "مقالات أصلية مجانية في مهارات القراءة والنطق والإملاء وفهم المقروء ومساندة المتعلم.",
 alternates: { canonical: "/guides" },
};
export default function GuidesPage() {
 return (
  <main dir="rtl" className="mx-auto max-w-6xl px-4 py-12 text-[#123f39]">
   <h1 className="text-4xl font-extrabold">أدلة تعلّم العربية</h1>
   <p className="mt-4 max-w-3xl leading-8 text-slate-700">
    موارد عربية أصلية للمتعلمين والمعلمين وأولياء الأمور، للتعلم والإثراء لا بوصفها نسخة من منهج وزاري.
   </p>
   <div className="mt-8 grid gap-5 md:grid-cols-2">
    {learningGuides.map((guide) => (
     <article key={guide.slug} className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-extrabold"><Link className="underline-offset-4 hover:underline" href={`/guides/${guide.slug}`}>{guide.title}</Link></h2>
      <p className="mt-3 leading-7 text-slate-700">{guide.description}</p>
      <Link className="mt-4 inline-flex font-bold text-emerald-800 underline underline-offset-4" href={`/guides/${guide.slug}`}>اقرأ الدليل</Link>
     </article>
    ))}
   </div>
  </main>
 );
}