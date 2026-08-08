import path from "node:path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { lesson01 } from "../data/lesson-01";

dotenv.config({
  path: path.join(process.cwd(), ".env.local"),
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL غير موجود داخل .env.local"
  );
}

if (!serviceRoleKey) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY غير موجود داخل .env.local"
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

async function getUnitId(): Promise<string> {
  const { data: country, error: countryError } =
    await supabase
      .from("countries")
      .select("id")
      .eq("code", "BH")
      .single();

  if (countryError) {
    throw countryError;
  }

  const { data: curriculum, error: curriculumError } =
    await supabase
      .from("curricula")
      .select("id")
      .eq("country_id", country.id)
      .eq("name_ar", "المنهج الوطني لمملكة البحرين")
      .single();

  if (curriculumError) {
    throw curriculumError;
  }

  const { data: grade, error: gradeError } =
    await supabase
      .from("grades")
      .select("id")
      .eq("curriculum_id", curriculum.id)
      .eq("grade_number", 4)
      .single();

  if (gradeError) {
    throw gradeError;
  }

  const { data: unit, error: unitError } =
    await supabase
      .from("units")
      .select("id")
      .eq("grade_id", grade.id)
      .eq("unit_number", 1)
      .single();

  if (unitError) {
    throw unitError;
  }

  return unit.id;
}

async function main() {
  const unitId = await getUnitId();

  const { data, error } = await supabase
    .from("lessons")
    .upsert(
      {
        unit_id: unitId,
        title: lesson01.title,
        slug: lesson01.slug,
        lesson_number: lesson01.lessonNumber,
        sort_order: lesson01.lessonNumber,
        lesson_type: lesson01.lessonType,
        summary: lesson01.summary,
        content: lesson01.content,
        learning_objectives:
          lesson01.learningObjectives,
        vocabulary: lesson01.vocabulary,
        instructions: lesson01.instructions,
        source_pdf_url: lesson01.sourcePdfUrl,
        source_page_start:
          lesson01.sourcePageStart,
        source_page_end:
          lesson01.sourcePageEnd,
        status: "published",
        is_free: true,
        estimated_minutes:
          lesson01.estimatedMinutes,
      },
      {
        onConflict: "unit_id,lesson_number",
      }
    )
    .select("id, title, slug, status")
    .single();

  if (error) {
    throw error;
  }

  console.log("Lesson uploaded successfully:");
  console.log(data);
}

main().catch((error) => {
  console.error("Upload failed:");
  console.error(error);
  process.exit(1);
});