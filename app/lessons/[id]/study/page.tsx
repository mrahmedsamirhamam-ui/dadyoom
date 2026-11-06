import type { Metadata } from "next";
import { needsSourcePublicationReview, publicLessonDescription } from "@/lib/lesson-content/publication-readiness";
import { notFound } from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/server";

import LessonStudyStudio from "./LessonStudyStudio";

// The study studio duplicates a published lesson body. Index the canonical
// lesson page, not an unreviewed or duplicate study view.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default async function LessonStudyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: lesson, error } = await supabase
    .from("lessons")
    .select("id,title,summary,content,instructions")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error || !lesson) {
    notFound();
  }

  const sourceReviewRequired = needsSourcePublicationReview(lesson.instructions, lesson.content);
  const safeDescription = publicLessonDescription(lesson.summary, lesson.instructions, lesson.content);
  return (
    <>
      {sourceReviewRequired && (
        <aside dir="rtl" role="status"
          className="mx-auto mt-5 max-w-5xl rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm font-bold leading-8 text-amber-950">
          {safeDescription}
        </aside>
      )}
      <LessonStudyStudio
        lesson={{
          id: lesson.id,
          title: lesson.title,
          summary: sourceReviewRequired ? safeDescription : lesson.summary,
          content: lesson.content,
        }}
      />
    </>
  );
}
