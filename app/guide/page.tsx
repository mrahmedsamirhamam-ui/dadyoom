import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ابدأ استخدام ضاديوم خطوة بخطوة | بيت العربية الرقمي",
  description: "دليل بسيط للطالب والمعلم وولي الأمر والمدرسة: اختر بلدك وصفك، افتح الدروس والألعاب، وتعرّف على خطوات حسابك.",
  alternates: { canonical: "/guide" },
};

const paths = [
  { title: "👩‍🎓 أنا طالب", intro: "أقدر أبدأ المذاكرة حتى قبل تسجيل الدخول.", steps: [
    { href: "/study", label: "اختر دولتك وصفك وابدأ أول درس", hint: "أمثلة وتدريب وإجابات لمهارات اللغة العربية" },
    { href: "/search", label: "ابحث باسم الدرس", hint: "اكتب كلمة من عنوان الدرس" },
    { href: "/student", label: "افتح لوحة الطالب", hint: "بعد تسجيل الدخول لمتابعة تقدمك" },
  ] },
  { title: "👩‍🏫 أنا معلم", intro: "أبدأ بفصلي ودروسي قبل الأدوات المتقدمة.", steps: [
    { href: "/teacher", label: "لوحة المعلم", hint: "اعرف حصصك ودروسك وخياراتك" },
    { href: "/teacher/studio", label: "جهّز درسًا أو ورقة عمل", hint: "راجع المقترحات قبل استخدامها مع الطلاب" },
    { href: "/teacher/classroom", label: "افتح فصلك", hint: "تواصل مع الطلاب عبر الأدوات المتاحة" },
  ] },
  { title: "👨‍👩‍👧 أنا ولي أمر", intro: "أتابع ابني من شاشة واحدة بعد الربط المصرح به.", steps: [
    { href: "/parent", label: "لوحة ولي الأمر", hint: "اربط طفلك وتابع تقدمه" },
    { href: "/courses", label: "استعرض منهج بلدي", hint: "ابحث عن الدولة والمرحلة والصف" },
    { href: "/reading-challenge", label: "شجّعه على القراءة", hint: "أنشطة للقراءة تساعده على الممارسة" },
  ] },
  { title: "🏫 أنا مدرسة", intro: "أبدأ بإدارة الأعضاء ثم الفصل والتقارير.", steps: [
    { href: "/school", label: "لوحة المدرسة", hint: "بيانات مدرستك والهيكل الأساسي" },
    { href: "/school/meetings", label: "الغرف والاجتماعات", hint: "الدردشة والسبورة متاحتان؛ الصوت والفيديو قيد التطوير" },
    { href: "/school/reports", label: "التقارير التعليمية", hint: "متابعة الأداء وفق الصلاحيات" },
  ] },
];
export default function StartGuide() {
  return <main dir="rtl" className="min-h-screen bg-[#f7f1e6] p-4 text-[#123f39] sm:p-8">
    <div className="mx-auto max-w-6xl space-y-7">
      <nav aria-label="المسار" className="flex flex-wrap gap-4 text-sm font-bold">
        <Link href="/" className="underline">الرئيسية</Link>
        <Link href="/study" className="underline">ذاكر الآن</Link>
        <Link href="/curriculum" className="underline">المناهج</Link>
      </nav>
      <header className="rounded-[2rem] bg-[#123f39] p-7 text-white">
        <p className="font-black text-[#eccc8b]">اللغة العربية أسهل في ضاديوم</p>
        <h1 className="mt-3 text-3xl font-black leading-relaxed">كيف أبدأ؟ ثلاث خطوات فقط</h1>
        <p className="mt-3 max-w-4xl leading-8 text-[#e1f2e9]">
          لا تحتاج إلى معرفة تقنية: اختر هل أنت طالب أم معلم أم ولي أمر أم مدرسة،
          واضغط على أول خطوة. يمكنك العودة إلى هذه الصفحة في أي وقت.
        </p>
        <Link href="/study" className="mt-5 inline-flex min-h-12 items-center rounded-full bg-[#eccc8b] px-6 py-3 font-black text-[#123f39]">
          ابدأ المذاكرة دون تسجيل ←
        </Link>
      </header>
      <section aria-label="طرق البدء حسب الدور" className="grid gap-5 md:grid-cols-2">
        {paths.map(persona=><article key={persona.title}
          className="rounded-3xl border border-[#d6c8a8] bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-2xl font-black">{persona.title}</h2>
          <p className="mt-2 text-sm leading-7 text-[#617167]">{persona.intro}</p>
          <ol className="mt-5 space-y-3">
            {persona.steps.map((step,i)=><li key={step.href}>
              <Link href={step.href} prefetch={false}
                className="flex min-h-20 items-center gap-3 rounded-2xl border border-[#e2dbc9] bg-[#faf7ef] p-4 hover:border-[#a1bdac] hover:bg-[#edf4e9]">
                <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#123f39] font-black text-white">{i+1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-black">{step.label}</span>
                  <span className="mt-1 block text-xs leading-6 text-[#617167]">{step.hint}</span>
                </span>
                <span aria-hidden="true">←</span>
              </Link>
            </li>)}
          </ol>
        </article>)}
      </section>
      <section className="rounded-3xl border border-[#e0d0ae] bg-white p-6">
        <h2 className="text-xl font-black">معلومة مهمة عن المناهج والدروس</h2>
        <p className="mt-3 leading-8">
          دروس مهارات ضاديوم الأصلية متاحة في الدول العربية الـ22، لكن هذا لا يعني مطابقة
          كل درس لكتاب الوزارة. استعمل دليل المناهج للتحقق من حالة كل نص ومصدره.
          الألعاب تساعد على التدريب، ولا تعادل اختبارًا وزاريًا معتمدًا.
        </p>
      </section>
    </div>
  </main>;
}
