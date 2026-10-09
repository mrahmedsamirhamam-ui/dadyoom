import { isKnownBookReferenceId } from "@/lib/curriculum/verified-book-reference";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import LessonGamesClient from "./LessonGamesClient";

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
  const supabase = await createClient();

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id,title")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (!lesson) notFound();

  return (
    <LessonGamesClient
      lesson={{
        id: lesson.id,
        title: lesson.title,
      }}
    />
  );
}
