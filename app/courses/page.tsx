import type { Metadata } from "next";
import Link from "next/link";

import CurriculumCatalogClient from "./CurriculumCatalogClient";
import { maxGradeForCountry } from "@/lib/student/country-grade-limits";
import { createClient } from "@/lib/supabase/server";
import { LocalizedText } from "@/components/i18n/LanguageProvider";
import {
  ARAB_COUNTRY_CODES,
  getArabicCountryOptions,
} from "@/lib/countries";

// Preselect country and grade from the direct lesson-directory links.
// The curriculum itself still loads lazily for the requested grade.
export const dynamic = "force-dynamic";

type CourseSearchParams = {
  country?: string | string[];
  grade?: string | string[];
  level?: string | string[];
};

type CoursesPageProps = {
  searchParams: Promise<CourseSearchParams>;
};

export const metadata: Metadata = {
  title: "مناهج اللغة العربية | ضاديوم",
  description:
    "استكشف مسار ضاديوم العربي الأساسي للدول العربية الـ22 من الصف الأول إلى الصف الثاني عشر، مع الدروس والمهارات والتقدم.",
  alternates: { canonical: "/courses" },
};

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const arabCodes = new Set<string>(ARAB_COUNTRY_CODES);

  const countries = getArabicCountryOptions()
    .filter((item) => arabCodes.has(item.code))
    .map((item) => ({
      code: item.code,
      name: item.name,
      maxGrade: maxGradeForCountry(item.code),
    }));

  const query = await searchParams;
  const rawCountry = Array.isArray(query.country) ? query.country[0] : query.country;
  const rawGrade = Array.isArray(query.grade) ? query.grade[0] : query.grade;
  const rawLevel = Array.isArray(query.level) ? query.level[0] : query.level;

  // A student opening /courses without URL parameters should see their
  // registered country's actual grade, not a misleading first-grade default.
  // Explicit country/grade links always take precedence.
  let profileCountryCode = "BH";
  let profileGradeNumber = 1;
  if (!rawCountry || !rawGrade) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("country,grade_number")
        .eq("id", user.id)
        .maybeSingle();

      const storedCountry = String(profile?.country ?? "").trim().toUpperCase();
      const canonicalCountry =
        storedCountry === "BAHRAIN" || storedCountry === "البحرين"
          ? "BH"
          : storedCountry;
      if (arabCodes.has(canonicalCountry)) {
        profileCountryCode = canonicalCountry;
      }

      const storedGrade = Number(profile?.grade_number);
      if (Number.isInteger(storedGrade) && storedGrade >= 1 && storedGrade <= 12) {
        profileGradeNumber = storedGrade;
      }
    }
  }

  const country = countries.find(
    (item) => item.code === (rawCountry ?? profileCountryCode).trim().toUpperCase(),
  ) ?? countries.find((item) => item.code === "BH") ?? countries[0];
  const requestedGrade = rawGrade ? Number(rawGrade) : profileGradeNumber;
  const grade = Number.isInteger(requestedGrade) &&
    requestedGrade >= 1 && requestedGrade <= (country?.maxGrade ?? 12)
    ? requestedGrade : 1;

  return (
    <>
      <section dir="rtl" className="border-b border-[#e2d6bf] bg-[#fffaf0] px-4 py-4">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold text-[#625b51]">
            <LocalizedText ar="تريد روابط مباشرة قابلة للتصفح لكل دولة؟" en="Want direct links to each country’s Arabic curricula?" />
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/courses/rooms"
              className="inline-flex min-h-11 items-center rounded-xl bg-[#123f39] px-5 py-2 text-sm font-black text-white hover:bg-[#1b5c53]"
            >
              <LocalizedText ar="خصّص غرفة التعلم" en="Personalize a learning room" />
            </Link>
            <Link href={"/study/" + (country?.code ?? "BH").toLowerCase() + "/" + grade} className="inline-flex min-h-11 items-center rounded-xl border border-[#afc5ab] bg-[#e8f5eb] px-4 py-2 text-sm font-black text-[#123f39]"><LocalizedText ar="ذاكر الآن: مثال وتطبيق وإجابة" en="Practice now: examples and answers" /></Link>
            <Link
              href="/curriculum"
              className="inline-flex min-h-11 items-center rounded-xl border border-[#cdbb96] bg-white px-4 py-2 text-sm font-black text-[#174f47] hover:underline"
            >
              <LocalizedText ar="افتح دليل المناهج والدروس" en="Open the country directory" />
            </Link>
          </div>
        </div>
      </section>
      <CurriculumCatalogClient countries={countries} initialCountryCode={country?.code ?? "BH"} initialGradeNumber={grade} initialContinuingLevel={country?.code === "BH" ? rawLevel?.slice(0, 60) : undefined} />
    </>
  );
}
