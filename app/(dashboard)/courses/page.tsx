import CurriculumCatalogClient from "./CurriculumCatalogClient";
import { getStudentCurriculumCatalog } from "@/services/lessons/student-curriculum-catalog";
import { createClient } from "@/lib/supabase/server";

type CatalogParams = { country?: string | string[]; grade?: string | string[] };

export default async function CoursesPage({ searchParams }: { searchParams?: Promise<CatalogParams> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let defaultCountryCode = "BH";
  let defaultGradeNumber: number | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("country,grade_number")
      .eq("id", user.id)
      .maybeSingle();

    const country = String(profile?.country ?? "").trim().toUpperCase();
    if (country) defaultCountryCode = country === "BAHRAIN" || country === "البحرين" ? "BH" : country;
    if (typeof profile?.grade_number === "number" && profile.grade_number >= 1 && profile.grade_number <= 12) {
      defaultGradeNumber = profile.grade_number;
    }
  }

  // The public country pages link to /courses?country=PS&grade=3.
  // Route filters must win over the signed-in profile and default Bahrain.
  const params = (await searchParams) ?? {};
  const allowedCountries = new Set([
    "AE","BH","DJ","DZ","EG","IQ","JO","KM","KW","LB","LY",
    "MA","MR","OM","PS","QA","SA","SD","SO","SY","TN","YE",
  ]);
  const requestedCountry = String(Array.isArray(params.country) ? params.country[0] : params.country ?? "").trim().toUpperCase();
  const requestedGrade = String(Array.isArray(params.grade) ? params.grade[0] : params.grade ?? "").trim();

  if (allowedCountries.has(requestedCountry)) {
    defaultCountryCode = requestedCountry;
    defaultGradeNumber = null;
  }
  if (/^(?:[1-9]|1[0-2])$/.test(requestedGrade)) {
    defaultGradeNumber = Number(requestedGrade);
  }

  return (
    <CurriculumCatalogClient
      units={await getStudentCurriculumCatalog()}
      defaultCountryCode={defaultCountryCode}
      defaultGradeNumber={defaultGradeNumber}
    />
  );
}
