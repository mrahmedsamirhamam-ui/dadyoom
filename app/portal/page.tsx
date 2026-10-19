import type { Metadata } from "next";
import Link from "next/link";
import DadyoomLogo from "@/components/brand/DadyoomLogo";

export const metadata: Metadata = {
  title: "بوابة الوصول ودليل الأدوار",
  description: "بوابة ضاديوم الموحدة للطالب والمعلم وولي الأمر والمدرسة: اختَر دورك، أنشئ حسابك، وتعرّف على طريقة استخدام أدواتك.",
  alternates: { canonical: "/portal" },
};

type PortalAudience = {
  role: "student" | "teacher" | "parent" | "school";
  title: string;
  icon: string;
  tagline: string;
  action: string;
  dashboard: string;
  features: readonly string[];
  steps: readonly string[];
};

const audiences: readonly PortalAudience[] = [
  {
    role: "student",
    title: "الطالب",
    icon: "🎓",
    tagline: "أتعلم العربية من منهجي، وأتدرب حتى أتقن.",
    action: "ابدأ كطالب",
    dashboard: "/student",
    features: ["الدولة والصف والوحدة والدرس", "المهارات الأربع والتدريب", "رحلتي وتقدمي واسأل ضاد"],
    steps: [
      "أنشئ حساب طالب، واختر دولتك ومرحلتك الدراسية حين تتوفر الخيارات.",
      "افتح «منهجي» أو «المناهج»، ثم اختر درسًا منشورًا وابدأ التعلم.",
      "حل الأنشطة، وراجع تقدّمك، واستخدم «اسأل ضاد» عند الحاجة.",
    ],
  },
  {
    role: "teacher",
    title: "المعلم",
    icon: "👨‍🏫",
    tagline: "أُنظّم فصولي وأثري الدروس وأتابع طلابي.",
    action: "ابدأ كمعلم",
    dashboard: "/teacher",
    features: ["إدارة الفصول ورموز الانضمام", "إعداد الدروس والأنشطة", "متابعة الطلاب وغرفة تدريب المعلم"],
    steps: [
      "أنشئ حساب معلم، ثم افتح «لوحة المعلم».",
      "أنشئ فصلًا وشارك رمز الانضمام مع طلابك بالطريقة المخصصة.",
      "اختر المحتوى المناسب، وتابع الطلاب، واستفد من أدوات المعلم المتاحة.",
    ],
  },
  {
    role: "parent",
    title: "ولي الأمر",
    icon: "👨‍👩‍👧‍👦",
    tagline: "أرافق أبنائي وأعرف أين تقدموا وما الذي يحتاجونه.",
    action: "ابدأ كولي أمر",
    dashboard: "/parent",
    features: ["ربط الأبناء بطريقة آمنة", "متابعة الدروس والإتقان", "مساندة الأبناء دون الحل نيابة عنهم"],
    steps: [
      "أنشئ حساب ولي أمر، ثم افتح «أبنائي».",
      "اربط حساب كل ابن عبر أداة الربط المعتمدة داخل اللوحة.",
      "تابع الإنجاز ومواطن القوة والاحتياج، وادعم خطة المراجعة.",
    ],
  },
  {
    role: "school",
    title: "المدرسة",
    icon: "🏫",
    tagline: "أُدير المتابعة التعليمية ضمن حساب مؤسسي واضح.",
    action: "ابدأ كمدرسة",
    dashboard: "/school",
    features: ["إدارة المعلمين والفصول", "تقارير ومؤشرات تعلّم", "متابعة التحسين والجوائز"],
    steps: [
      "سجّل بصفة مدرسة، ثم افتح «لوحة المدرسة».",
      "استخدم أدوات الربط وإدارة المعلمين والفصول المتاحة في حساب المدرسة.",
      "راجع تقارير الطلاب والفصول ومؤشرات الأداء لاتخاذ قرارات التطوير.",
    ],
  },
];

