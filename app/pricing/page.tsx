import type { Metadata } from "next";

import PricingClient from "@/components/billing/PricingClient";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "ضاديوم Plus | اشتراك التعلم العربي الذكي",
  description:
    "ضاديوم العادي يمنح الدرس والملخص والشرائح والطباعة والتنزيل، وPlus يزيل الإعلانات ويفتح إنشاءات AI الموسعة.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return <PricingClient />;
}
