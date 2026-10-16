import type { Metadata } from "next";
import LessonSearchClient from "@/components/search/LessonSearchClient";
import { ARAB_COUNTRY_CODES, getArabicCountryOptions } from "@/lib/countries";
import { maxGradeForCountry } from "@/lib/student/country-grade-limits";

export const metadata: Metadata = {
  title: "ابحث عن دروس اللغة العربية",
  description: "ابحث في دروس ضاديوم المنشورة حسب اسم الدرس أو الدولة أو الصف الدراسي.",
  alternates: { canonical: "/search" },
  robots: { index: false, follow: true },
};
export const dynamic = "force-dynamic";

type Params = {
  q?: string | string[];
  country?: string | string[];
  grade?: string | string[];
};

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] ?? "" : value ?? "";

export default async function LessonSearchPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const query = await searchParams;
  const codes = new Set<string>(ARAB_COUNTRY_CODES);
  const countries = getArabicCountryOptions()
    .filter(item => codes.has(item.code))
    .map(item => ({
      code: item.code,
      name: item.name,
      maxGrade: maxGradeForCountry(item.code),
    }));
  const requestedCountry = first(query.country).toUpperCase();
  const country = countries.some(item => item.code === requestedCountry)
    ? requestedCountry : "";
  const gradeText = first(query.grade);
  const grade = Number(gradeText);
  const maxGrade = country ? maxGradeForCountry(country) : 13;
  const selectedGrade = gradeText && Number.isInteger(grade) && grade >= 1 &&
    grade <= maxGrade ? String(grade) : "";

  return (
    <LessonSearchClient
      countries={countries}
      initialQuery={first(query.q).slice(0, 80)}
      initialCountry={country}
      initialGrade={selectedGrade}
    />
  );
}
