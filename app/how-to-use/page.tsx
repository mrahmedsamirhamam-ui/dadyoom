"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Baby,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  HeartHandshake,
  HelpCircle,
  School,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

type GuideStep = {
  title: string;
  explanation: string;
  preview: string[];
  href: string;
  cta: string;
};

type GuideJourney = {
  id: string;
  title: string;
  summary: string;
  icon: LucideIcon;
  steps: GuideStep[];
};

const journeys: GuideJourney[] = [
  {
    id: "student", title: "الطالب", summary: "ابدأ من منهجك وواصل التعلّم خطوة بخطوة.", icon: GraduationCap,
    steps: [
      { title: "أنشئ حساب الطالب", explanation: "اضغط «ابدأ مجانًا»، واكتب الاسم والبريد وكلمة المرور، واختر «طالب» ودولتك. قد يُطلب تأكيد البريد الإلكتروني.", preview: ["ابدأ مجانًا", "نوع الحساب: طالب", "اختر الدولة"], href: "/signup?role=student", cta: "أنشئ حسابًا" },
      { title: "افتح بوابة المناهج", explanation: "انتقل إلى «استكشف الدروس». ستجد خيارات الدولة والسنة الدراسية والصف والمنهج أو المسار والوحدة.", preview: ["الدولة", "السنة الدراسية", "الصف", "المنهج"], href: "/courses", cta: "تصفح الدروس" },
      { title: "اختر الدرس المتاح", explanation: "حدّد صفك ومسارك ثم الوحدة والدرس المنشور، واقرأ الشرح وأكمل التدريب الموجود في الدرس.", preview: ["وحدات المنهج", "الدروس المنشورة", "افتح الدرس"], href: "/courses", cta: "اختر درسك" },
      { title: "تدرّب واسأل ضاد", explanation: "جرّب أنشطة القراءة والكتابة والاستماع والتحدث، واستخدم «اسأل ضاد» إذا احتجت إلى شرح أو تلميح.", preview: ["القراءة والكتابة", "الاستماع والتحدث", "اسأل ضاد"], href: "/ask", cta: "اسأل ضاد" },
    ],
  },
  {
    id: "child", title: "الطفل", summary: "خطوات بسيطة تناسب المتعلم الصغير.", icon: Baby,
    steps: [
      { title: "ابدأ بحساب الطفل", explanation: "اختر «طفل» عند إنشاء الحساب وأكمل البيانات المطلوبة بمساعدة ولي الأمر.", preview: ["حساب جديد", "نوع الحساب: طفل", "ابدأ رحلتي"], href: "/signup?role=child", cta: "ابدأ التسجيل" },
      { title: "ادخل إلى مساحة الطفل", explanation: "بعد تسجيل الدخول، افتح مساحة الطفل الخاصة بك واستكشف الأنشطة التي تظهر لك.", preview: ["مرحبًا بك", "مساحة الطفل", "أنشطة التعلم"], href: "/child", cta: "مساحة الطفل" },
      { title: "تعلّم مع شخص بالغ", explanation: "اختر نشاطًا مناسبًا لمستواك مع ولي أمرك أو معلمك. أعد التدريب عندما تحتاج، ولا تشارك معلوماتك الشخصية.", preview: ["اختر نشاطًا", "تعلّم", "جرّب مرة أخرى"], href: "/courses", cta: "استكشف الدروس" },
    ],
  },
  {
    id: "teacher", title: "المعلم", summary: "نظّم فصولك وساعد طلابك على التقدّم.", icon: BookOpen,
    steps: [
      { title: "سجّل حساب معلم", explanation: "أكمل التسجيل واختر «معلم»، ثم انتقل إلى لوحة المعلم بعد تسجيل الدخول.", preview: ["نوع الحساب: معلم", "لوحة المعلم"], href: "/signup?role=teacher", cta: "أنشئ حسابك" },
      { title: "أنشئ فصلًا دراسيًا", explanation: "من لوحة المعلم، اكتب اسم الفصل والعام الدراسي، ويمكنك إضافة وصف اختياري ثم إنشاء الفصل.", preview: ["اسم الفصل", "العام الدراسي", "إنشاء الفصل"], href: "/teacher", cta: "لوحة المعلم" },
      { title: "شارك كود الانضمام", explanation: "بعد إنشاء الفصل، استخدم كود الفصل الذي تولّده المنصة، وشاركه مع طلاب الفصل فقط.", preview: ["فصولي", "كود الانضمام", "مشاركة الكود"], href: "/teacher", cta: "افتح فصولي" },
      { title: "تابع الطلاب والدروس", explanation: "يمكنك استعراض فصولك والطلاب المرتبطين والمحتوى المتاح من لوحة المعلم.", preview: ["الفصول", "الطلاب", "الدروس"], href: "/teacher", cta: "متابعة الفصول" },
    ],
  },
  {
    id: "parent", title: "ولي الأمر", summary: "شارك أبناءك رحلة التعلّم وراقب تقدّمهم.", icon: HeartHandshake,
    steps: [
      { title: "سجّل بصفة ولي أمر", explanation: "اختر «ولي أمر» عند إنشاء الحساب، ثم سجّل الدخول إلى لوحتك.", preview: ["نوع الحساب: ولي أمر", "لوحة ولي الأمر"], href: "/signup?role=parent", cta: "سجّل الآن" },
      { title: "اربط حساب الطالب", explanation: "استخدم أداة ربط الأبناء في لوحة ولي الأمر، واتبع خطوات الربط الآمن الظاهرة أمامك.", preview: ["ربط حساب طالب", "رمز الربط", "تأكيد"], href: "/parent", cta: "اربط حساب ابنك" },
      { title: "تابع التقدم الدراسي", explanation: "بعد نجاح الربط، اطلع على الدروس المكتملة ومتوسط الدرجات ومستوى الإتقان والنقاط المتاحة.", preview: ["الدروس المكتملة", "مستوى الإتقان", "متوسط الدرجات"], href: "/parent", cta: "لوحة ولي الأمر" },
    ],
  },
  {
    id: "school", title: "المدرسة", summary: "متابعة المعلمين والفصول ومؤشرات الأداء.", icon: School,
    steps: [
      { title: "أنشئ حساب المدرسة", explanation: "اختر «مدرسة» أثناء التسجيل، وأكمل البيانات المطلوبة للانتقال إلى لوحة المدرسة.", preview: ["نوع الحساب: مدرسة", "لوحة المدرسة"], href: "/signup?role=school", cta: "إنشاء حساب" },
      { title: "اربط المعلمين", explanation: "استخدم أدوات ربط المدرسة بالمعلمين، واتبع خطوات التحقق المتاحة في لوحتك.", preview: ["المعلمون", "ربط المعلم", "الفصول"], href: "/school", cta: "لوحة المدرسة" },
      { title: "راجع مؤشرات الأداء", explanation: "تابع إحصاءات المعلمين والفصول والطلاب ومؤشرات التعلّم المتوفرة في الحساب.", preview: ["المعلمون والطلاب", "الفصول", "مؤشرات الأداء"], href: "/school", cta: "متابعة المدرسة" },
    ],
  },
];

