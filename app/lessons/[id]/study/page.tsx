import { notFound } from "next/navigation";
import Link from "next/link";
import { isKnownNonTeachingLessonPlaceholder } from "@/lib/lesson-content-integrity";

import {
  createClient,
} from "@/lib/supabase/server";

import LessonStudyStudio from "./LessonStudyStudio";

export default async function LessonStudyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  if (isKnownNonTeachingLessonPlaceholder(lesson.content)) {
    return (
      <main dir="rtl" className="mx-auto max-w-3xl px-4 py-12">
        <section role="status" className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-amber-950">
          <h1 className="text-xl font-black">أدوات المذاكرة قيد المراجعة لهذا الدرس</h1>
          <p className="mt-3 leading-8">
            شرح الدرس الحالي مجرد مقدمة عامة، ولذلك لن تُنشأ منه ملخصات أو
            شرائح تعليمية غير دقيقة. سنعيد تفعيل أدوات المذاكرة بعد تصحيح المحتوى.
          </p>
          <Link href={`/lessons/${lesson.id}`} className="mt-4 inline-block font-bold underline">
            العودة إلى صفحة الدرس
          </Link>
        </section>
      </main>
    );
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
