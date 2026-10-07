import type { Metadata } from "next";
import Link from "next/link";

import {
  ARAB_COUNTRY_CODES,
  getArabicCountryOptions,
} from "@/lib/countries";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "دليل المناهج والدروس العربية",
  description:
    "دليل ضاديوم القابل للزحف لمناهج ودروس اللغة العربية في 22 دولة عربية، مع روابط مباشرة إلى صفحات الدول والدروس المنشورة.",
  alternates: { canonical: "/curriculum" },
  robots: {
    index: true,
    follow: true,
  },
};

export default function CurriculumDirectoryPage() {
  const arabCodes = new Set<string>(ARAB_COUNTRY_CODES);
  const countries = getArabicCountryOptions().filter((item) =>
    arabCodes.has(item.code),
  );
  const site = getSiteUrl();

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "ضاديوم",
          item: site,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "دليل المناهج والدروس",
          item: `${site}/curriculum`,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "مناهج اللغة العربية في 22 دولة عربية",
      numberOfItems: countries.length,
      itemListElement: countries.map(
        (country, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: `مناهج اللغة العربية في ${country.name}`,
          url:
            `${site}/curriculum/${country.code.toLowerCase()}`,
        }),
      ),
    },
  ];

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f1e6] px-4 py-12 text-[#202c29]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(jsonLd).replace(
              /</g,
              "\\u003c",
            ),
        }}
      />
      <div className="mx-auto max-w-6xl">
        <nav className="mb-8 text-sm font-bold text-[#6d665c]" aria-label="مسار التنقل">
          <Link href="/" className="hover:underline">ضاديوم</Link>
          <span className="mx-2">←</span>
          <span>دليل المناهج والدروس</span>
        </nav>

        <header className="rounded-[2rem] border border-[#d8c7a4] bg-[#fffdf8] p-7 shadow-sm sm:p-10">
          <p className="text-sm font-black text-[#9a712c]">دليل ضاديوم التعليمي</p>
          <h1 className="mt-3 font-arabic-display text-4xl font-black leading-[1.4] text-[#123f39]">
            المناهج والدروس العربية حسب الدولة
          </h1>
          <p className="mt-4 max-w-3xl font-arabic-reading text-lg leading-9 text-[#655e54]">
            اختر الدولة للوصول إلى الصفوف والوحدات والدروس المنشورة بروابط مباشرة
            يمكن للطلاب ومحركات البحث الوصول إليها دون الحاجة إلى قوائم تفاعلية.
          </p>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {countries.map((country) => (
            <Link
              key={country.code}
              href={`/curriculum/${country.code.toLowerCase()}`}
              className="rounded-3xl border border-[#ddcfb4] bg-[#fffdf8] p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[#a99161] hover:shadow-lg"
            >
              <div className="text-xs font-black text-[#9a712c]">{country.code}</div>
              <h2 className="mt-2 text-2xl font-black text-[#123f39]">{country.name}</h2>
              <div className="mt-4 text-sm font-black text-[#174f47]">افتح المناهج والدروس ←</div>
            </Link>
          ))}
        </section>

        <div className="mt-10">
          <Link href="/courses" className="font-black text-[#174f47] hover:underline">
            افتح مستكشف المناهج التفاعلي
          </Link>
        </div>
      </div>
    </main>
  );
}