export default function HowToUsePage() {
  const [roleId, setRoleId] = useState("student");
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const selectRoleFromHash = () => {
      const candidate = window.location.hash.slice(1).toLowerCase();
      if (journeys.some((item) => item.id === candidate)) {
        setRoleId(candidate);
        setStepIndex(0);
      }
    };
    selectRoleFromHash();
    window.addEventListener("hashchange", selectRoleFromHash);
    return () => window.removeEventListener("hashchange", selectRoleFromHash);
  }, []);
  const journey = journeys.find((item) => item.id === roleId) ?? journeys[0];
  const step = journey.steps[stepIndex] ?? journey.steps[0];
  const JourneyIcon = journey.icon;
  const progress = ((stepIndex + 1) / journey.steps.length) * 100;

  return (
    <main dir="rtl" className="min-h-screen bg-[#fffaf0] text-[#273c36]">
      <header className="border-b border-[#e5d8bf] bg-[#fffef9]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="text-2xl font-black text-[#174f47]">ضاديوم <span className="text-sm text-[#a8782f]">Dadyoom</span></Link>
          <div className="flex items-center gap-2 text-sm font-bold">
            <Link href="/courses" className="rounded-xl px-3 py-2 hover:bg-[#edf5f1]">الدروس</Link>
            <Link href="/portal" className="rounded-xl px-3 py-2 hover:bg-[#edf5f1]">بوابة الوصول</Link>
            <Link href="/login" className="rounded-xl px-3 py-2 hover:bg-[#edf5f1]">تسجيل الدخول</Link>
            <Link href="/signup" className="rounded-xl bg-[#174f47] px-4 py-2 text-white hover:bg-[#103f39]">ابدأ مجانًا</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6">
        <section className="rounded-[2rem] bg-[#123f39] px-5 py-10 text-center text-white sm:px-10">
          <div className="mx-auto mb-4 flex w-fit items-center gap-2 rounded-full border border-[#799d8d] bg-white/10 px-4 py-2 text-sm font-bold text-[#ffe7ae]">
            <HelpCircle size={18} aria-hidden="true" /> دليل تفاعلي للمستخدمين
          </div>
          <h1 className="font-arabic-display text-3xl font-black sm:text-5xl">كيف تستخدم ضاديوم؟</h1>
          <p className="mx-auto mt-4 max-w-2xl font-arabic-reading text-lg leading-9 text-[#e0eee7]">
            اختر نوع حسابك وتعرّف على الخطوات بالترتيب، مع رسومات توضيحية وروابط تفتح لك الصفحة المناسبة مباشرة.
          </p>
        </section>

        <section className="mt-8" aria-label="اختر نوع المستخدم">
          <h2 className="mb-3 text-xl font-black">أنا أستخدم ضاديوم بصفتي:</h2>
          <div role="tablist" aria-label="نوع المستخدم" className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {journeys.map((item) => {
              const Icon = item.icon;
              const active = item.id === roleId;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  id={`guide-tab-${item.id}`}
                  aria-selected={active}
                  aria-controls="guide-panel"
                  onClick={() => { setRoleId(item.id); setStepIndex(0); window.history.replaceState(null, "", "#" + item.id); }}
                  className={`flex min-h-20 items-center justify-center gap-2 rounded-2xl border px-3 py-3 font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a8782f] ${active ? "border-[#174f47] bg-[#174f47] text-white shadow-md" : "border-[#e1d7c6] bg-white text-[#31534c] hover:border-[#7fa79d]"}`}
                >
                  <Icon size={23} aria-hidden="true" /> {item.title}
                </button>
              );
            })}
          </div>
        </section>

        <section id="guide-panel" role="tabpanel" aria-labelledby={`guide-tab-${roleId}`} className="mt-6 overflow-hidden rounded-[2rem] border border-[#e4d8bf] bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e6e1d6] px-5 py-5 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#e7f3ed] text-[#174f47]"><JourneyIcon aria-hidden="true" /></div>
              <div><h2 className="text-xl font-black">{itemLabel(journey.title)}</h2><p className="text-sm text-[#64756d]">{journey.summary}</p></div>
            </div>
            <span className="rounded-full bg-[#f6eedc] px-4 py-2 text-sm font-black text-[#80602a]">الخطوة {stepIndex + 1} من {journey.steps.length}</span>
          </div>

          <div className="h-2 bg-[#e7ebe5]" aria-label="تقدّم الدليل">
            <div className="h-2 bg-[#cda251] transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>

          <div className="grid items-center gap-8 px-5 py-8 md:grid-cols-2 md:px-10">
            <div aria-live="polite" className="space-y-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#174f47] text-xl font-black text-white">{stepIndex + 1}</div>
              <h3 className="font-arabic-display text-2xl font-black text-[#153c35] sm:text-3xl">{step.title}</h3>
              <p className="font-arabic-reading text-lg leading-9 text-[#52675e]">{step.explanation}</p>
              <Link href={step.href} className="inline-flex items-center gap-2 rounded-xl bg-[#174f47] px-5 py-3 font-black text-white hover:bg-[#103f39]">
                {step.cta} <ChevronLeft size={18} aria-hidden="true" />
              </Link>
            </div>

            <div className="mx-auto w-full max-w-sm rounded-[2.5rem] border-[9px] border-[#174f47] bg-[#fffdf9] p-4 shadow-xl" aria-label="رسم توضيحي للخطوة">
              <div className="mx-auto mb-4 h-2 w-24 rounded-full bg-[#174f47]" />
              <div className="rounded-2xl bg-[#174f47] px-5 py-5 text-white">
                <p className="text-xs font-bold text-[#dce8df]">رسم توضيحي، وليس صورة من الموقع</p>
                <p className="mt-2 text-xl font-black">ضاديوم — بيت العربية الرقمي</p>
              </div>
              <div className="space-y-3 py-5">
                {step.preview.map((line, index) => (
                  <div key={line} className="flex min-h-14 items-center gap-3 rounded-xl border border-[#deeadf] bg-[#eef5ed] px-4 py-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-[#174f47]"><Check size={18} aria-hidden="true" /></span>
                    <span className="font-bold text-[#194c42]">{line}</span>
                    <span className="mr-auto text-xs text-[#738a7f]">{index + 1}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-[#d8b165] px-5 py-3 text-center font-black text-[#3d361f]">تابع رحلتك مع ضاديوم</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e6e1d6] px-5 py-5 sm:px-8">
            <button type="button" onClick={() => setStepIndex((i) => Math.max(0, i - 1))} disabled={stepIndex === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-[#dcd7ca] bg-white px-4 py-3 font-black disabled:cursor-not-allowed disabled:opacity-40">
              <ChevronRight size={18} aria-hidden="true" /> السابق
            </button>
            <div className="flex gap-2" aria-label="خطوات الدليل">
              {journey.steps.map((item, i) => (
                <button key={item.title} type="button" onClick={() => setStepIndex(i)} aria-label={`الانتقال إلى الخطوة ${i + 1}`} aria-current={i === stepIndex ? "step" : undefined}
                  className={`h-3 rounded-full transition-all ${i === stepIndex ? "w-9 bg-[#174f47]" : "w-3 bg-[#c7d4c9] hover:bg-[#71998b]"}`} />
              ))}
            </div>
            <button type="button" onClick={() => setStepIndex((i) => Math.min(journey.steps.length - 1, i + 1))} disabled={stepIndex === journey.steps.length - 1}
              className="inline-flex items-center gap-2 rounded-xl bg-[#174f47] px-4 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-40">
              التالي <ChevronLeft size={18} aria-hidden="true" />
            </button>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-[#e4d8bf] bg-[#fffdf8] p-6 sm:p-8">
          <h2 className="flex items-center gap-2 text-xl font-black"><Sparkles size={22} aria-hidden="true" /> قبل أن تبدأ</h2>
          <p className="mt-3 font-arabic-reading leading-8 text-[#617167]">
            صُممت بنية ضاديوم لمناهج الدول العربية الـ22، لكن الدروس المنشورة تتوسع تدريجيًا، لذلك قد لا تجد منهجك أو درسك بعد. بعض الوظائف قد تختلف باختلاف حسابك أو تحديثات المنصة. إذا طلب الموقع تأكيد بريدك الإلكتروني، أكمل التفعيل قبل الدخول.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/signup" className="rounded-xl bg-[#174f47] px-5 py-3 font-black text-white">ابدأ مجانًا</Link>
            <Link href="/courses" className="rounded-xl border border-[#b6c6ba] px-5 py-3 font-black text-[#174f47]">تصفح المناهج</Link>
            <Link href="/ask" className="rounded-xl border border-[#b6c6ba] px-5 py-3 font-black text-[#174f47]">اسأل ضاد</Link>
          </div>
        </section>
        <p className="mt-9 text-center font-arabic-reading text-lg font-bold text-[#174f47]">اللغة العربية أسهل في ضاديوم، وضاديوم تزرع حب اللغة العربية في قلب الطالب.</p>
      </div>
    </main>
  );
}

function itemLabel(title: string) {
  return `دليل ${title}`;
}
