import Link from "next/link";
import {
  ArrowUpLeft, BookOpen, Bot, CheckCircle2, GraduationCap, Layers,
  LibraryBig, MessageCircle, School, Sparkles, Users, UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getDashboardStats } from "@/lib/admin/dashboard";

type Shortcut = { title: string; href: string; icon: LucideIcon; detail: string; category: string };
const shortcuts: Shortcut[] = [
  { title: "بوابة المناهج", href: "/admin/curriculum", icon: Layers, detail: "الدول والصفوف والوحدات والمناهج", category: "المناهج" },
  { title: "مكتبة الدروس", href: "/admin/lessons", icon: BookOpen, detail: "راجع الدروس والأنشطة المنشورة", category: "الدروس" },
  { title: "حزم المناهج", href: "/admin/curriculum/packs", icon: LibraryBig, detail: "الحزم والإصدارات ومصادر المحتوى", category: "المناهج" },
  { title: "الطلاب", href: "/admin/students", icon: GraduationCap, detail: "الحسابات وتقدم الطلاب", category: "المجتمع" },
  { title: "المعلمون", href: "/admin/teachers", icon: Users, detail: "إدارة حسابات المعلمين", category: "المجتمع" },
  { title: "مساعد المحتوى", href: "/admin/ai-lesson", icon: Bot, detail: "مراجعة المحتوى وإثراؤه بإشراف المعلم", category: "أدوات" },
];
function Metric({ title, value, detail, icon: Icon }: {
  title: string; value: number; detail: string; icon: LucideIcon;
}) {
  return (
    <article className="rounded-2xl border border-[#e0eae3] bg-white p-5 shadow-[0_3px_18px_rgba(18,63,57,.035)] transition hover:border-[#abd0bb]">
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#edf5f0] text-[#245e51]"><Icon size={21} aria-hidden="true" strokeWidth={1.8} /></div>
        <span className="text-xs text-[#6d8277]">{detail}</span>
      </div>
      <p className="mt-5 text-sm font-semibold text-[#526d60]">{title}</p>
      <p className="mt-1 text-3xl font-bold text-[#173f35] tabular-nums" dir="auto">{value.toLocaleString("en-US")}</p>
    </article>
  );
}

