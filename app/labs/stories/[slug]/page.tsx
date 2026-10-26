import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DadyoomLogo from "@/components/brand/DadyoomLogo";
import StoryLabClient from "@/components/labs/stories/StoryLabClient";
import { getLearningStory, LEARNING_STORIES } from "@/lib/story-lab/stories";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return LEARNING_STORIES.map((story) => ({ slug: story.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const story = getLearningStory(slug);
  if (!story) return { title: "حكاية غير موجودة | ضاديوم", robots: { index: false, follow: false } };
  return {
    title: story.title + " | حكايات ضاديوم",
    description: story.goal + " تجربة تفاعلية من ضاديوم مع تدريبات وتغذية راجعة.",
    alternates: { canonical: "/labs/stories/" + story.slug },
  };
}

export default async function LearningStoryPage({ params }: Props) {
  const { slug } = await params;
  const story = getLearningStory(slug);
  if (!story) notFound();

  return (
    <main dir="rtl" className="min-h-screen bg-[#fffaf0] text-[#27231f]">
      <header className="border-b border-[#e5d8bf] bg-[#fffef9]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <DadyoomLogo />
          <nav aria-label="التنقل" className="flex flex-wrap gap-4 text-sm font-bold text-[#174f47]">
            <Link href="/" className="hover:underline">الرئيسية</Link>
            <Link href="/labs/stories" className="hover:underline">الحكايات</Link>
            <Link href="/labs/letters" className="hover:underline">مختبر الحروف</Link>
          </nav>
        </div>
      </header>
      <StoryLabClient key={story.slug} story={story} />
    </main>
  );
}
