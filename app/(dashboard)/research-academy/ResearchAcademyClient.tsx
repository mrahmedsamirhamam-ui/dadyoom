"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  buildResearchOutline,
  formatReferenceDraft,
  methodLabels,
  type ReferenceInput,
  type ResearchInput,
  type ResearchMethod,
  type SourceType,
} from "@/lib/research-academy/outline";

const blankResearch: ResearchInput = {
  topic: "",
  problem: "",
  objective: "",
  questions: "",
  method: "undecided",
  population: "",
};

const blankReference: ReferenceInput = {
  author: "",
  year: "",
  title: "",
  publisher: "",
  url: "",
  type: "article",
};

const textFields: ReadonlyArray<{
  key: "topic" | "problem" | "objective" | "questions" | "population";
  title: string;
  placeholder: string;
  multiple?: boolean;
}> = [
  { key: "topic", title: "عنوان البحث أو فكرته", placeholder: "مثال: أثر القراءة التفاعلية في تنمية الفهم لدى طلاب الصف السابع" },
  { key: "problem", title: "مشكلة البحث", placeholder: "ما المشكلة التي لاحظتها؟ وما الدليل على وجودها؟", multiple: true },
  { key: "objective", title: "هدف البحث", placeholder: "مثال: تقصي أثر استراتيجية محددة على مهارة محددة" },
  { key: "questions", title: "أسئلة البحث (سؤال في كل سطر)", placeholder: "ما أثر ...؟\nما الصعوبات ...؟", multiple: true },
  { key: "population", title: "مجتمع الدراسة أو مادتها", placeholder: "طلاب المرحلة الإعدادية / نصوص عربية / وثائق ..." },
];

const fieldClass = "mt-2 w-full rounded-2xl border border-[#d6c6a8] bg-white p-3.5 text-base text-[#243c36] outline-none transition focus:border-[#123f39] focus:ring-2 focus:ring-[#d9ebe1]";
const headingClass = "text-xl font-black text-[#123f39]";
const cardClass = "rounded-[1.8rem] border border-[#dfcfad] bg-[#fffdf8] p-5 shadow-sm sm:p-7";

