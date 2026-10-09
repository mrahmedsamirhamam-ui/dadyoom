import type { Metadata } from "next";
import Link from "next/link";
import { ARAB_COUNTRY_CODES, getArabicCountryOptions } from "@/lib/countries";
export const dynamic = "force-static";
export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Arabic School Curricula by Country | Dadyoom",
  description: "Browse Arabic-language curricula, grades and learning resources across 22 Arab countries with an English navigation guide.",
  alternates: { canonical: "/en/curriculum", languages: { en: "/en/curriculum", ar: "/curriculum" } },
};
const names: Record<string,string> = {
  BH:"Bahrain",EG:"Egypt",SA:"Saudi Arabia",AE:"United Arab Emirates",QA:"Qatar",
  KW:"Kuwait",OM:"Oman",YE:"Yemen",JO:"Jordan",PS:"Palestine",LB:"Lebanon",
  SY:"Syria",IQ:"Iraq",LY:"Libya",TN:"Tunisia",DZ:"Algeria",MA:"Morocco",
  MR:"Mauritania",SD:"Sudan",SO:"Somalia",DJ:"Djibouti",KM:"Comoros",
};
export default function EnglishCurriculumDirectory() {
  const codes = new Set<string>(ARAB_COUNTRY_CODES);
  const countries = getArabicCountryOptions().filter(c => codes.has(c.code));
  return <main lang="en" dir="ltr" className="min-h-screen bg-[#f7f1e6] px-5 py-12 text-[#202c29]">
    <div className="mx-auto max-w-6xl">
      <nav className="mb-8 flex flex-wrap justify-between gap-4 font-bold text-[#174f47]">
        <Link href="/en">← Dadyoom</Link><Link href="/en/learn-arabic">Learn Arabic</Link>
      </nav>
      <header className="rounded-[2rem] border border-[#d8c7a4] bg-white p-7 shadow-sm sm:p-10">
        <p className="font-black uppercase text-[#9a712c]">Arabic curriculum directory</p>
        <h1 className="mt-3 text-4xl font-black text-[#123f39]">Arabic curricula across 22 countries</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-[#625b51]">
          Select your country to view grades, units and published lessons. Curriculum
          and lesson names are preserved in Arabic for educational accuracy.
          A textbook reference does not necessarily mean its full lessons are available.
        </p>
      </header>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {countries.map(country => <Link key={country.code} href={`/curriculum/${country.code.toLowerCase()}`}
          className="rounded-3xl border border-[#ddcfb4] bg-white p-6 shadow-sm transition hover:border-[#a99161] hover:shadow-lg">
          <p className="text-xs font-black text-[#9a712c]">{country.code}</p>
          <h2 className="mt-2 text-2xl font-black text-[#123f39]">{names[country.code] ?? country.name}</h2>
          <p lang="ar" dir="rtl" className="mt-1 text-sm text-[#625b51]">{country.name}</p>
          <p className="mt-4 font-bold text-[#174f47]">View grades and lessons →</p>
        </Link>)}
      </div>
      <section className="mt-9 rounded-2xl border border-[#d8c7a4] bg-white p-6">
        <h2 className="text-2xl font-black text-[#123f39]">Learning Arabic as a foreign language?</h2>
        <p className="mt-3 leading-8 text-[#625b51]">You can start with Arabic skills rather than a national school curriculum. Use the English beginner guide, then practise with the interactive courses.</p>
        <div className="mt-5 flex flex-wrap gap-4 font-bold text-[#174f47]">
          <Link href="/en/learn-arabic" className="underline">English guide</Link><Link href="/courses" className="underline">Course explorer</Link>
        </div>
      </section>
    </div>
  </main>;
}
