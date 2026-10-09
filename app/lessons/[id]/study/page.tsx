import { isKnownBookReferenceId } from "@/lib/curriculum/verified-book-reference";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/server";

import LessonStudyStudio from "./LessonStudyStudio";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function LessonStudyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (isKnownBookReferenceId(id)) redirect(`/curriculum/books/${id}`);
  const supabase = await createClient();

  const { data: lesson, error } = await supabase
    .from("lessons")
    .select("id,title,summary,content")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error || !lesson) {
    notFound();
  }

  return (
    <LessonStudyStudio
      lesson={{
        id: lesson.id,
        title: lesson.title,
        summary: lesson.summary,
        content: lesson.content,
      }}
    />
  );
}
