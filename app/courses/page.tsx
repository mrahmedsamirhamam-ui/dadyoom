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
      <section
        dir="rtl"
        className="border-b border-[#dfcfad] bg-[#fffaf0] px-4 py-10 sm:px-6"
      >
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-black text-[#a7772f]">
            بوابة المناهج العربية
          </p>
          <h1 className="mt-2 font-arabic-display text-3xl font-black leading-[1.45] text-[#123f39] sm:text-4xl">
            تعلّم من موقعك الحقيقي في المنهج، ثم قوِّ المهارة
          </h1>
          <div className="mt-5 space-y-4 font-arabic-reading leading-8 text-[#625b51]">
            <p>
              تغطي ضاديوم الدول العربية عبر مسار أساسي موحد للمهارات، مع طبقات
              وطنية تربط الصفوف والكتب والمجالات بالمصادر الرسمية المتاحة. عندما
              يتوفر فهرس حكومي واضح نستخدم عناوينه كبنية مرجعية، وعندما يثبت المصدر
              كتابًا أو مجالًا فقط نحافظ على المطابقة عند هذا المستوى ولا نختلق
              عناوين غير منشورة.
            </p>
            <p>
              في المرحلة الثانوية قد ترى «المطابقة الوطنية الموثقة» إلى جانب
              «دروس ضاديوم الداعمة». الأولى توضح ما أمكن التحقق منه من المصدر
              الوطني، والثانية تقدم شرحًا وأسئلة وأنشطة أصلية في القراءة والكتابة
              والاستماع والتحدث والنحو والمفردات لتقوية المهارات حول المنهج.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#e1d4ba] bg-white p-4">
              <div className="text-2xl font-black text-[#123f39]">22</div>
              <div className="mt-1 text-sm font-bold text-[#6c6257]">دولة عربية ضمن التغطية</div>
            </div>
            <div className="rounded-2xl border border-[#e1d4ba] bg-white p-4">
              <div className="text-2xl font-black text-[#123f39]">1–12+</div>
              <div className="mt-1 text-sm font-bold text-[#6c6257]">صفوف ومستويات بحسب الدولة</div>
            </div>
            <div className="rounded-2xl border border-[#e1d4ba] bg-white p-4">
              <div className="text-2xl font-black text-[#123f39]">4</div>
              <div className="mt-1 text-sm font-bold text-[#6c6257]">مهارات لغوية مترابطة</div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 text-sm font-black">
            <Link href="/learn-arabic" className="rounded-xl bg-[#123f39] px-4 py-2.5 text-white">
              اقرأ دليل تعلم العربية
            </Link>
            <Link href="/about" className="rounded-xl border border-[#cdbb96] px-4 py-2.5 text-[#123f39]">
              كيف نبني المطابقة؟
            </Link>
          </div>
        </div>
      </section>

      <CurriculumCatalogClient countries={countries} />
    </>
  );
}
