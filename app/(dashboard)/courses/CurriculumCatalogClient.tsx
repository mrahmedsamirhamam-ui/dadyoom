
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { UnitCatalog } from "@/services/lessons/catalog";

const difficultyLabels = { beginner: "تمهيدي", intermediate: "متوسط", advanced: "متقدم" } as const;
type Props = { units: UnitCatalog[] };

function uniqueById<T extends { id: string }>(items: T[]) { return Array.from(new Map(items.map((item) => [item.id, item])).values()); }
function stageName(gradeNumber: number | null) {
  const value = Number(gradeNumber ?? 0);
  if (value >= 1 && value <= 6) return "المرحلة الابتدائية";
  if (value >= 7 && value <= 9) return "المرحلة الإعدادية";
  if (value >= 10 && value <= 13) return "المرحلة الثانوية";
  return "المرحلة الدراسية";
}
function semesterName(curriculumName: string) {
  if (/الفصل\s*الأول|semester\s*1/i.test(curriculumName)) return "الفصل الأول";
  if (/الفصل\s*الثاني|semester\s*2/i.test(curriculumName)) return "الفصل الثاني";
  if (/الفصل\s*الثالث|semester\s*3/i.test(curriculumName)) return "الفصل الثالث";
  return "الفصل الدراسي";
}

