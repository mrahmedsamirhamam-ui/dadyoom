import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLearningGuide, learningGuides } from "@/content/learning-guides";
type GuideParams = { params: Promise<{ slug: string }> };
export function generateStaticParams() {
 return learningGuides.map(({ slug }) => ({ slug }));
}
export async function generateMetadata({ params }: GuideParams): Promise<Metadata> {
 const { slug } = await params;
 const guide = getLearningGuide(slug);
 if (!guide) return { title: "الدليل غير موجود", robots: { index: false } };
 return {
  title: `${guide.title} | أدلة ضاديوم`,
  description: guide.description,
  alternates: { canonical: `/guides/${guide.slug}` },
  openGraph: { title: guide.title, description: guide.description },
 };
}
export default async function GuideArticlePage({ params }: GuideParams) {
 const { slug } = await params;
 const guide = getLearningGuide(slug);
 if (!guide) notFound();
 return (
  <main dir="rtl" className="mx-auto max-w-3xl px-4 py-12 text-[#123f39]">
   <nav aria-label="التنقل بين أدلة التعلم"><Link href="/guides" className="font-bold underline underline-offset-4">الأدلة التعليمية</Link></nav>
   <article className="mt-7">
    <header className="border-b border-emerald-100 pb-7">
     <p className="text-sm font-bold text-emerald-800">ضاديوم — دليل تعلُّم أصيل</p>
     <h1 className="mt-3 text-3xl font-extrabold leading-relaxed">{guide.title}</h1>
     <p className="mt-4 leading-8 text-slate-700">{guide.description}</p>
    </header>
    {guide.sections.map((section, index) => (
     <section className="mt-8" key={index}>
      <h2 className="text-xl font-extrabold">{section.heading}</h2>
      <p className="mt-3 whitespace-pre-line leading-9 text-slate-800">{section.body}</p>
     </section>
    ))}
   </article>
   <aside className="mt-10 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
    <p className="font-bold">تطبيق الدرس يبدأ بالممارسة</p>
    <p className="mt-2 text-sm leading-7">هذا دليل إثرائي من تأليف ضاديوم، وليس وثيقة اعتماد أو بديلًا مؤكدًا عن متطلبات المنهج الرسمي.</p>
    <Link href="/courses" className="mt-3 inline-block font-bold underline underline-offset-4">استكشف مسارات الدروس</Link>
   </aside>
  </main>
 );
}