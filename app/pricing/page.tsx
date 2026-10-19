// DADYOOM_PLUS_UI_PRICE_10_USD
import type { Metadata } from "next";
import Link from "next/link";

import CheckoutButtons from "@/components/billing/CheckoutButtons";
import { billingStatus } from "@/lib/billing/access";

export const metadata: Metadata = {
  title: "ضاديوم Plus | اشتراك التعلم العربي الذكي",
  description:
    "ضاديوم العادي يمنح الدرس والملخص والشرائح والطباعة والتنزيل، وPlus يزيل الإعلانات ويفتح إنشاءات AI الموسعة.",
};

export default async function PricingPage() {
  const status = await billingStatus();
  // Never expose checkout during the zero-cost introductory phase unless explicitly enabled.
  const liveBillingEnabled = process.env.DADYOOM_LIVE_BILLING_ENABLED === "true";

  return (
    <main
      dir="rtl"
      className="dadyoom-arabic-surface min-h-screen px-4 py-10"
    >
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[2.4rem] border border-[#c8a65d] bg-[#123f39] p-7 text-white shadow-xl">
          <div className="text-sm font-black text-[#f4d58a]">
            ضاديوم Plus
          </div>
          <h1 className="mt-2 text-4xl font-black">
            الدرس كامل للجميع، وPlus يفتح صناعة أكثر
          </h1>
          <p className="mt-3 max-w-3xl leading-8 text-[#e8f1ed]">
            ملخص الدرس وشرائحه الأصلية وعرضهما وطباعتهما وتنزيلهما ليست ضمن الحدود اليومية. الحدود تخص فقط ما يطلب المستخدم من الذكاء الاصطناعي أن يصنعه من جديد.
          </p>
        </section>

        <section className="rounded-[2rem] border border-[#9cddc0] bg-[#effaf5] p-6 text-[#123f39]">
          <p className="text-sm font-black text-[#126f54]">مرحبًا بكم في ضاديوم</p>
          <h2 className="mt-2 text-2xl font-black">ابدأ التعلم مجانًا — بلا بطاقة دفع أو اشتراك إلزامي</h2>
          <p className="mt-3 max-w-3xl leading-8">
            التسجيل الأساسي مجاني، ويتيح الدروس المنشورة والملخصات والشرائح الأساسية والتدريبات
            دون رسوم اشتراك. بعض أدوات توليد المحتوى بالذكاء الاصطناعي لها حدود استخدام يومية.
            المحتوى قيد الاستكمال والمراجعة؛ تحقق من صفك وفصلك قبل الاعتماد عليه بديلًا عن الكتاب المدرسي.
            لا تتحول الخطة المجانية تلقائيًا إلى اشتراك مدفوع.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={status.authenticated ? "/courses" : "/signup"} className="rounded-xl bg-[#123f39] px-6 py-3 font-black text-white">
              {status.authenticated ? "افتح مناهجك" : "أنشئ حسابًا مجانيًا"}
            </Link>
            <Link href="/courses" className="rounded-xl border border-[#7bbda2] bg-white px-6 py-3 font-black text-[#123f39]">
              استكشف المناهج المنشورة
            </Link>
          </div>
          <p className="mt-4 text-sm leading-7">
            للطلاب وأولياء الأمور والمعلمين والمدارس: ابدأوا بحساب مجاني. عقود المدارس والخدمات المؤسسية
            تُناقش على حدة، ولا تُنشأ أي مدفوعات تلقائيًا من صفحة التعريف.
          </p>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <PlanCard
            title="ضاديوم العادي"
            subtitle="ابدأ مجانًا"
            current={status.plan === "free"}
            features={[
              "الدرس الكامل + ملخص الدرس + الشرائح الأساسية بلا حد يومي",
              "طباعة وتنزيل ملخص وشرائح الدرس بلا حد يومي",
              "5 فيديوهات AI جديدة يوميًا",
              "5 عروض PowerPoint مخصصة بالـAI يوميًا",
              "5 ملخصات مخصصة بالـAI يوميًا",
              "Notebook وأسئلة الدراسة بحد يومي مناسب",
              "3 أنماط ألعاب أساسية",
              "إعلانات خفيفة خارج الدرس ومساحات التعلم الحساسة",
            ]}
          />

          <PlanCard
            title="ضاديوم Plus"
            subtitle={liveBillingEnabled ? "10.00 USD / شهريًا" : "اشتراك اختياري — الشراء غير مفعّل حاليًا"}
            current={status.plan === "plus"}
            accent
            features={[
              "بدون إعلانات نهائيًا",
              "صناعة فيديوهات AI بلا حد يومي داخل ضاديوم",
              "PowerPoint وملخصات مخصصة بالـAI بلا حد يومي",
              "Notebook وأدوات الدراسة بلا حد يومي داخل ضاديوم",
              "كل الألعاب والتحديات",
              "أولوية في توجيه AI للنماذج الأقوى عند توفرها",
              "كل مزايا الدرس الأساسية والطباعة والتنزيل",
            ]}
          >
            {status.plan !== "plus" ? (
              liveBillingEnabled ? (
                <CheckoutButtons kind="plus" />
              ) : (
                <div className="rounded-2xl border border-[#d9b777] bg-white p-4 text-sm font-bold leading-7 text-[#123f39]">
                  الشراء والدفع غير مفعّلين خلال مرحلة التعريف. يمكنك متابعة الدراسة مجانًا،
                  ولن يُخصم منك مبلغ أو يبدأ تجديد تلقائي.
                </div>
              )
            ) : (
              <div className="rounded-2xl bg-[#eaf6f0] p-4 font-black text-[#123f39]">
                حسابك Plus الآن.
              </div>
            )}
          </PlanCard>
        </section>
      </div>
    </main>
  );
}

function PlanCard({
  title,
  subtitle,
  current,
  accent = false,
  features,
  children,
}: {
  title: string;
  subtitle: string;
  current: boolean;
  accent?: boolean;
  features: string[];
  children?: React.ReactNode;
}) {
  return (
    <article
      className={`rounded-[2rem] border p-6 shadow-sm ${
        accent
          ? "border-[#c49b43] bg-[#fff8e6]"
          : "border-[#ded2b8] bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-[#123f39]">
            {title}
          </h2>
          <p className="mt-1 font-bold text-[#8d6e32]">
            {subtitle}
          </p>
        </div>

        {current ? (
          <span className="rounded-full bg-[#123f39] px-3 py-2 text-xs font-black text-white">
            خطتك الحالية
          </span>
        ) : null}
      </div>

      <ul className="mt-5 space-y-3 leading-7">
        {features.map((feature) => (
          <li
            key={feature}
            className="rounded-xl bg-white/70 px-3 py-2"
          >
            {feature}
          </li>
        ))}
      </ul>

      {children ? <div className="mt-6">{children}</div> : null}
    </article>
  );
}
