import type { Metadata } from "next";
import Link from "next/link";
import { ARAB_COUNTRY_CODES, getArabicCountryOptions } from "@/lib/countries";
import { maxGradeForCountry } from "@/lib/student/country-grade-limits";

export const metadata: Metadata = {
  title: "ذاكر العربية الآن — 22 دولة وكل الصفوف | ضاديوم",
  description: "ابدأ دروس مهارات العربية الأصلية في ضاديوم لأي دولة عربية وصف: شرح واضح ومثال محلول وتطبيق وإجابة للتدريب الذاتي. المواد ليست نصوص الكتب الوزارية.",
  alternates: { canonical: "/study" },
  robots: { index: true, follow: true },
};

export default function DadyoomStudyDirectory() {
  const codes = new Set<string>(ARAB_COUNTRY_CODES);
  const countries = getArabicCountryOptions().filter(x => codes.has(x.code));

  return <main dir="rtl" className="min-h-screen bg-[#f7f1e6] px-4 py-8 text-[#153d36]">
    <div className="mx-auto max-w-7xl space-y-7">
      <nav aria-label="مسار العودة" className="flex flex-wrap gap-4 text-sm font-bold">
        <Link href="/" className="underline">ضاديوم</Link>
        <Link href="/curriculum" className="underline">مناهج الدول</Link>
        <Link href="/search" className="underline">ابحث عن درس باسمه</Link>
      </nav>
      <header className="rounded-[2.2rem] bg-[#123f39] p-7 text-white sm:p-10">
        <p className="font-black text-[#f3d896]">اللغة العربية أسهل في ضاديوم</p>
        <h1 className="mt-3 text-3xl font-black leading-relaxed sm:text-4xl">ابدأ مذاكرة العربية من دولتك وصفك</h1>
        <p className="mt-4 max-w-4xl leading-9 text-[#ecf5ef]">
          22 دولة، و266 مسار دولة وصف، وفي كل مسار 18 مهارة متاحة للتدريب.
          اختر بلدك ثم صفك لتشاهد مثالًا محلولًا وسؤالًا وإجابة تُظهرها بعد المحاولة.
          هذه دروس أصلية من ضاديوم، وليست نسخًا من الكتب الوزارية أو دليلًا على اكتمال مطابقتها.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/search" className="rounded-full bg-[#f3d896] px-5 py-3 font-black text-[#123f39]">
            🔍 ابحث باسم الدرس
          </Link>
          <Link href="/curriculum" className="rounded-full border border-white/60 px-5 py-3 font-black text-white">
            راجع فهرس الكتب والدروس
          </Link>
        </div>
      </header>
      <section aria-label="اختر دولتك وصفك" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {countries.map(country => {
          const maximum = maxGradeForCountry(country.code);
          return <article key={country.code} className="rounded-3xl border border-[#d6c7a7] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-[#846632]">{country.code}</p>
                <h2 className="mt-1 text-xl font-black">{country.name}</h2>
              </div>
              <Link href={"/curriculum/" + country.code.toLowerCase()} prefetch={false}
                className="text-sm font-black text-[#175a50] underline">المنهج</Link>
            </div>
            <p className="mt-2 text-sm leading-7 text-[#776c5e]">
              اختر الصف من {maximum} صفوف متاحة للمهارات الأصلية.
            </p>
            <details className="mt-4 rounded-2xl border border-[#d4c19c] bg-[#fff9ed] p-4">
              <summary className="cursor-pointer font-black">اختر صفك لبدء المذاكرة</summary>
              <div className="mt-4 grid grid-cols-4 gap-2" aria-label={"صفوف " + country.name}>
                {Array.from({ length: maximum }, (_, i) => i + 1).map(grade =>
                  <Link key={grade}
                    href={"/study/" + country.code.toLowerCase() + "/" + grade}
                    prefetch={false}
                    aria-label={"مذاكرة الصف " + grade + " في " + country.name}
                    className="flex min-h-11 items-center justify-center rounded-xl bg-[#e3efe8] px-2 py-2 font-black text-[#123f39] hover:bg-[#c5e2ce]">
                    {grade}
                  </Link>)}
              </div>
            </details>
            <Link href={"/study/" + country.code.toLowerCase() + "/1"} prefetch={false}
              className="mt-3 block rounded-xl bg-[#123f39] px-4 py-3 text-center font-black text-white">
              ابدأ بالصف الأول ←
            </Link>
          </article>;
        })}
      </section>
      <section className="rounded-3xl border border-[#d6c7a7] bg-white p-6">
        <h2 className="text-xl font-black">الفرق بين «مهارات ضاديوم» و«المنهج الرسمي»</h2>
        <p className="mt-3 leading-9">
          يمكنك مذاكرة مهارات القراءة والقواعد والكتابة فورًا في جميع الدول، لكن محتوى
          المهارة المشتركة لا يحل محل كتاب الوزارة، ولا ندّعي أنه يغطي كل وحدة ونص وتدريب
          في كتابك. استخدم دليل المناهج للبحث عن درس الكتاب، ثم تحقق من حالة المصدر والتوثيق.
        </p>
      </section>
    </div>
  </main>;
}
