import { isKnownBookReferenceId } from "@/lib/curriculum/verified-book-reference";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import LessonHTMLArcade from "./LessonHTMLArcade";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function LessonGamesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (isKnownBookReferenceId(id)) redirect(`/curriculum/books/${id}`);
  if (!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id)) {
    notFound();
  }
  const supabase = await createClient();

  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id,title")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (lessonError) {
    console.error("LESSON_GAMES_PAGE_LOOKUP_FAILED", { code: lessonError.code });
    throw new Error("LESSON_GAMES_PAGE_LOOKUP_FAILED");
  }
  if (!lesson) notFound();

  return (
    <LessonHTMLArcade
      lesson={{
        id: lesson.id,
        title: lesson.title,
      }}
    />
  );
}