export default async function AdminPage() {
  const stats = await getDashboardStats();
  const publishingRate =
    stats.lessons > 0 ? Math.min(100, Math.round((stats.publishedLessons / stats.lessons) * 100)) : 0;
  const metrics: { title: string; value: number; detail: string; icon: LucideIcon }[] = [
    { title: "الدروس المنشورة", value: stats.publishedLessons, detail: "متاح للتعلم", icon: CheckCircle2 },
    { title: "إجمالي الدروس", value: stats.lessons, detail: "في المنظومة", icon: BookOpen },
    { title: "الطلاب", value: stats.students, detail: "حسابات", icon: GraduationCap },
    { title: "المعلمون", value: stats.teachers, detail: "حسابات", icon: Users },
    { title: "أولياء الأمور", value: stats.parents, detail: "حسابات", icon: UserRound },
    { title: "المدارس", value: stats.schools, detail: "حسابات", icon: School },
    { title: "الدروس المكتملة", value: stats.completedLessons, detail: "سجلات تقدم", icon: CheckCircle2 },
    { title: "محادثات ضاد", value: stats.chats, detail: "محادثات", icon: MessageCircle },
  ];
  return (
    <div dir="rtl" className="px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
      <div className="mx-auto max-w-[1200px] space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-[#6e8a7d]">لوحة الإدارة / نظرة عامة</p>
            <h1 className="mt-2 text-3xl font-bold text-[#173f35] sm:text-4xl">مرحبًا بك في ضاديوم</h1>
            <p className="mt-2 text-sm leading-7 text-[#647a6e]">مساحة مريحة لإدارة محتوى تعلّم العربية ومتابعة نمو المنصة.</p>
          </div>
          <Link href="/courses" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#c7ddd0] bg-white px-4 text-sm font-semibold text-[#174f47] transition hover:bg-[#edf5f0] focus-visible:outline-2 focus-visible:outline-[#174f47]">
            تجربة المتعلم <ArrowUpLeft size={16} aria-hidden="true" />
          </Link>
        </div>
        <section aria-label="حالة المناهج" className="relative overflow-hidden rounded-[1.7rem] bg-[#133f36] p-6 text-white shadow-[0_16px_36px_rgba(19,63,54,.14)] sm:p-8">
          <div aria-hidden="true" className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full border-[35px] border-white/5" />
          <div className="relative grid gap-8 md:grid-cols-[1fr_250px] md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-[#f3e5bc]">
                <Sparkles size={15} aria-hidden="true" /> رحلتنا لتعليم العربية
              </div>
              <h2 className="mt-5 text-2xl font-bold leading-[1.6] sm:text-3xl">محتوى متجدد وتجربة أفضل كل يوم</h2>
              <p className="mt-3 max-w-xl text-sm leading-8 text-[#d7e8df]">راجع الدروس المنشورة ثم المحتوى الذي يحتاج استكمالًا، حتى يصل الطالب إلى تعلم مترابط.</p>
              <Link href="/admin/lessons" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#f2cf87] px-5 text-sm font-bold text-[#173f35] transition hover:bg-[#ffe0a4] focus-visible:outline-2 focus-visible:outline-white">
                إدارة الدروس <ArrowUpLeft size={17} aria-hidden="true" />
              </Link>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-5">
              <p className="text-xs font-semibold text-[#d6e9df]">نسبة الدروس المنشورة</p>
              <p className="mt-2 text-4xl font-bold tabular-nums">{publishingRate}%</p>
              <div role="progressbar" aria-label="نسبة الدروس المنشورة" aria-valuenow={publishingRate} aria-valuemin={0} aria-valuemax={100} className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-[#f2cf87]" style={{ width: publishingRate + "%" }} />
              </div>
              <p className="mt-3 text-xs text-[#d6e9df]">{stats.publishedLessons.toLocaleString("en-US")} من أصل {stats.lessons.toLocaleString("en-US")} درس</p>
            </div>
          </div>
        </section>
        <section aria-labelledby="overview-heading">
          <h2 id="overview-heading" className="text-xl font-bold text-[#173f35]">مؤشرات المنصة</h2>
          <p className="mt-1 mb-4 text-sm text-[#6e8377]">أرقام حقيقية من قاعدة بيانات ضاديوم</p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => <Metric key={metric.title} {...metric} />)}
          </div>
        </section>
        <section aria-labelledby="links-heading">
          <h2 id="links-heading" className="text-xl font-bold text-[#173f35]">ابدأ من هنا</h2>
          <p className="mt-1 mb-4 text-sm text-[#6e8377]">انتقل مباشرة إلى القسم المناسب لعملك.</p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {shortcuts.map(({ href, title, icon: Icon, detail, category }) => (
              <Link href={href} key={href} className="group flex min-h-40 flex-col rounded-2xl border border-[#e0eae3] bg-white p-5 shadow-[0_4px_20px_rgba(18,63,57,.03)] transition hover:-translate-y-0.5 hover:border-[#9fcbb2] hover:shadow-[0_12px_28px_rgba(18,63,57,.075)] focus-visible:outline-2 focus-visible:outline-[#174f47] motion-reduce:transform-none">
                <div className="flex items-center justify-between">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#edf5f0] text-[#246454]"><Icon size={21} aria-hidden="true" /></div>
                  <span className="rounded-full bg-[#f4f7f3] px-3 py-1 text-xs text-[#618173]">{category}</span>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#173f35]">{title}</h3>
                  <ArrowUpLeft size={16} aria-hidden="true" className="mr-auto text-[#7caa94]" />
                </div>
                <p className="mt-2 text-sm leading-7 text-[#62776c]">{detail}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
