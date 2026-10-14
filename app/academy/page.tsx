import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "أكاديمية ضاديوم | دعم المعلمين والورش المجانية",
  description: "ورش مجانية ومساندة تربوية وتقنية للمعلمين من ضاديوم. صفحة تعريفية بالبرنامج التجريبي.",
  robots: { index: false, follow: true },
};

const workshops = [
  { title: "الذكاء الاصطناعي في خدمة المعلم", details: "من تحضير الدرس إلى بناء الأنشطة والتقييم مع مراجعة المعلم للمخرجات." },
  { title: "تصميم اختبارات تقيس التفكير", details: "نواتج التعلم، جدول المواصفات، ومستويات بلوم مع تطبيقات عملية." },
  { title: "التعليم المتمايز وإدارة الصف", details: "استراتيجيات عملية لمراعاة الفروق الفردية وتيسير التعلم." },
];

export default function AcademyPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#fffaf0] px-4 py-12 text-[#27231f]">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm underline underline-offset-4">العودة إلى ضاديوم</Link>
        <p className="mt-10 text-sm font-semibold text-[#174f47]">ضاديوم — بيت العربية الرقمي</p>
        <h1 className="mt-3 text-3xl font-bold">أكاديمية ضاديوم لتمكين المعلمين</h1>
        <p className="mt-4 max-w-2xl leading-8">
          نعمل على إعداد مركز للدعم التربوي والتقني وورش تطوير مهني عملية للمعلمين.
          المرحلة التجريبية المقترحة مجانية؛ ولم يُفتح التسجيل أو تُحدد مواعيد الورش بعد.
        </p>
        <section aria-labelledby="workshops-title" className="mt-10">
          <h2 id="workshops-title" className="text-2xl font-bold">الورش التجريبية المقترحة</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {workshops.map((workshop) => (
              <article key={workshop.title} className="rounded-2xl border border-[#e5d8bf] bg-white p-5">
                <h3 className="font-bold">{workshop.title}</h3>
                <p className="mt-3 text-sm leading-7">{workshop.details}</p>
                <p className="mt-4 text-sm font-semibold text-[#174f47]">مقترحة · مجانية في المرحلة التجريبية</p>
              </article>
            ))}
          </div>
        </section>
        <section className="mt-10 rounded-2xl bg-[#e8f2ed] p-6" aria-labelledby="support-title">
          <h2 id="support-title" className="text-xl font-bold">دعم المعلمين وشهادات المشاركة</h2>
          <p className="mt-3 leading-8">
            نخطط لتقديم حلول تربوية وتقنية عملية، وشهادات إتمام صادرة عن ضاديوم قابلة للتحقق
            إلكترونيًا بعد استيفاء متطلبات المشاركة. هذه الشهادات ليست اعتمادًا رسميًا من جهة حكومية أو دولية.
            خدمة الدعم وإصدار الشهادات لم تُفعّلا بعد.
          </p>
        </section>
        <p className="mt-8 text-sm text-[#5b5349]">هذه صفحة تعريفية قيد التطوير، وليست بوابة تسجيل أو دفع.</p>
      </div>
    </main>
  );
}
