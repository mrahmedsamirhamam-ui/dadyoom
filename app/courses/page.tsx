import type { Metadata } from "next";
import Link from "next/link";

import CurriculumCatalogClient from "./CurriculumCatalogClient";
import {
  ARAB_COUNTRY_CODES,
  getArabicCountryOptions,
} from "@/lib/countries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "مناهج اللغة العربية | ضاديوم",
  description:
    "استكشف مسار ضاديوم العربي الأساسي للدول العربية الـ22 من الصف الأول إلى الصف الثاني عشر، مع الدروس والمهارات والتقدم.",
  alternates: { canonical: "/courses" },
};

export default function CoursesPage() {
  const arabCodes = new Set<string>(ARAB_COUNTRY_CODES);

  const countries = getArabicCountryOptions()
    .filter((item) => arabCodes.has(item.code))
    .map((item) => ({
      code: item.code,
      name: item.name,
      maxGrade:
        item.code === "TN" || item.code === "MR"
          ? 13
          : 12,
    }));

  return (
    <>
      <section dir="rtl" className="border-b border-[#e2d6bf] bg-[#fffaf0] px-4 py-4">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold text-[#625b51]">
            تريد روابط مباشرة قابلة للتصفح لكل دولة؟
          </p>
          <Link
            href="/curriculum"
            className="rounded-xl border border-[#cdbb96] bg-white px-4 py-2 text-sm font-black text-[#174f47] hover:underline"
          >
            افتح دليل المناهج والدروس
          </Link>
        </div>
      </section>
      <CurriculumCatalogClient countries={countries} />
    </>
  );
}
