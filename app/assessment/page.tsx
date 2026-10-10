import type { Metadata } from "next";
import Link from "next/link";
import { LocalizedText } from "@/components/i18n/LanguageProvider";

export const dynamic = "force-static";
export const revalidate = 86400;

// The assessment hub is a navigation page, not a lesson or an indexable quiz.
export const metadata: Metadata = {
  title: "الاختبارات والتقييمات | ضاديوم",
  description: "اختر درسًا من مناهج ضاديوم، ثم ابدأ الاختبار الذكي المرتبط بالدرس وراجع تقدمك.",
  robots: { index: false, follow: true },
};

export default function AssessmentHubPage() {
  return (
    <main className="min-h-screen bg-[#f7f1e6] px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <header className="rounded-[2rem] border border-[#d8c7a4] bg-white px-6 py-10 text-center sm:px-10">
          <p className="text-sm font-bold text-[#9a712c]">
            <LocalizedText ar="ضاديوم • التقييم" en="Dadyoom • Assessments" />
          </p>
          <h1 className="mt-4 text-4xl font-black leading-tight text-[#123f39]">
            <LocalizedText ar="اختبر ما تعلمته في العربية" en="Check your Arabic learning" />
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-9 text-[#625b51]">
            <LocalizedText
              ar="كل اختبار مرتبط بدرس محدد حتى تكون أسئلته ونتائجه مناسبة للمحتوى الذي درسته. اختر دولتك وصفك ثم افتح الدرس، واضغط «ابدأ الاختبار الذكي»."
              en="Assessments belong to individual Arabic lessons so practice and progress stay tied to the right material. Choose your country and grade, open a lesson, then select its assessment."
            />
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/courses" className="rounded-2xl bg-[#123f39] px-6 py-4 font-bold text-white">
              <LocalizedText ar="اختيار الدرس" en="Find a lesson" />
            </Link>
            <Link href="/curriculum" className="rounded-2xl border border-[#cdbb96] bg-white px-6 py-4 font-bold text-[#123f39]">
              <LocalizedText ar="دليل المناهج" en="Curriculum directory" />
            </Link>
            <Link href="/student" prefetch={false} className="rounded-2xl border border-[#cdbb96] bg-white px-6 py-4 font-bold text-[#123f39]">
              <LocalizedText ar="لوحة الطالب وتقدمه" en="Student progress" />
            </Link>
          </div>
        </header>
        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { ar: "1. اختر مستواك", en: "1. Choose your level", arBody: "حدد الدولة والصف والمقرر المناسب.", enBody: "Choose your country, grade and course." },
            { ar: "2. تعلم الدرس", en: "2. Study a lesson", arBody: "اقرأ الشرح وتدرّب قبل التقييم.", enBody: "Read the explanation and practise first." },
            { ar: "3. ابدأ الاختبار", en: "3. Start the assessment", arBody: "استخدم زر الاختبار داخل الدرس نفسه.", enBody: "Use the assessment button on the lesson page." },
          ].map(step => (
            <div key={step.en} className="rounded-3xl border border-[#ddcfb4] bg-white p-6">
              <h2 className="text-xl font-black text-[#123f39]"><LocalizedText ar={step.ar} en={step.en} /></h2>
              <p className="mt-3 leading-8 text-[#625b51]"><LocalizedText ar={step.arBody} en={step.enBody} /></p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
