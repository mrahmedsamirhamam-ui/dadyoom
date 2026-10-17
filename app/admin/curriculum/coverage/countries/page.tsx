import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Row = {
  country_code: string;
  country_name_ar: string;
  published_count: number;
  draft_count: number;
  published_missing_source: number;
  published_missing_pages: number;
  published_generic_intro: number;
  published_unresolved_ocr: number;
  published_plan_or_catalog_links: number;
};

function fmt(value: number) {
  return Number(value ?? 0).toLocaleString("ar-BH");
}
function Stat({ title, value, note }: { title: string; value: number; note?: string }) {
  return <div className="rounded-2xl border border-[#e3d5b7] bg-white p-4">
    <p className="text-sm font-bold text-[#776a57]">{title}</p>
    <p className="mt-2 text-3xl font-black text-[#123f39]">{fmt(value)}</p>
    {note ? <p className="mt-2 text-xs leading-6 text-[#776a57]">{note}</p> : null}
  </div>;
}

/** Live admin-only evidence gaps; counts are NOT percentages of textbook completion. */
export default async function CountrySourceAuditPage() {
  const db = await createClient();
  const result = await db.rpc("dadyoom_admin_lesson_source_audit_v1");
  if (result.error) {
    console.error("CURRICULUM_COUNTRY_SOURCE_AUDIT_FAILED", result.error.code);
    return <main dir="rtl" className="p-7">
      <h1 className="text-2xl font-black">تدقيق مصادر المناهج</h1>
      <p role="alert" className="mt-4 rounded-2xl bg-rose-50 p-5 font-bold text-rose-950">
        تعذر قراءة تقرير المصادر الآن. لم تتغير أي بيانات للدروس.
      </p>
    </main>;
  }
  const rows = ((result.data ?? []) as unknown as Row[]).map(row => ({
    ...row,
    published_count: Number(row.published_count ?? 0),
    draft_count: Number(row.draft_count ?? 0),
    published_missing_source: Number(row.published_missing_source ?? 0),
    published_missing_pages: Number(row.published_missing_pages ?? 0),
    published_generic_intro: Number(row.published_generic_intro ?? 0),
    published_unresolved_ocr: Number(row.published_unresolved_ocr ?? 0),
    published_plan_or_catalog_links: Number(row.published_plan_or_catalog_links ?? 0),
  }));
  const totals = rows.reduce((s, row) => ({
    published: s.published + row.published_count,
    drafts: s.drafts + row.draft_count,
    missingPages: s.missingPages + row.published_missing_pages,
    missingSource: s.missingSource + row.published_missing_source,
    generic: s.generic + row.published_generic_intro,
    ocr: s.ocr + row.published_unresolved_ocr,
  }), { published: 0, drafts: 0, missingPages: 0, missingSource: 0, generic: 0, ocr: 0 });

  // Frozen pre-remediation count observed on 2026-10-17. This metric
  // measures generic teaching introductions, NOT official book coverage.
  const BH_GENERAL_INTRO_BASELINE = 265;
  const bahrain = rows.find(row => row.country_code === "BH") ?? null;
  const bhRemaining = bahrain?.published_generic_intro ?? null;
  const bhRemediated = bhRemaining === null ? null :
    Math.max(0, Math.min(BH_GENERAL_INTRO_BASELINE,
      BH_GENERAL_INTRO_BASELINE - bhRemaining));
  const bhProgress = bhRemediated === null ? null :
    Math.round((bhRemediated / BH_GENERAL_INTRO_BASELINE) * 1000) / 10;

  return <main dir="rtl" className="min-h-screen bg-[#f7f1e6] px-4 py-8 text-[#203a34] sm:px-7">
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-3xl bg-[#123f39] p-7 text-white">
        <p className="text-sm font-bold text-[#e9cf8d]">مركز الجودة — مناهج 22 دولة</p>
        <h1 className="mt-2 text-3xl font-black">فجوات المصادر وصفحات الدروس</h1>
        <p className="mt-3 max-w-4xl text-sm leading-8 text-[#e7f1ed]">
          بيانات حيّة من سجلات المناهج المنشورة والمسودات. وجود رابط أو صفحات لا يعني اعتماد
          الكتاب؛ مطابقة الفهرس الرسمي والنصوص والأنشطة تحتاج أدلة ومراجعة مستقلة.
        </p>
        <nav className="mt-5 flex flex-wrap gap-4 text-sm font-black">
          <Link href="/admin/curriculum" className="text-[#ffe3a2] underline">بوابة المناهج</Link>
          <Link href="/admin/lessons" className="text-[#ffe3a2] underline">كل الدروس</Link>
          <Link href="/admin/curriculum/coverage/toc-review" className="text-[#ffe3a2] underline">فحص فهارس الكتب</Link>
        </nav>
      </header>
      {bahrain && bhRemaining !== null && bhRemediated !== null && bhProgress !== null ? (
        <section aria-label="تقدم معالجة شروح البحرين" className="rounded-3xl border border-[#dfcfad] bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-black text-[#123f39]">
              نسبة إصلاح الشروح العامة — البحرين
            </h2>
            <p className="text-2xl font-black tabular-nums text-[#123f39]">
              {bhProgress.toLocaleString("ar-BH")}%
            </p>
          </div>
          <p className="mt-2 text-sm leading-7 text-[#5f594e]">
            تحسنت {fmt(bhRemediated)} مادة تعليمية من أصل {fmt(BH_GENERAL_INTRO_BASELINE)}
            مادة ذات شرح عام عند بدء المعالجة في 17 أكتوبر 2026.
            بقي {fmt(bhRemaining)} من هذه الفجوة وفق العد الحالي.
          </p>
          <progress className="mt-4 h-4 w-full accent-[#176455]" value={bhRemediated}
            max={BH_GENERAL_INTRO_BASELINE}
            aria-label="نسبة الشروح العامة في البحرين التي عُولجت منذ خط الأساس" />
          <p className="mt-2 text-xs leading-6 text-[#706457]">
            هذا مؤشر إصلاح الشروح على أساس خطّ أساس محفوظ، وليس نسبة اكتمال كتب الوزارة
            أو المنهج الرسمي أو منصة ضاديوم كلها.
          </p>
          <Link href="/admin/lessons?country=BH&status=published&review=generic-intro"
            className="mt-3 inline-flex font-black text-[#176455] underline">
            اعرض الشروح التي ما زالت تحتاج إثراءً ←
          </Link>
        </section>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat title="سجلات منشورة" value={totals.published} note="عدد سجلات قاعدة البيانات وليس الدروس الوزارية المكتملة"/>
        <Stat title="مسودات تنتظر العمل" value={totals.drafts}/>
        <Stat title="منشور بلا نطاق صفحات صالح" value={totals.missingPages}/>
        <Stat title="منشور بلا رابط HTTPS مسجل" value={totals.missingSource}/>
        <Stat title="شروح ذات مقدمة عامة" value={totals.generic}/>
        <Stat title="سجلات OCR غير محسومة" value={totals.ocr}/>
      </div>
      <section className="rounded-3xl border border-[#dfcfad] bg-white p-5">
        <h2 className="text-xl font-black text-[#123f39]">أولويات المراجعة حسب الدولة</h2>
        <p className="mt-2 text-sm leading-7 text-[#73695d]">
          الحقول تتداخل؛ لا تجمع أعداد «بلا رابط» و«بلا صفحات» أو «قالب» كأنها دروس مختلفة.
          لم تتم مراجعة مطابقة الفهرس تلقائيًا، ولم يتم تعديل أو نشر أي درس بواسطة هذا التقرير.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1080px] text-right text-sm">
            <thead><tr className="border-b bg-[#f7f1e6] text-[#123f39]">
              <th className="p-3">الدولة</th><th className="p-3">منشور</th>
              <th className="p-3">مسودة</th><th className="p-3">بلا رابط آمن</th>
              <th className="p-3">بلا صفحات</th><th className="p-3">شرح عام</th>
              <th className="p-3">OCR</th><th className="p-3">رابط خطة/فهرس</th>
              <th className="p-3">العمل</th>
            </tr></thead>
            <tbody>{rows.map(row => <tr key={row.country_code} className="border-b last:border-0">
              <td className="p-3 font-black">{row.country_name_ar}</td>
              <td className="p-3">{fmt(row.published_count)}</td>
              <td className="p-3">{fmt(row.draft_count)}</td>
              <td className="p-3">{fmt(row.published_missing_source)}</td>
              <td className="p-3">{fmt(row.published_missing_pages)}</td>
              <td className="p-3">{fmt(row.published_generic_intro)}</td>
              <td className="p-3">{fmt(row.published_unresolved_ocr)}</td>
              <td className="p-3">{fmt(row.published_plan_or_catalog_links)}</td>
              <td className="p-3">
                <div className="flex flex-col gap-2">
                  <Link prefetch={false} className="font-bold text-[#174f47] underline"
                    href={`/admin/lessons?country=${encodeURIComponent(row.country_code)}&status=published`}>
                    مراجعة المنشور
                  </Link>
                  {row.published_missing_pages > 0 ? (
                    <Link prefetch={false} className="font-bold text-amber-800 underline"
                      href={`/admin/lessons?country=${encodeURIComponent(row.country_code)}&status=published&review=missing-pages`}>
                      دروس بلا صفحات
                    </Link>
                  ) : null}
                  {row.published_generic_intro > 0 ? (
                    <Link prefetch={false} className="font-bold text-amber-800 underline"
                      href={`/admin/lessons?country=${encodeURIComponent(row.country_code)}&status=published&review=generic-intro`}>
                      الشروح المستوردة
                    </Link>
                  ) : null}
                  {row.published_unresolved_ocr > 0 ? (
                    <Link prefetch={false} className="font-bold text-amber-800 underline"
                      href={`/admin/lessons?country=${encodeURIComponent(row.country_code)}&status=published&review=unresolved-ocr`}>
                      سجلات OCR
                    </Link>
                  ) : null}
                  <Link prefetch={false} className="font-bold text-[#174f47] underline"
                    href={`/admin/lessons?country=${encodeURIComponent(row.country_code)}&status=draft`}>
                    مراجعة المسودات
                  </Link>
                </div>
              </td>
            </tr>)}</tbody>
          </table>
        </div>
        {!rows.length ? <p role="alert" className="mt-4 rounded-xl bg-amber-50 p-4 font-bold">
          لا تتوفر بيانات التقرير لهذا الحساب؛ يلزم حساب مدير مصرح له.
        </p> : null}
      </section>
    </div>
  </main>;
}
