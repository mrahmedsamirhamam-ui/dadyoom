import type { Metadata } from "next";
import Link from "next/link";
import StudyPracticeCatalog from "./StudyPracticeCatalog";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { ARAB_COUNTRY_CODES, getArabicCountryOptions } from "@/lib/countries";
import { maxGradeForCountry } from "@/lib/student/country-grade-limits";
import { SUPABASE_PUBLIC_KEY, SUPABASE_PUBLIC_URL } from "@/lib/supabase/public-config";

export const dynamic = "force-dynamic";
export const revalidate = 0;
type Props = { params: Promise<{ country: string; grade: string }> };
type Rel<T> = T | T[] | null;
type Country = { code: string; is_active: boolean };
type Curriculum = { is_active: boolean; countries: Rel<Country> };
type Grade = { grade_number: number; is_active: boolean; curricula: Rel<Curriculum> };
type Unit = { grades: Rel<Grade> };
type Skill = { id: string; title: string; content: string | null; units: Rel<Unit> };

function one<T>(value: Rel<T> | undefined): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}
function source(rawCountry: string, rawGrade: string) {
  const country = rawCountry.toUpperCase(), grade = Number(rawGrade);
  if (!(ARAB_COUNTRY_CODES as readonly string[]).includes(country) ||
    !Number.isInteger(grade) || grade < 1 || grade > maxGradeForCountry(country)) return null;
  const info = getArabicCountryOptions().find(x => x.code === country);
  return info ? { country, grade, name: info.name } : null;
}
function part(body: string | null, from: string, to: string) {
  const content = body ?? "", begin = content.indexOf(from);
  if (begin < 0) return "";
  const start = begin + from.length, end = content.indexOf(to, start);
  return content.slice(start, end < 0 ? undefined : end).trim();
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const raw = await params, info = source(raw.country, raw.grade);
  return {
    title: info ? "ذاكر العربية — الصف " + info.grade + " — " + info.name + " | ضاديوم" : "مذاكرة العربية",
    description: "شرح وتطبيق ومفتاح إجابة من ضاديوم، وليست نسخة حكومية مطابقة للكتاب.",
    robots: { index: false, follow: true },
  };
}
export default async function StudyPage({ params }: Props) {
  const raw = await params, place = source(raw.country, raw.grade);
  if (!place) notFound();
  const db = createClient(SUPABASE_PUBLIC_URL, SUPABASE_PUBLIC_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const result = await db.from("lessons")
    .select("id,title,content,units!inner(grades!inner(grade_number,is_active,curricula!inner(is_active,countries!inner(code,is_active))))")
    .eq("status", "published")
    .eq("units.grades.grade_number", place.grade)
    .eq("units.grades.curricula.countries.code", place.country)
    .eq("units.grades.is_active", true)
    .eq("units.grades.curricula.is_active", true)
    .eq("units.grades.curricula.countries.is_active", true)
    .like("content", "حزمة ضاديوم الموضوعية المتخصصة%")
    .order("title")
    .limit(40);
  const skills = ((result.data ?? []) as unknown as Skill[]).filter(skill => {
    const grade = one(one(skill.units)?.grades);
    const curr = one(grade?.curricula);
    const country = one(curr?.countries);
    return grade?.grade_number === place.grade && grade.is_active &&
      curr?.is_active && country?.is_active && country.code === place.country;
  });
  const countryPath = "/curriculum/" + place.country.toLowerCase();
  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f1e6] px-4 py-8 text-[#173f38]">
      <div className="mx-auto max-w-6xl space-y-6">
        <nav className="flex flex-wrap gap-4 text-sm font-bold">
          <Link href="/curriculum" className="underline">الدول الـ22</Link>
          <Link href={countryPath} className="underline">{place.name}</Link>
          <Link href={"/courses?country=" + place.country + "&grade=" + place.grade} className="underline">دروس المنهج</Link>
        </nav>
        <header className="rounded-3xl bg-[#123f39] p-7 text-white">
          <p className="font-bold text-[#f3d896]">ضاديوم — بيت العربية الرقمي</p>
          <h1 className="mt-3 text-3xl font-black">ذاكر العربية — الصف {place.grade} في {place.name}</h1>
          <p className="mt-4 max-w-3xl leading-8">
            18 مهارة في كل صف: مثال محلول ثم تطبيق وحل مخفي للمراجعة الذاتية.
            المواد أصلية من ضاديوم، وليست نص كتاب الوزارة أو إثباتًا لمطابقته.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {Array.from({ length: maxGradeForCountry(place.country) }, (_, i) => i + 1).map(n =>
              <Link key={n} href={"/study/" + place.country.toLowerCase() + "/" + n} prefetch={false}
                aria-current={n === place.grade ? "page" : undefined}
                className={n === place.grade ? "rounded-full bg-[#f3d896] px-3 py-2 font-black text-[#123f39]" :
                  "rounded-full border border-white/40 px-3 py-2 font-bold text-white"}>
                الصف {n}
              </Link>)}
          </div>
        </header>
        {result.error ? <p role="alert" className="rounded-xl bg-white p-5 text-red-800">
          تعذر تحميل التدريبات. لم نعتبر المحتوى مكتملًا عند انقطاع الخادم.
        </p> : <p className="rounded-xl bg-white p-4 font-black">
          المتاح الآن: {skills.length} مهارة منشورة — غير منقولة عن الكتاب الوزاري.
        </p>}
        <StudyPracticeCatalog items={skills.map(skill => ({
          id: skill.id,
          title: skill.title,
          example: part(skill.content, "أتعلم من مثال محلول:", "أفهم القاعدة أو الفكرة:"),
          explanation: part(skill.content, "أفهم القاعدة أو الفكرة:", "أطبق بنفسي:"),
          question: part(skill.content, "أطبق بنفسي:", "مفتاح المراجعة الذاتية:"),
          answer: part(skill.content, "مفتاح المراجعة الذاتية:", "خطوة "),
        }))} />

      </div>
    </main>
  );
}
