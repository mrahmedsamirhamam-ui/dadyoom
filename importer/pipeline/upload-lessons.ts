import path from "node:path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { ImportedLesson } from "../splitter/build-lessons";
import type { BookImportContext } from "./types";

dotenv.config({
  path: path.join(process.cwd(), ".env.local"),
});

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL غير موجود."
  );
}

if (!serviceRoleKey) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY غير موجود."
  );
}

const supabase = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export async function uploadLessons(
  context: BookImportContext,
  lessons: ImportedLesson[]
) {
  const uploadedLessons = [];

  for (const lesson of lessons) {
    const { data, error } = await supabase
      .from("lessons")
      .upsert(
        {
          unit_id: context.unitId,
          title: lesson.title,
          slug: lesson.slug,
          lesson_number:
            lesson.lessonNumber,
          sort_order:
            lesson.lessonNumber,
          lesson_type:
            lesson.lessonType,
          content:
            lesson.rawText,
          source_pdf_url:
            context.sourcePdfUrl,
          source_page_start:
            lesson.sourcePageStart,
          source_page_end:
            lesson.sourcePageEnd,
          status: "draft",
          is_free: true,
        },
        {
          onConflict:
            "unit_id,lesson_number",
        }
      )
      .select(
        "id,title,lesson_number,status"
      )
      .single();

    if (error) {
      throw error;
    }

    uploadedLessons.push(data);
  }

  return uploadedLessons;
}