export default function ResearchAcademyClient() {
  const [research, setResearch] = useState<ResearchInput>(blankResearch);
  const [reference, setReference] = useState<ReferenceInput>(blankReference);
  const [references, setReferences] = useState<string[]>([]);
  const [refError, setRefError] = useState<string[]>([]);
  const [copyMessage, setCopyMessage] = useState("");
  const [showOutline, setShowOutline] = useState(false);

  const outline = useMemo(() => buildResearchOutline(research), [research]);
  const outlineText = useMemo(
    () => [
      `# ${outline.title}`,
      ...outline.sections.flatMap((section) => [
        `## ${section.title}`,
        section.draft,
        `إرشاد: ${section.guidance}`,
      ]),
      "## فحص ذاتي", ...outline.checks.map((item) => `- ${item}`),
      "## المراجع المدخلة يدويًا", ...references.map((item) => `- ${item}`),
    ].join("\n\n"),
    [outline, references]
  );

  async function copyOutline() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(outlineText);
      setCopyMessage("نُسخت المسودة؛ راجع المحتوى والحقائق قبل الاستخدام.");
    } catch {
      setCopyMessage("تعذّر النسخ تلقائيًا. يمكنك تحديد النص من المسودة ونسخه يدويًا.");
    }
  }

  function addReference() {
    const formatted = formatReferenceDraft(reference);
    setRefError(formatted.errors);
    if (formatted.errors.length) return;
    setReferences((current) => current.includes(formatted.text) ? current : [...current, formatted.text]);
    setReference(blankReference);
    setCopyMessage("");
  }

  return (
    <main dir="rtl" className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-7">
        <header className="rounded-[2.5rem] border border-[#cdb778] bg-[#123f39] p-7 text-white shadow-xl sm:p-10">
          <p className="text-sm font-black text-[#ffe4a9]">ضاديوم — بيت اللغة العربية · المرحلة الجامعية</p>
          <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">أكاديمية البحث والكتابة الأكاديمية</h1>
          <p className="mt-4 max-w-3xl text-lg leading-9 text-[#e7f3ed]">
            ابدأ بسؤال واضح، ونظّم أفكارك، وتعلّم خطوات البحث العلمي والتوثيق بالعربية.
            تساعدك الأكاديمية على إنجاز عملك بنفسك، دون اختلاق مراجع أو نتائج.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a className="rounded-full bg-[#f5d18b] px-5 py-3 text-sm font-black text-[#123f39]" href="#research-plan">ابدأ مسودة الخطة</a>
            <a className="rounded-full border border-white/40 px-5 py-3 text-sm font-black text-white" href="#references">تدرّب على التوثيق</a>
            <Link className="rounded-full border border-white/40 px-5 py-3 text-sm font-black text-white" href="/skills/writing">مهارات الكتابة</Link>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-3" aria-label="مهارات الأكاديمية">
          {[
            ["01", "بناء خطة بحث", "صياغة المشكلة والأسئلة والأهداف واختيار المنهج"],
            ["02", "الكتابة العلمية", "تحويل الأفكار إلى فقرات واضحة مدعومة بالأدلة"],
            ["03", "توثيق أمين", "التدرّب على إدراج مصادر حقيقية فقط والتحقق منها"],
          ].map(([number, title, details]) => (
            <div className={cardClass} key={number}>
              <div className="text-2xl font-black text-[#ad7f2d]">{number}</div>
              <h2 className="mt-2 font-black text-[#123f39]">{title}</h2>
              <p className="mt-2 text-sm leading-7 text-[#675f54]">{details}</p>
            </div>
          ))}
        </section>

        <section id="research-plan" className={cardClass}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className={headingClass}>ورشة إعداد خطة البحث</h2>
              <p className="mt-2 text-sm leading-7 text-[#675f54]">أدخل ما تعرفه، ثم أنشئ هيكلًا إرشاديًا يمكنك مراجعته وتطويره. الحقول لا تُحفظ على خادم الأكاديمية.</p>
            </div>
            <span className="rounded-full bg-[#e8f5ef] px-4 py-2 text-xs font-black text-[#18594b]">تدريب مجاني · دون حفظ بيانات</span>
          </div>

          <form className="mt-6 space-y-5" onSubmit={(event) => { event.preventDefault(); setShowOutline(true); setCopyMessage(""); }}>
            <div className="grid gap-5 md:grid-cols-2">
              {textFields.map((field) => (
                <div className={field.key === "problem" || field.key === "questions" ? "md:col-span-2" : ""} key={field.key}>
                  <label className="block text-sm font-black text-[#123f39]" htmlFor={`research-${field.key}`}>{field.title}</label>
                  {field.multiple ? (
                    <textarea
                      className={fieldClass}
                      rows={3}
                      id={`research-${field.key}`}
                      placeholder={field.placeholder}
                      maxLength={3000}
                      value={research[field.key]}
                      onChange={(event) => { setResearch((prev) => ({ ...prev, [field.key]: event.target.value })); setShowOutline(false); }}
                    />
                  ) : (
                    <input
                      className={fieldClass}
                      id={`research-${field.key}`}
                      placeholder={field.placeholder}
                      maxLength={500}
                      value={research[field.key]}
                      onChange={(event) => { setResearch((prev) => ({ ...prev, [field.key]: event.target.value })); setShowOutline(false); }}
                    />
                  )}
                </div>
              ))}
              <div>
                <label className="block text-sm font-black text-[#123f39]" htmlFor="research-method">المنهج الذي تفكر فيه</label>
                <select
                  id="research-method"
                  className={fieldClass}
                  value={research.method}
                  onChange={(event) => { setResearch((prev) => ({ ...prev, method: event.target.value as ResearchMethod })); setShowOutline(false); }}
                >
                  {(Object.keys(methodLabels) as ResearchMethod[]).map((method) =>
                    <option value={method} key={method}>{methodLabels[method]}</option>
                  )}
                </select>
              </div>
            </div>
            <button className="rounded-2xl bg-[#123f39] px-6 py-3.5 font-black text-white transition hover:bg-[#1e6257] disabled:opacity-50" type="submit" disabled={!research.topic.trim()}>
              أنشئ مسودة الهيكل
            </button>
            {!research.topic.trim() ? <span className="mr-3 text-sm text-[#6e5b45]">أدخل عنوان البحث أولًا.</span> : null}
          </form>
        </section>

        {showOutline ? (
          <section className={cardClass} aria-live="polite" aria-label="مسودة هيكل البحث">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className={headingClass}>مسودة الخطة: {outline.title}</h2>
              <button className="rounded-full bg-[#123f39] px-5 py-2.5 text-sm font-black text-white" type="button" onClick={copyOutline}>نسخ المسودة</button>
            </div>
            {copyMessage ? <p role="status" className="mt-3 text-sm font-bold text-[#18594b]">{copyMessage}</p> : null}
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {outline.sections.map((section) => (
                <article className="rounded-2xl border border-[#e8ddc8] bg-white p-4" key={section.title}>
                  <h3 className="font-black text-[#123f39]">{section.title}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-base leading-8 text-[#283c35]">{section.draft}</p>
                  <p className="mt-3 border-t border-[#ece4d6] pt-2 text-sm leading-7 text-[#766a56]">{section.guidance}</p>
                </article>
              ))}
            </div>
            <h3 className="mt-7 font-black text-[#123f39]">قائمة التحقق قبل تسليم البحث</h3>
            <ul className="mt-3 space-y-2">
              {outline.checks.map((check) => <li className="text-sm leading-7 text-[#4d5e54]" key={check}>✓ {check}</li>)}
            </ul>
          </section>
        ) : null}

        <section id="references" className={cardClass}>
          <h2 className={headingClass}>ورشة التوثيق والمراجع</h2>
          <p className="mt-2 text-sm leading-7 text-[#675f54]">
            أدخل بيانات مصدر قرأته وتحققت من نشره بنفسك. الصياغة هنا أولية للتدريب، وليست تدقيقًا شاملًا لنمط APA 7؛ اتبع دليل جامعتك عند التسليم.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="reference-type" className="text-sm font-black text-[#123f39]">نوع المصدر</label>
              <select id="reference-type" className={fieldClass} value={reference.type}
                onChange={(event) => setReference((prev) => ({ ...prev, type: event.target.value as SourceType }))}>
                <option value="article">مقال علمي</option>
                <option value="book">كتاب</option>
                <option value="web">صفحة إلكترونية</option>
              </select>
            </div>
            {([
              ["author", "اسم المؤلف أو المؤسسة", "اسم حقيقي كما يظهر في المصدر"],
              ["year", "سنة النشر", "2023"],
              ["title", "عنوان المصدر", "العنوان كما هو منشور"],
              ["publisher", "المجلة / الناشر / الجهة", "اسم الجهة"],
              ["url", "رابط المصدر (اختياري)", "https://..."],
            ] as const).map(([key, label, placeholder]) => (
              <div key={key} className={key === "title" || key === "url" ? "md:col-span-2" : ""}>
                <label htmlFor={`reference-${key}`} className="text-sm font-black text-[#123f39]">{label}</label>
                <input id={`reference-${key}`} className={fieldClass} value={reference[key]} placeholder={placeholder}
                  maxLength={key === "url" ? 1000 : 500}
                  onChange={(event) => { setReference((prev) => ({ ...prev, [key]: event.target.value })); setRefError([]); }} />
              </div>
            ))}
          </div>
          {refError.length ? (
            <ul role="alert" className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              {refError.map((err) => <li key={err}>{err}</li>)}
            </ul>
          ) : null}
          <button type="button" className="mt-5 rounded-2xl bg-[#123f39] px-6 py-3.5 font-black text-white" onClick={addReference}>
            أضف مصدرًا تحققت منه
          </button>
          <div className="mt-6 rounded-2xl border border-[#e8ddc8] bg-white p-4">
            <h3 className="font-black text-[#123f39]">قائمة المراجع المدخلة</h3>
            {references.length ? (
              <ol className="mt-3 space-y-3">
                {references.map((item, index) => (
                  <li className="flex flex-wrap items-start justify-between gap-3 text-sm leading-8" key={item}>
                    <span className="min-w-0 flex-1 break-words">{index + 1}. {item}</span>
                    <button className="text-rose-700 underline" type="button" aria-label={`حذف المرجع ${index + 1}`}
                      onClick={() => setReferences((current) => current.filter((ref) => ref !== item))}>حذف</button>
                  </li>
                ))}
              </ol>
            ) : <p className="mt-3 text-sm text-[#6e675e]">لا توجد مراجع بعد. لن ينشئ ضاديوم أي مراجع وهمية.</p>}
          </div>
        </section>

        <aside className="rounded-[1.8rem] border border-[#d6b773] bg-[#fff6de] p-5 text-sm leading-8 text-[#594d37]">
          <strong>الأمانة العلمية أولًا:</strong> هذه مساحة تعليمية لتنظيم التفكير والتوثيق المبدئي؛ لا تبحث تلقائيًا في قواعد البيانات العلمية، ولا تفحص الانتحال أو تنفّذ بحوثًا بدلًا من صاحبها. تحقّق من المصادر والموافقات والنتائج قبل استخدامها في عمل أكاديمي.
        </aside>
      </div>
    </main>
  );
}
