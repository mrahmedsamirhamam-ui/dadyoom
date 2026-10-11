import Link from "next/link";
import audit from "@/data/curriculum-completeness/bahrain-source-provenance-20261011.json";

// Reviewed snapshot only. AdminLayout enforces profile.role === "admin".
// Do not fire multi-thousand-row live queries on each Cloudflare SSR render.
const grades = [...audit.grades].sort(
  (a,b) => b.historical_plan-a.historical_plan || a.grade_number-b.grade_number,
);
const totals = {
  published: grades.reduce((n,r)=>n+r.total,0),
  current: grades.reduce((n,r)=>n+r.current_plan,0),
  historical: grades.reduce((n,r)=>n+r.historical_plan,0),
  dadyoomCore: grades.reduce((n,r)=>n+r.dadyoom_core_unsourced,0),
  ministryResources: grades.reduce((n,r)=>n+r.ministry_digital_lesson,0),
  other: grades.reduce((n,r)=>n+r.ebook_viewer+r.other_source,0),
};
const label = (g: number) => g === 0 ? "التعليم المستمر" : `الصف ${g}`;

export default function BahrainPlanSourceAuditPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f1e6] px-4 py-10 text-[#203a34]">
      <div className="mx-auto max-w-7xl space-y-7">
        <nav className="flex flex-wrap gap-3 text-sm font-bold text-[#174f47]">
          <Link href="/admin">الإدارة</Link><span>←</span>
          <Link href="/admin/curriculum/coverage">تدقيق الكتب</Link><span>←</span>
          <span>تدقيق سنوات مصادر الدروس</span>
        </nav>
        <header className="rounded-3xl border border-[#d8c7a4] bg-white p-6 sm:p-9">
          <p className="text-sm font-black text-[#9a712c]">مناهج البحرين — مقارنة روابط خطط توزيع الدروس</p>
          <h1 className="mt-3 text-3xl font-black text-[#123f39]">مصادر الدروس: الحالي والتاريخي</h1>
          <p className="mt-3 leading-8 text-[#5b625b]">
            تقرير قراءة موثق بتاريخ {audit.auditedAt} وليس استعلامًا حيًا.
            ملفات الدروس الرقمية الخمسة للصف الأول وثائق تعليمية من الوزارة، لكنها ليست كتبًا كاملة ولا خطط توزيع السنة الحالية.
            تصنيف «خطة حالية» يعني أن الرابط يشير إلى وثيقة تحمل سنة 2026–2027،
            ولا يعني التحقق من فهرس الكتاب أو من صحة كل نشاط. وروابط 2025–2026 لا تثبت مقرر الفصل الثاني الحالي.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["الدروس المنشورة", totals.published],
              ["روابط خطة 2026–2027",totals.current],
              ["روابط خطة 2025–2026",totals.historical],
              ["دروس ضاديوم الداعمة دون مصدر وزاري",totals.dadyoomCore],
              ["موارد دروس رقمية رسمية مستقلة",totals.ministryResources],
              ["عارض كتاب إلكتروني / مصادر أخرى",totals.other],
            ].map(([name,count]) => (
              <div key={name} className="rounded-2xl bg-[#f7f1e6] p-4">
                <p className="text-3xl font-black tabular-nums">{count}</p>
                <p className="mt-2 text-sm font-bold leading-6 text-[#625b51]">{name}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm font-semibold text-[#795d2a]">
            لا تُغيِّر هذه الصفحة منشورات الطلاب أو صلاحياتهم، ولا تعتمد الكتب تلقائيًا.
          </p>
        </header>

        <section className="rounded-3xl border border-[#ddcfb4] bg-white p-5 sm:p-7">
          <h2 className="text-xl font-black text-[#123f39]">أولويات المراجعة بحسب عدد المراجع التاريخية</h2>
          <p className="mt-2 text-sm leading-7 text-[#6b6254]">
            رتبت الصفوف حسب عدد الدروس التي تشير إلى خطة العام السابق، لإعطاء المعلم قائمة مراجعة واضحة.
            لا يدل هذا الترتيب وحده على أن مضمون الدروس أصبح غير صحيح.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[780px] text-right text-sm">
              <thead><tr className="border-b bg-[#f7f1e6]">
                {["الصف أو المستوى","دروس منشورة","خطة 2026–2027","خطة 2025–2026","ضاديوم الداعم دون مصدر رسمي","ملفات دروس رقمية من الوزارة","عارض كتاب/مصدر آخر","فتح الصف"].map(name=>(
                  <th key={name} className="px-3 py-3 font-black">{name}</th>
                ))}
              </tr></thead>
              <tbody>{grades.map(row=>(
                <tr key={row.grade_number} className="border-b border-[#ece5d8]">
                  <td className="px-3 py-3 font-bold">{label(row.grade_number)}</td>
                  <td className="px-3 py-3 tabular-nums">{row.total}</td>
                  <td className="px-3 py-3 tabular-nums text-emerald-800">{row.current_plan}</td>
                  <td className="px-3 py-3 font-black tabular-nums text-amber-800">{row.historical_plan}</td>
                  <td className="px-3 py-3 tabular-nums">{row.dadyoom_core_unsourced}</td>
                  <td className="px-3 py-3 tabular-nums">{row.ministry_digital_lesson}</td>
                  <td className="px-3 py-3 tabular-nums">{row.ebook_viewer+row.other_source}</td>
                  <td className="px-3 py-3">
                    <Link href={row.grade_number===0?"/courses":`/curriculum/bh/${row.grade_number}`}
                      className="font-black text-[#145448] underline">
                      فتح المناهج ←
                    </Link>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl border border-[#ddcfb4] bg-white p-5 sm:p-7">
          <h2 className="text-xl font-black text-[#123f39]">المسارات الثانوية — تحليل مستقل لكل منهج</h2>
          <p className="mt-2 text-sm leading-7 text-[#6b6254]">
            كل صف قد يتضمن مسارات تعليمية متعددة. الرقم هنا هو عدد الدروس المنشورة
            المرتبطة باسم المنهج في تاريخ اللقطة، وليس عدد فصول كتاب تم تدقيقها.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[780px] text-right text-sm">
              <thead><tr className="border-b bg-[#f7f1e6]">
                {["الصف","المسار / اسم المنهج","الدروس","مرجع 2026–2027","مرجع 2025–2026"].map(name=>(
                  <th key={name} className="px-3 py-3 font-black">{name}</th>
                ))}
              </tr></thead>
              <tbody>{audit.secondaryTracks.map((row,i)=>(
                <tr key={`${row.grade_number}-${row.curriculum_name}-${i}`} className="border-b border-[#ece5d8]">
                  <td className="px-3 py-3 font-bold">{label(row.grade_number)}</td>
                  <td className="px-3 py-3">{row.curriculum_name}</td>
                  <td className="px-3 py-3 tabular-nums">{row.total}</td>
                  <td className="px-3 py-3 tabular-nums">{row.current_plan}</td>
                  <td className="px-3 py-3 font-black tabular-nums text-amber-800">{row.historical_plan}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl border border-[#ddcfb4] bg-white p-5 sm:p-7">
          <h2 className="text-xl font-black text-[#123f39]">دروس محددة لبدء المراجعة</h2>
          <p className="mt-2 text-sm leading-7 text-[#6b6254]">
            أمثلة مأخوذة من السجلات المنشورة، حتى ثلاثة لكل صف وفئة مصدر.
            افتح الدرس ووثيقة المصدر، ثم قارنه بكتاب العام الحالي قبل تعديل تصنيفه.
            هذه أمثلة وليست قائمة شاملة بكل الدروس التي تحتاج تدقيقًا.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {audit.reviewExamples.map(item=>(
              <article key={item.id} className="rounded-2xl border border-[#e4dac6] bg-[#fffdf8] p-4">
                <p className="text-xs font-black text-[#865b16]">
                  {label(item.grade_number)} • {item.source_kind==="historical_plan"
                    ? "خطة 2025–2026 تاريخية"
                    : item.source_kind==="ebook_viewer" ? "عارض كتاب" : item.source_kind==="ministry_digital_lesson" ? "ملف درس رقمي رسمي؛ السنة غير مثبتة" : "مصدر يحتاج تصنيفًا"}
                </p>
                <h3 className="mt-2 font-black leading-7">{item.title}</h3>
                <p className="mt-2 text-xs leading-6 text-[#686055]">{item.curriculum_name}</p>
                <div className="mt-3 flex flex-wrap gap-4 text-sm font-black text-[#15584e]">
                  <Link href={`/lessons/${item.id}`} className="underline">افتح الدرس ←</Link>
                  {item.source_pdf_url?.startsWith("https://") ? (
                    <a href={item.source_pdf_url} target="_blank" rel="noopener noreferrer" className="underline">
                      وثيقة المصدر ↗
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-xl font-black text-amber-950">ما الذي لا يثبته هذا التقرير؟</h2>
          <p className="mt-2 text-sm leading-8 text-amber-950">
            وجود رابط خطة توزيع لا يثبت أن فهرس الكتاب الحالي طابق جميع دروس ضاديوم 1:1.
            وحتى بعد تصنيف كل روابط السنوات ستظل مراجعة الطبعات والصفحات والأنشطة
            والتقويمات مطلوبة. لا تُحذف الدروس ذات المصدر القديم دون مراجعة تربوية.
          </p>
        </section>
      </div>
    </main>
  );
}
