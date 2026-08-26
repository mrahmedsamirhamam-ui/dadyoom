import Link from "next/link";

import { getDashboardStats } from "@/lib/admin/dashboard";

const destinations = [
  {
    title: "بوابة المناهج",
    href: "/admin/curriculum",
    icon: "🗺️",
    text: "تابع الدول والمناهج والصفوف والوحدات من المصدر القياسي.",
  },
  {
    title: "مكتبة الدروس",
    href: "/admin/lessons",
    icon: "📚",
    text: "راجع الدروس المنشورة وأثرِ المحتوى الموجود بدل بناء المنهج يدويًا.",
  },
  {
    title: "الطلاب",
    href: "/admin/students",
    icon: "🎓",
    text: "راجع حسابات الطلاب وحالتهم وتقدمهم داخل المنصة.",
  },
  {
    title: "المعلمون",
    href: "/admin/teachers",
    icon: "👩‍🏫",
    text: "راجع المعلمين وحساباتهم وربطهم بمنظومة ضاديوم.",
  },
  {
    title: "مساعد المحتوى",
    href: "/admin/ai-lesson",
    icon: "🤖",
    text: "استخدم الذكاء الاصطناعي كمساعد مراجعة وإثراء، لا كمصدر منهج.",
  },
  {
    title: "معاينة الطالب",
    href: "/courses",
    icon: "👁️",
    text: "شاهد بوابة المناهج كما يراها المستخدم قبل النشر.",
  },
];

function StatCard({
  title,
  value,
  note,
}: {
  title: string;
  value: number;
  note: string;
}) {
  return (
    <article className="rounded-[1.7rem] border border-[#dfcfad] bg-[#fffdf8] p-5 shadow-sm">
      <p className="text-xs font-black text-[#9a7028]">
        {title}
      </p>

      <div className="mt-2 font-arabic-display text-4xl font-black text-[#123f39]">
        {value}
      </div>

      <p className="mt-2 text-xs font-bold leading-6 text-[#7b7164]">
        {note}
      </p>
    </article>
  );
}

export default async function AdminPage() {
  const stats = await getDashboardStats();

  return (
    <main
      className="px-4 py-7 sm:px-6 lg:px-8"
      dir="rtl"
    >
      <div className="mx-auto max-w-7xl space-y-7">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-[#cdb778] bg-[#123f39] p-7 text-white shadow-xl sm:p-10">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-20 dad-arabesque"
          />

          <div className="relative grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <span className="inline-flex rounded-full border border-[#f3d18b]/30 bg-white/10 px-4 py-2 text-xs font-black text-[#ffe8b2]">
                مركز قيادة بيت العربية الرقمي
              </span>

              <h1 className="mt-4 font-arabic-display text-3xl font-black sm:text-5xl">
                إدارة ضاديوم
              </h1>

              <p className="mt-4 max-w-3xl font-arabic-reading text-xl leading-9 text-[#e7f1ed]">
                المنهج يأتي كحزمة موثقة، والطالب يجد دروسه جاهزة،
                والمعلم يضيف الإثراء. هذه اللوحة لمتابعة المنظومة
                وليست لإنشاء كل درس يدويًا من الصفر.
              </p>
            </div>

            <div className="rounded-[1.7rem] border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
              <div className="text-xs font-black text-[#ffe3a6]">
                الدروس المنشورة
              </div>
              <div className="mt-1 text-4xl font-black text-[#f5cf7a]">
                {stats.publishedLessons}
              </div>
              <div className="mt-1 text-xs font-bold text-[#e6f1ed]">
                من {stats.lessons} درس
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="الطلاب" value={stats.students} note="حسابات بدور طالب" />
          <StatCard title="المعلمون" value={stats.teachers} note="حسابات بدور معلم" />
          <StatCard title="إكمال الدروس" value={stats.completedLessons} note="سجلات مكتملة أو متقنة" />
          <StatCard title="محادثات ضاد" value={stats.chats} note="محادثات محفوظة في المنصة" />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {destinations.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-[1.8rem] border border-[#dfcfad] bg-[#fffdf8] p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#b9944e] hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-4xl">
                  {item.icon}
                </span>
                <span className="text-xl font-black text-[#b28a3f] transition group-hover:-translate-x-1">
                  ←
                </span>
              </div>

              <h2 className="mt-4 font-arabic-display text-2xl font-black text-[#123f39]">
                {item.title}
              </h2>

              <p className="mt-2 font-arabic-reading text-base leading-8 text-[#73695d]">
                {item.text}
              </p>
            </Link>
          ))}
        </section>

        <section className="arabic-panel rounded-[2rem] border border-[#dfcfad] p-6 shadow-sm">
          <div className="grid gap-5 lg:grid-cols-4">
            <SmallMetric label="أولياء الأمور" value={stats.parents} />
            <SmallMetric label="حسابات المدارس" value={stats.schools} />
            <SmallMetric label="إجمالي الدروس" value={stats.lessons} />
            <SmallMetric label="المنشور" value={stats.publishedLessons} />
          </div>
        </section>
      </div>
    </main>
  );
}

function SmallMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-[#e1d4bb] bg-[#fffdf8] p-4">
      <div className="text-xs font-black text-[#8a7960]">
        {label}
      </div>
      <div className="mt-2 text-2xl font-black text-[#123f39]">
        {value}
      </div>
    </div>
  );
}
