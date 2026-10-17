"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import PaddleManageSubscription from "@/components/billing/PaddleManageSubscription";
import { isUsablePricingStatus } from "@/lib/billing/pricing-client-state";

type BillingStatus = {
  authenticated: boolean;
  degraded?: boolean;
  role: string | null;
  dashboardHref: string;
  dashboardLabel: string;
  plan: "free" | "plus";
  plus: boolean;
  showAds: boolean;
  limits: Record<string, number>;
  price: number;
  currency: string;
  plusPrice: number;
  plusCurrency: string;
};

const FALLBACK: BillingStatus = {
  authenticated: false,
  // An unverified identity is not evidence that the Free plan is active.
  degraded: true,
  role: null,
  dashboardHref: "/student",
  dashboardLabel: "لوحة الطالب",
  plan: "free",
  plus: false,
  showAds: false,
  limits: {},
  price: 0,
  currency: "BHD",
  plusPrice: 10,
  plusCurrency: "USD",
};

export default function PricingClient() {
  const router = useRouter();
  const [status, setStatus] = useState<BillingStatus>(FALLBACK);
  const [statusLoadFailed, setStatusLoadFailed] = useState(false);
  const [statusRequestId, setStatusRequestId] = useState(0);
  const [statusResolved, setStatusResolved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const transientStatuses = new Set([429, 502, 503, 504]);
    const wait = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, ms));

    // Some edge requests can briefly return 503 during deployment.
    // Retry only transient HTTP/network errors and never infer an
    // authenticated role or enable payment from a fallback.
    const loadBillingStatus = async () => {
      const maxAttempts = 5;
      for (let attempt = 1; attempt <= maxAttempts && !cancelled; attempt += 1) {
        try {
          const response = await fetch("/api/billing/status", {
            cache: "no-store",
            credentials: "include",
          });
          if (!response.ok) {
            if (transientStatuses.has(response.status) && attempt < maxAttempts) {
              await wait(attempt * 700);
              continue;
            }
            throw new Error(`BILLING_HTTP_${response.status}`);
          }
          const payload = (await response.json()) as BillingStatus;
          if (!isUsablePricingStatus(payload)) {
            // Retry degraded anonymous/invalid status, not verified
            // authenticated navigation during a plan-only outage.
            if (attempt < maxAttempts) {
              await wait(attempt * 700);
              continue;
            }
            throw new Error("BILLING_STATUS_UNAVAILABLE");
          }
          if (!cancelled) {
            // When only plan details failed, keep the server-verified dashboard
            // link while clearly showing subscription information is degraded.
            setStatus(payload);
            setStatusLoadFailed(false);
            setStatusResolved(true);
          }
          return;
        } catch (error) {
          // Network errors may also be transient. Permanent HTTP failures
          // do not retry, and no retry can grant a role or start checkout.
          if (error instanceof TypeError && attempt < maxAttempts) {
            await wait(attempt * 700);
            continue;
          }
          if (!cancelled) {
            setStatus(FALLBACK);
            setStatusLoadFailed(true);
            setStatusResolved(true);
          }
          return;
        }
      }
    };

    void loadBillingStatus();
    return () => {
      cancelled = true;
    };
  }, [statusRequestId]);

  return (
    <main
      dir="rtl"
      className="dadyoom-arabic-surface min-h-screen px-4 py-10"
    >
      <div className="mx-auto max-w-6xl space-y-8">
        <nav
          aria-label="العودة من صفحة الاشتراك"
          className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#dfcfaf] bg-white/90 p-3 shadow-sm backdrop-blur"
        >
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full border border-[#d7c59f] bg-[#fffaf0] px-4 py-2.5 text-sm font-black text-[#6b5d45] transition hover:border-[#b88a34] hover:text-[#123f39]"
          >
            ← العودة
          </button>

          {!statusResolved ? (
            <span role="status" className="px-4 py-2 text-sm font-bold text-[#6b5d45]">
              جارٍ التحقق من حسابك…
            </span>
          ) : status.authenticated ? (
            <Link
              href={status.dashboardHref}
              prefetch={false}
              className="rounded-full bg-[#123f39] px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#0c332e]"
            >
              {status.dashboardLabel}
            </Link>
          ) : (
            <Link
              href="/"
              prefetch={false}
              className="rounded-full bg-[#123f39] px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#0c332e]"
            >
              الصفحة الرئيسية
            </Link>
          )}

          {statusLoadFailed && (
            <button
              type="button"
              onClick={() => {
                setStatusLoadFailed(false);
                setStatusResolved(false);
                setStatusRequestId((previous) => previous + 1);
              }}
              className="rounded-full border border-amber-600 bg-amber-50 px-4 py-2.5 text-sm font-black text-amber-900"
            >
              تعذّر التحقق من حسابك — حاول مجددًا
            </button>
          )}

          <Link href="/payments/dadyoom" prefetch={false} className="rounded-full border border-[#a9bea9] bg-[#e7f4ec] px-4 py-2.5 text-sm font-black text-[#123f39]">ضاديوم حسابات — سجل الطلبات</Link>
          <Link
            href="/courses/video-library"
            prefetch={false}
            className="rounded-full border border-[#c8a65d] bg-[#fff8e6] px-4 py-2.5 text-sm font-black text-[#71551e] transition hover:bg-[#f7e8bc]"
          >
            مكتبة الفيديوهات
          </Link>
        </nav>

        {status.degraded && status.authenticated && (
          <p role="status" className="rounded-2xl border border-amber-400 bg-amber-50 p-4 text-sm font-bold text-amber-900">
            تعذّر التأكد من تفاصيل اشتراكك مؤقتًا. يمكنك الوصول إلى لوحتك دون إجراء أي دفع.
          </p>
        )}

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
            current={statusResolved && !status.degraded && status.plan === "free"}
            features={[
              "الدرس الكامل + ملخص الدرس + الشرائح الأساسية بلا حد يومي",
              "طباعة وتنزيل ملخص وشرائح الدرس بلا حد يومي",
              "فيديو AI — قريبًا، وغير مفعّل حاليًا",
              "5 عروض PowerPoint مخصصة بالـAI يوميًا",
              "5 ملخصات مخصصة بالـAI يوميًا",
              "Notebook وأسئلة الدراسة بحد يومي مناسب",
              "خمس ألعاب حركية مجانية عندما يتوفر بنك أسئلة مناسب للدرس",
              "إعلانات خفيفة خارج الدرس ومساحات التعلم الحساسة",
              "بعد إنشاء الحساب: تجربة ترحيبية Plus لمدة 24 ساعة",
            ]}
          />

          <PlanCard
            title="ضاديوم Plus"
            subtitle="الاشتراكات الجديدة متوقفة حاليًا"
            current={statusResolved && !status.degraded && status.plan === "plus"}
            accent
            features={[
              "بدون إعلانات نهائيًا",
              "فيديو AI — قريبًا، وغير مفعّل حاليًا",
              "PowerPoint وملخصات مخصصة بالـAI بلا حد يومي",
              "Notebook وأدوات الدراسة بلا حد يومي داخل ضاديوم",
              "كل الألعاب والتحديات",
              "أولوية في توجيه AI للنماذج الأقوى عند توفرها",
              "كل مزايا الدرس الأساسية والطباعة والتنزيل",
            ]}
          >
            {status.plan === "plus" ? (
              <PaddleManageSubscription />
            ) : (
              <p className="text-sm font-bold text-[#123f39]">
                لا يوجد شراء أو اشتراك مدفوع حاليًا. يمكنك التعلم مجانًا في ضاديوم.
              </p>
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
