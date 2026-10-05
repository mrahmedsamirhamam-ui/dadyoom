import type { Metadata } from "next";

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

  return <CurriculumCatalogClient countries={countries} />;
}
