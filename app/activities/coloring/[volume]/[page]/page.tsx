import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DadyoomLogo from "@/components/brand/DadyoomLogo";
import ColoringActivityClient from "@/components/coloring/ColoringActivityClient";
import { COLORING_ACTIVITIES, findColoringActivity, getActivityChoices, activityHref } from "@/lib/coloring/activities";

type Params = Promise<{volume: string; page: string}>;

export function generateStaticParams() {
  return COLORING_ACTIVITIES.map(activity => ({
    volume: `volume-${activity.volume}`,
    page: `page-${String(activity.page).padStart(3, "0")}`,
  }));
}

export async function generateMetadata({ params }: {params: Params}): Promise<Metadata> {
  const {volume,page} = await params;
  const activity = findColoringActivity(volume,page);
  if (!activity) return { title: "النشاط غير موجود | ضاديوم", robots: { index: false } };
  return {
    title: `${activity.title} | أنشطة ألوّن وأتعلّم مع ضاديوم`,
    description: `نشاط تفاعلي مجاني من ضاديوم: ${activity.instruction}`,
    alternates: { canonical: activityHref(activity) },
    robots: { index: true, follow: true },
  };
}

export default async function ColoringActivityPage({params}:{params:Params}) {
  const {volume,page} = await params;
  const activity = findColoringActivity(volume,page);
  if (!activity) notFound();
  const previous = COLORING_ACTIVITIES.find(item => item.volume===activity.volume && item.page===activity.page-1);
  const next = COLORING_ACTIVITIES.find(item => item.volume===activity.volume && item.page===activity.page+1);

  return <main dir="rtl" className="min-h-screen bg-[#fffaf0] text-[#292923]">
    <header className="border-b border-[#e6dbc7] bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <DadyoomLogo />
        <Link href="/courses" className="text-sm font-black text-[#174f47] underline-offset-4 hover:underline">المناهج والمهارات</Link>
      </div>
    </header>
    <div className="mx-auto max-w-4xl px-4 py-10">
      <p className="text-sm font-black text-[#866d31]">ألوّن وأتعلّم مع ضاديوم · الكتاب {activity.volume} · الصفحة {activity.page} من 160</p>
      <h1 className="mt-3 font-arabic-display text-3xl font-black leading-relaxed text-[#174f47]">{activity.title}</h1>
      <p className="mt-2 leading-8 text-[#5d665f]">{activity.section} — نشاط إثرائي أصلي مكمل للصفحة الورقية، لا يُحتسب درجة مدرسية.</p>
      <div className="mt-8"><ColoringActivityClient key={`${activity.volume}-${activity.page}`} activity={activity} choices={getActivityChoices(activity)} /></div>
      <nav aria-label="الصفحات المجاورة" className="mt-8 flex flex-wrap justify-between gap-3 text-sm font-black">
        {previous ? <Link className="rounded-xl border border-[#d8c7a1] px-5 py-3 text-[#174f47]" href={activityHref(previous)}>الصفحة السابقة</Link> : <span />}
        {next ? <Link className="rounded-xl border border-[#d8c7a1] px-5 py-3 text-[#174f47]" href={activityHref(next)}>الصفحة التالية</Link> : <span />}
      </nav>
    </div>
  </main>;
}
