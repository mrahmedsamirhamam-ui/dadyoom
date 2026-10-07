import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "مناهج البحرين في ضاديوم | اللغة العربية 2026-2027",
  description:
    "بوابة ضاديوم لمناهج اللغة العربية في مملكة البحرين للعام الدراسي 2026-2027، مع دروس وأنشطة وتقويم وتقدم تعليمي.",
  alternates: {
    canonical: "/curriculum/bh",
  },
  openGraph: {
    type: "website",
    locale: "ar_BH",
    url: "/curriculum/bh",
    title: "ضاديوم البحرين | مناهج اللغة العربية",
    description:
      "استكشف مناهج اللغة العربية في البحرين والدروس والأنشطة المرتبطة بها داخل ضاديوم.",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function BahrainLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
