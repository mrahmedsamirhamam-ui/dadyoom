import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import LessonGamesClient from "./LessonGamesClient";

export default async function LessonGamesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
