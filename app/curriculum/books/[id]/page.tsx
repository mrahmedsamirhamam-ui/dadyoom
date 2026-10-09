import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

import { isBookReference, isKnownBookReferenceId } from "@/lib/curriculum/verified-book-reference";
import { SUPABASE_PUBLIC_URL, SUPABASE_PUBLIC_KEY } from "@/lib/supabase/public-config";

export const revalidate = 3600;

type Props = { params: Promise<{ id: string }> };
type Lesson = { id: string; title: string; unit_id: string; status: string };
type Unit = { id: string; title: string; grade_id: string };
type Grade = { id: string; name_ar: string; grade_number: number | null; curriculum_id: string };
type Curriculum = { id: string; name_ar: string; academic_year: string | null; country_id: string };
type Country = { id: string; code: string; name_ar: string };

const sourceDirectories: Record<string, { title: string; url: string; editionNote: string }> = {
  LY: {
    title: "مركز المناهج التعليمية والبحوث التربوية الليبي — قائمة كتب المرحلة الثانوية",
    url: "https://cerc.moe.gov.ly/educational-curricul/page/4/?_educational-stage=education-secondary",
    editionNote: "تسرد القائمة الحكومية كتب الصف الثالث الثانوي الأدبي لعام 2025–2026؛ لم نتحقق بعد من فهرس كل كتاب وطبعة 2026–2027.",
  },
  TN: {
    title: "المركز الوطني البيداغوجي التونسي — الكتب المدرسية 2026–2027",
    url: "https://www.cnp.com.tn/arabic/index.htm",
    editionNote: "القائمة المرجعية للكتب متاحة لعام 2026–2027، أما دروس الصفحات داخل الكتاب فلم تُطابق تفصيليًا بعد.",
  },
  OM: {
    title: "وزارة التربية والتعليم العُمانية — المكتبة الرقمية للكتب المدرسية",
    url: "https://site.moe.gov.om/Students",
    editionNote: "المكتبة الرقمية مصدر للوصول إلى الكتب؛ لا نعتبر فهرس هذه البطاقة أو طبعتها الحالية متحققين حتى مراجعة صفحات الكتاب.",
  },
  YE: {
    title: "الإدارة العامة للإعلام التربوي اليمنية — روابط الكتب التعليمية",
    url: "https://t.me/s/YemenEducationC?before=25328",
    editionNote: "توجد روابط كتب منشورة من القناة التعليمية؛ يجب تحديد الطبعة والجزء والفهرس قبل اعتماد عناوين الدروس.",
  },
};

async function lookupBook(id: string) {
  if (!isKnownBookReferenceId(id)) return null;
  const db = createClient(SUPABASE_PUBLIC_URL, SUPABASE_PUBLIC_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: lesson, error: e1 } = await db.from("lessons")
    .select("id,title,unit_id,status").eq("id", id).eq("status","published").maybeSingle();
  if (e1 || !lesson) return null;
  const l = lesson as Lesson;
  const { data: unit, error: e2 } = await db.from("units")
    .select("id,title,grade_id").eq("id", l.unit_id).maybeSingle();
  if (e2 || !unit) return null;
  const u = unit as Unit;
  const { data: grade, error: e3 } = await db.from("grades")
    .select("id,name_ar,grade_number,curriculum_id").eq("id", u.grade_id).maybeSingle();
  if (e3 || !grade) return null;
  const g = grade as Grade;
  const { data: curriculum, error: e4 } = await db.from("curricula")
    .select("id,name_ar,academic_year,country_id").eq("id",g.curriculum_id).maybeSingle();
  if (e4 || !curriculum) return null;
  const c = curriculum as Curriculum;
  const { data: country, error: e5 } = await db.from("countries")
    .select("id,code,name_ar").eq("id", c.country_id).maybeSingle();
  if (e5 || !country) return null;
  const co = country as Country;
  if (!isBookReference({ countryCode: co.code, unitTitle: u.title, lessonTitle: l.title }))
    return null;
  return { lesson:l, unit:u, grade:g, curriculum:c, country:co };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: isKnownBookReferenceId(id) ? "مراجع الكتب المدرسية | ضاديوم" : "الكتاب غير موجود | ضاديوم",
    description: "بطاقة مرجعية لعنوان كتاب مدرسي؛ يتم التحقق من الفهرس والطبعة قبل إضافة الدروس.",
    robots: { index:false, follow:true },
    alternates: { canonical: `/curriculum/books/${id}` },
  };
}

export default async function BookReferencePage({ params }: Props) {
  const { id } = await params;
  const data = await lookupBook(id);
  if (!data) notFound();
  const { lesson, unit, grade, country } = data;
  const source = sourceDirectories[country.code];
  const countryPath = `/curriculum/${country.code.toLowerCase()}`;

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f1e6] px-4 py-12 text-[#203a34]">
      <div className="mx-auto max-w-4xl space-y-7">
        <nav aria-label="مسار التنقل" className="flex flex-wrap gap-3 text-sm font-bold">
          <Link href="/" className="underline">ضاديوم</Link>
          <span>←</span>
          <Link href="/curriculum" className="underline">دليل المناهج</Link>
          <span>←</span>
          <Link href={countryPath} className="underline">{country.name_ar}</Link>
        </nav>
        <section className="rounded-[2rem] border border-[#d8c7a4] bg-white p-6 shadow-sm sm:p-10">
          <p className="font-black text-[#9a712c]">مرجع كتاب مدرسي — ليس درسًا</p>
          <h1 className="mt-4 text-3xl font-black leading-relaxed text-[#123f39]">
            {lesson.title}
          </h1>
          <p className="mt-3 font-bold text-[#615c50]">
            {country.name_ar} — {grade.name_ar} — {unit.title}
          </p>
          <p className="mt-6 text-lg leading-9">
            هذه بطاقة مرجعية لاسم كتاب أو جزء منه. لا يوجد فهرس دروس موثَّق منشور داخل هذه البطاقة،
            ولا يمكن اعتبارها شرحًا أو اختبارًا، ولا تُمنح عليها نقاط أو حالة إكمال.
          </p>
          <div className="mt-6 rounded-2xl border border-[#ddcfb4] bg-[#fffaf0] p-5">
            <h2 className="font-black text-lg">حالة المطابقة</h2>
            <p className="mt-2 leading-8">
              جارٍ التحقق من الفهرس التفصيلي والطبعة المعتمدة وموقع الدروس داخل الكتاب.
              لن تُضاف عناوين افتراضية أو مقتطفات غير موثقة على أنها نص الكتاب.
            </p>
            {source ? (
              <>
                <p className="mt-3 leading-7">{source.editionNote}</p>
                <a href={source.url} target="_blank" rel="noopener noreferrer"
                  className="mt-4 inline-block font-black text-[#15584e] underline">
                  {source.title} ↗
                </a>
              </>
            ) : null}
          </div>
          <div className="mt-6 flex flex-wrap gap-3 text-sm font-black">
            <Link href={countryPath}
              className="rounded-xl bg-[#123f39] px-5 py-3 text-white">
              استعرض الدروس المتاحة في {country.name_ar}
            </Link>
            <Link href="/courses"
              className="rounded-xl border border-[#cdbb96] px-5 py-3 text-[#123f39]">
              بوابة المناهج
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
