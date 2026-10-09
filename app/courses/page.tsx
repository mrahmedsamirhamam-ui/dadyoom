import type { Metadata } from "next";
import Link from "next/link";

import CurriculumCatalogClient from "./CurriculumCatalogClient";
import { maxGradeForCountry } from "@/lib/student/country-grade-limits";
import { LocalizedText } from "@/components/i18n/LanguageProvider";
import {
  ARAB_COUNTRY_CODES,
  getArabicCountryOptions,
} from "@/lib/countries";

export const dynamic = "force-static";
export const revalidate = 86400;

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
      maxGrade: maxGradeForCountry(item.code),
    }));

  return (
    <>
      <section dir="rtl" className="border-b border-[#e2d6bf] bg-[#fffaf0] px-4 py-4">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold text-[#625b51]">
            <LocalizedText ar="تريد روابط مباشرة قابلة للتصفح لكل دولة؟" en="Want direct links to each country’s Arabic curricula?" />
          </p>
          <Link
            href="/curriculum"
            className="rounded-xl border border-[#cdbb96] bg-white px-4 py-2 text-sm font-black text-[#174f47] hover:underline"
          >
            <LocalizedText ar="افتح دليل المناهج والدروس" en="Open the country directory" />
          </Link>
        </div>
      </section>
      <CurriculumCatalogClient countries={countries} />
    </>
  );
}