export default function CurriculumCatalogClient({ units }: Props) {
  const [countryId, setCountryId] = useState("");
  const [year, setYear] = useState("");
  const [curriculumId, setCurriculumId] = useState("");
  const [gradeId, setGradeId] = useState("");
  const [unitId, setUnitId] = useState("");

  const countries = useMemo(() => uniqueById(units.map((unit) => unit.country)).sort((a, b) => a.name.localeCompare(b.name, "ar")), [units]);
  const selectedCountryId = countryId || countries[0]?.id || "";
  const years = useMemo(() => Array.from(new Set(units.filter((unit) => unit.country.id === selectedCountryId).map((unit) => unit.curriculum.academicYear).filter((item): item is string => Boolean(item)))).sort((a, b) => b.localeCompare(a, "ar")), [units, selectedCountryId]);
  const selectedYear = year || years[0] || "";
  const curricula = useMemo(() => uniqueById(units.filter((unit) => unit.country.id === selectedCountryId && (!selectedYear || unit.curriculum.academicYear === selectedYear)).map((unit) => unit.curriculum)).sort((a, b) => a.name.localeCompare(b.name, "ar")), [units, selectedCountryId, selectedYear]);
  const selectedCurriculumId = curriculumId || curricula[0]?.id || "";
  const grades = useMemo(() => uniqueById(units.filter((unit) => unit.country.id === selectedCountryId && (!selectedYear || unit.curriculum.academicYear === selectedYear) && unit.curriculum.id === selectedCurriculumId).map((unit) => unit.grade)).sort((a, b) => Number(a.number ?? 999) - Number(b.number ?? 999)), [units, selectedCountryId, selectedYear, selectedCurriculumId]);
  const selectedGradeId = gradeId || grades[0]?.id || "";
  const gradeUnits = useMemo(() => units.filter((unit) => unit.country.id === selectedCountryId && (!selectedYear || unit.curriculum.academicYear === selectedYear) && unit.curriculum.id === selectedCurriculumId && unit.grade.id === selectedGradeId).sort((a, b) => a.order - b.order), [units, selectedCountryId, selectedYear, selectedCurriculumId, selectedGradeId]);
  const visibleUnits = useMemo(() => unitId ? gradeUnits.filter((unit) => unit.id === unitId) : gradeUnits, [gradeUnits, unitId]);
  const totalLessons = visibleUnits.reduce((sum, unit) => sum + unit.lessons.length, 0);
  const completedLessons = visibleUnits.reduce((sum, unit) => sum + unit.lessons.filter((lesson) => lesson.completed).length, 0);
  const activeCountry = countries.find((item) => item.id === selectedCountryId);
  const activeCurriculum = curricula.find((item) => item.id === selectedCurriculumId);
  const activeGrade = grades.find((item) => item.id === selectedGradeId);

  return (
    <main dir="rtl" className="min-h-screen px-4 py-7 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">
        <section className="relative overflow-hidden rounded-[2.4rem] border border-[#c9b47c] bg-[#123f39] p-7 text-white shadow-xl sm:p-10">
          <div aria-hidden="true" className="absolute inset-0 opacity-20 dad-arabesque" />
          <div className="relative grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
            <div><div className="inline-flex rounded-full border border-[#f5cf7a]/35 bg-white/10 px-4 py-2 text-xs font-black text-[#ffe7ae]">بوابة المناهج العربية</div><h1 className="mt-4 font-arabic-display text-3xl font-black sm:text-5xl">من الدولة إلى الدرس — والمحتوى جاهز</h1><p className="mt-4 max-w-3xl font-arabic-reading text-xl leading-9 text-[#e9f3ef]">كل منهج حزمة بيانات موثقة: سنة، مرحلة، صف، فصل، مادة، وحدات ودروس. إضافة دولة جديدة لا تتطلب إعادة برمجة المنصة.</p></div>
            <div className="grid grid-cols-3 gap-2 text-center"><Metric value={String(visibleUnits.length)} label="وحدات" /><Metric value={String(totalLessons)} label="دروس" /><Metric value={String(completedLessons)} label="مكتملة" /></div>
          </div>
        </section>

        {units.length === 0 ? <section className="rounded-[2rem] border border-dashed border-[#ceb98b] bg-[#fffdf7] p-10 text-center"><div className="text-5xl">📚</div><h2 className="mt-4 text-2xl font-black text-[#123f39]">لا توجد حزمة منهج منشورة بعد</h2><p className="mt-2 text-[#766c60]">الحزم لا تظهر للطالب إلا بعد التحقق من المصدر والمحتوى.</p></section> : <>
          <section className="arabic-panel rounded-[2rem] border border-[#dfcfad] p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><div className="text-xs font-black text-[#9b7128]">المسار الدراسي</div><h2 className="mt-1 font-arabic-display text-xl font-black text-[#123f39]">{activeCountry?.name ?? "الدولة"} ← {selectedYear || "السنة"} ← {stageName(activeGrade?.number ?? null)} ← {activeGrade?.name ?? "الصف"} ← {semesterName(activeCurriculum?.name ?? "")} ← اللغة العربية</h2></div><span className="rounded-full bg-[#eef4f0] px-4 py-2 text-xs font-black text-[#174f47]">الدروس الأساسية جاهزة، والمعلم يضيف الإثراء</span></div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <SelectBox label="الدولة" value={selectedCountryId} onChange={(value) => { setCountryId(value); setYear(""); setCurriculumId(""); setGradeId(""); setUnitId(""); }} options={countries.map((item) => ({ value: item.id, label: item.name }))} />
              <SelectBox label="السنة الدراسية" value={selectedYear} onChange={(value) => { setYear(value); setCurriculumId(""); setGradeId(""); setUnitId(""); }} options={years.map((item) => ({ value: item, label: item }))} />
              <SelectBox label="المنهج / الفصل" value={selectedCurriculumId} onChange={(value) => { setCurriculumId(value); setGradeId(""); setUnitId(""); }} options={curricula.map((item) => ({ value: item.id, label: item.name }))} />
              <SelectBox label="الصف" value={selectedGradeId} onChange={(value) => { setGradeId(value); setUnitId(""); }} options={grades.map((item) => ({ value: item.id, label: item.name }))} />
              <SelectBox label="الوحدة" value={unitId} onChange={setUnitId} options={[{ value: "", label: "كل الوحدات" }, ...gradeUnits.map((item) => ({ value: item.id, label: item.title }))]} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-black"><span className="rounded-full border border-[#d7c49a] bg-[#fffaf0] px-3 py-2 text-[#7a5a20]">المرحلة: {stageName(activeGrade?.number ?? null)}</span><span className="rounded-full border border-[#d7c49a] bg-[#fffaf0] px-3 py-2 text-[#7a5a20]">المادة: اللغة العربية</span><span className="rounded-full border border-[#d7c49a] bg-[#fffaf0] px-3 py-2 text-[#7a5a20]">{semesterName(activeCurriculum?.name ?? "")}</span></div>
          </section>

          <section className="space-y-6">{visibleUnits.map((unit, unitIndex) => <article key={unit.id} className="overflow-hidden rounded-[2rem] border border-[#dfcfad] bg-[#fffdf8] shadow-sm"><div className="flex flex-col gap-4 border-b border-[#eadfc9] bg-gradient-to-l from-[#f7eedc] to-[#fffdf7] p-6 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#123f39] text-xl font-black text-[#f5cf7a] shadow-sm">{unitIndex + 1}</div><div><p className="text-xs font-black text-[#9a702a]">{unit.country.name} • {unit.grade.name}</p><h2 className="mt-1 font-arabic-display text-2xl font-black text-[#123f39]">{unit.title}</h2>{unit.description ? <p className="mt-2 max-w-3xl text-sm leading-7 text-[#766c60]">{unit.description}</p> : null}</div></div><div className="rounded-full border border-[#d9c69f] bg-white px-4 py-2 text-sm font-black text-[#6d5b38]">{unit.lessons.length} دروس</div></div><div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">{unit.lessons.map((lesson) => <Link key={lesson.id} href={`/lessons/${lesson.id}`} className="group relative overflow-hidden rounded-2xl border border-[#e5d8bf] bg-white p-5 transition hover:-translate-y-1 hover:border-[#b79552] hover:shadow-lg"><div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-[#174f47] via-[#4f8b7f] to-[#d6ad57] opacity-0 transition group-hover:opacity-100" /><div className="flex items-center justify-between gap-3"><div className={`grid h-11 w-11 place-items-center rounded-xl font-black ${lesson.completed ? "bg-[#e6f3ec] text-[#18764f]" : "bg-[#f5ecd8] text-[#8a6426]"}`}>{lesson.completed ? "✓" : lesson.order}</div><span className="rounded-full bg-[#f6f0e5] px-3 py-1 text-[11px] font-black text-[#776b5c]">{difficultyLabels[lesson.difficulty]}</span></div><h3 className="mt-4 font-arabic-display text-lg font-black leading-8 text-[#2c3935] group-hover:text-[#123f39]">{lesson.title}</h3><p className="mt-2 line-clamp-2 font-arabic-reading text-base leading-7 text-[#766c60]">{lesson.objective ?? "درس عربي تفاعلي ضمن مسارك الدراسي."}</p><div className="mt-5 flex items-center justify-between border-t border-[#eee5d5] pt-4 text-xs font-black text-[#887d70]"><span>⏱ {lesson.estimatedMinutes} دقيقة</span><span>✦ {lesson.points} نقطة</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f1eadc]"><div className="h-full rounded-full bg-[#174f47]" style={{ width: `${lesson.completed ? 100 : lesson.progressPercent}%` }} /></div></Link>)}</div></article>)}</section>
        </>}
      </div>
    </main>
  );
}

function Metric({ value, label }: { value: string; label: string }) { return <div className="min-w-[76px] rounded-2xl border border-white/10 bg-white/10 px-3 py-3 backdrop-blur"><div className="text-xl font-black text-[#f5cf7a]">{value}</div><div className="mt-1 text-[10px] font-bold text-[#e6f1ed]">{label}</div></div>; }
function SelectBox({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) { return <label className="block"><span className="mb-2 block text-xs font-black text-[#6b5e4b]">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-[#dac9a7] bg-[#fffdf8] px-4 py-3 font-black text-[#302d27] outline-none transition focus:border-[#4d877b] focus:ring-4 focus:ring-[#174f47]/10">{options.map((option) => <option key={option.value || `${label}-all`} value={option.value}>{option.label}</option>)}</select></label>; }