export default function PortalPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#fbf7ed] text-[#273e38]">
      <header className="border-b border-[#dfd2b7] bg-[#fffef9]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <DadyoomLogo />
          <nav aria-label="روابط البوابة" className="flex flex-wrap items-center gap-2 text-sm font-black">
            <Link href="/" className="rounded-xl px-3 py-2 hover:bg-[#edf4ed]">الرئيسية</Link>
            <Link href="/how-to-use" className="rounded-xl px-3 py-2 hover:bg-[#edf4ed]">الدليل التفاعلي</Link>
            <Link href="/login" className="rounded-xl border border-[#d6c59f] bg-white px-4 py-2 text-[#174f47] hover:bg-[#fff8ea]">لديّ حساب</Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[#123f39] px-4 py-12 text-white sm:px-6 sm:py-16">
        <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full border-[45px] border-white/5" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl">
          <div className="inline-flex rounded-full border border-[#d9c58d]/40 bg-white/10 px-4 py-2 text-xs font-black text-[#f6d88a]">
            ضاديوم — بيت اللغة العربية
          </div>
          <h1 className="mt-5 font-arabic-display text-3xl font-black leading-[1.5] sm:text-5xl">
            بوابة الوصول إلى ضاديوم
          </h1>
          <p className="mt-3 max-w-3xl font-arabic-reading text-lg leading-9 text-[#e4f0ec]">
            بيت واحد يجمع الطالب والمعلم وولي الأمر والمدرسة. اختر صفتك، وستجد طريق التسجيل،
            وأدوات حسابك، وخطوات البدء، والدليل الذي يرافقك خطوة بخطوة.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#choose-role" className="rounded-xl bg-[#f4d185] px-6 py-3 font-black text-[#263c34] hover:bg-[#ffe0a5]">
              اختر دورك
            </a>
            <Link href="/login" className="rounded-xl border border-white/35 px-6 py-3 font-black text-white hover:bg-white/10">
              دخول بحسابي الحالي
            </Link>
            <Link href="/courses" className="rounded-xl border border-white/35 px-6 py-3 font-black text-white hover:bg-white/10">
              استكشف الدروس
            </Link>
          </div>
        </div>
      </section>

      <section id="choose-role" className="mx-auto max-w-7xl scroll-mt-6 px-4 py-12 sm:px-6">
        <div className="mb-7">
          <p className="text-sm font-black text-[#996c27]">الخطوة الأولى</p>
          <h2 className="mt-2 font-arabic-display text-2xl font-black sm:text-3xl">كيف ستستخدم ضاديوم؟</h2>
          <p className="mt-2 leading-8 text-[#647469]">اختر الفئة التي تمثلك؛ التسجيل يفتح نوع الحساب المناسب، ولا يغيّر صلاحيات الحسابات الموجودة.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {audiences.map((item, index) => (
            <article key={item.role} id={item.role} className="scroll-mt-6 overflow-hidden rounded-[2rem] border border-[#dfd1b5] bg-white shadow-[0_10px_34px_rgba(18,63,57,.06)]">
              <div className="flex items-start gap-4 border-b border-[#ebe2d2] px-5 py-6 sm:px-7">
                <div aria-hidden="true" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#e7f2e9] text-4xl">{item.icon}</div>
                <div className="min-w-0">
                  <span className="text-xs font-black text-[#a07732]">المسار {index + 1}</span>
                  <h3 className="font-arabic-display text-2xl font-black text-[#174f47]">{item.title}</h3>
                  <p className="mt-1 font-arabic-reading leading-7 text-[#5f7167]">{item.tagline}</p>
                </div>
              </div>
              <div className="px-5 py-6 sm:px-7">
                <h4 className="font-black text-[#2d4e43]">ما الذي ستجده داخل حسابك؟</h4>
                <ul className="mt-3 space-y-2">
                  {item.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm leading-7 text-[#57695f]">
                      <span aria-hidden="true" className="mt-0.5 font-black text-[#b18438]">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <details className="group mt-5 rounded-2xl border border-[#e5dbc8] bg-[#fbf8f1] p-4">
                  <summary className="cursor-pointer font-black text-[#174f47]">طريقة استخدام {item.title} — 3 خطوات</summary>
                  <ol className="mt-4 space-y-3">
                    {item.steps.map((step, stepIndex) => (
                      <li key={step} className="flex items-start gap-3 text-sm leading-7 text-[#52665c]">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#174f47] font-black text-white">{stepIndex + 1}</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </details>
                <div className="mt-6 grid gap-2 sm:grid-cols-2">
                  <Link href={"/signup?role=" + item.role} className="flex min-h-12 items-center justify-center rounded-xl bg-[#174f47] px-4 py-3 text-center font-black text-white transition hover:bg-[#103f39]">
                    {item.action}
                  </Link>
                  <Link href={"/how-to-use#" + item.role} className="flex min-h-12 items-center justify-center rounded-xl border border-[#cfb37e] bg-[#fff7e5] px-4 py-3 text-center font-black text-[#755523] hover:bg-[#fbeccc]">
                    شاهد دليل {item.title}
                  </Link>
                </div>
                <Link href={item.dashboard} className="mt-4 inline-block text-sm font-bold text-[#456e60] underline underline-offset-4">
                  لديّ هذا الحساب بالفعل — افتح لوحتي
                </Link>
              </div>
            </article>
          ))}
        </div>
        <aside className="mt-6 rounded-3xl border border-[#d9c6a1] bg-[#fff6e0] px-5 py-6 sm:px-8">
          <h3 className="text-lg font-black text-[#725323]">هل المتعلم طفل صغير؟</h3>
          <p className="mt-2 leading-8 text-[#715f41]">
            توجد أيضًا مساحة للطفل. يُفضّل أن يُكمل ولي الأمر خطوات الحساب ويرافق الطفل
            أثناء التعلم، وألا يشارك الطفل بياناته الشخصية مع الآخرين.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm font-black">
            <Link href="/signup?role=child" className="rounded-xl bg-[#725323] px-5 py-3 text-white hover:bg-[#5b431f]">حساب طفل</Link>
            <Link href="/how-to-use#child" className="rounded-xl border border-[#cfb37e] px-5 py-3 text-[#725323]">دليل الطفل</Link>
          </div>
        </aside>
      </section>

      <section className="border-t border-[#e5d9c3] bg-[#f2ebdd] px-4 py-11 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-arabic-display text-2xl font-black">ثلاث خطوات مشتركة للجميع</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ["١", "اختر صفتك", "طالب أو معلم أو ولي أمر أو مدرسة."],
              ["٢", "أنشئ حسابًا أو سجّل دخولك", "استخدم البريد أو خيار Google المتاح، وأكمل ملفك عند الحاجة."],
              ["٣", "افتح لوحة حسابك", "ستنتقل بعد الدخول إلى مساحة دورك، ومنها تصل إلى الأدوات والدروس والمتابعة."],
            ].map(([number, title, description]) => (
              <div key={number} className="rounded-2xl bg-white p-6 shadow-sm">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#174f47] text-xl font-black text-white">{number}</span>
                <h3 className="mt-4 font-black text-[#174f47]">{title}</h3>
                <p className="mt-2 leading-8 text-[#66756a]">{description}</p>
              </div>
            ))}
          </div>
          <p className="mt-7 text-sm leading-7 text-[#6c6b5e]">
            تتوسع مناهج ضاديوم ودروسه تدريجيًا؛ ظهور دولة أو صف في الدليل لا يعني اكتمال كل الدروس.
            بعض الأدوات والبيانات لا تظهر إلا بعد إنشاء فصل أو ربط الحسابات أو نشر محتواها.
          </p>
        </div>
      </section>
    </main>
  );
}
