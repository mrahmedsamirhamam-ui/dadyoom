import type { Metadata } from "next";

import PricingClient from "@/components/billing/PricingClient";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "ضاديوم | التعلم المجاني وخطط المنصة",
  description:
    "تعلّم العربية مجانًا على ضاديوم، مع الدروس والملخصات والطباعة. الاشتراكات المدفوعة الجديدة غير متاحة حاليًا.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return <PricingClient />;
}
