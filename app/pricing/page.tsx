// DADYOOM_PLUS_UI_PRICE_10_USD
import type { Metadata } from "next";

import CheckoutButtons from "@/components/billing/CheckoutButtons";
import { billingStatus } from "@/lib/billing/access";

export const metadata: Metadata = {
  title: "ضاديوم Plus | اشتراك التعلم العربي الذكي",
  description:
    "ضاديوم العادي يمنح الدرس والملخص والشرائح والطباعة والتنزيل، وPlus يزيل الإعلانات ويفتح إنشاءات AI الموسعة.",
};

export default async function PricingPage() {
  const status = await billingStatus();

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

        <section className="grid gap-5 lg:grid-cols-2">
          <PlanCard
            title="ضاديوم العادي"
            subtitle="ابدأ مجانًا"
            current={status.plan === "free"}
            features={[
              "الدرس الكامل + ملخص الدرس + الشرائح الأساسية بلا حد يومي",
              "طباعة وتنزيل ملخص وشرائح الدرس بلا حد يومي",
              "حتى 5 محاولات فيديو AI يوميًا عندما تكون الميزة التجريبية متاحة",
              "5 عروض PowerPoint مخصصة بالـAI يوميًا",
              "5 ملخصات مخصصة بالـAI يوميًا",
              "Notebook وأسئلة الدراسة بحد يومي مناسب",
              "3 أنماط ألعاب أساسية",
              "إعلانات خفيفة خارج الدرس ومساحات التعلم الحساسة",
            ]}
          />

          <PlanCard
            title="ضاديوم Plus"
            subtitle="10.00 USD / شهريًا — الدفع قريبًا"
            current={status.plan === "plus"}
            accent
            features={[
              "بدون إعلانات نهائيًا",
              "وصول موسع إلى فيديو AI أثناء توفر المحرك التجريبي، دون وعد بتوفر مزود خارجي دائمًا",
              "PowerPoint وملخصات مخصصة بالـAI بلا حد يومي",
              "Notebook وأدوات الدراسة بلا حد يومي داخل ضاديوم",
              "كل الألعاب والتحديات",
              "أولوية في توجيه AI للنماذج الأقوى عند توفرها",
              "كل مزايا الدرس الأساسية والطباعة والتنزيل",
            ]}
          >
            {status.plan !== "plus" ? (
              <CheckoutButtons kind="plus" />
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
