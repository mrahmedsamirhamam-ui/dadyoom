import path from "node:path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
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

export async function startBookImport(
  context: BookImportContext,
  totalPages: number
) {
  const { data, error } = await supabase
    .from("book_imports")
    .insert({
      curriculum_id: context.curriculumId,
      title: "كتاب اللغة العربية للصف الرابع",
      source_pdf: context.sourcePdfUrl,
      total_pages: totalPages,
      status: "processing",
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id as string;
}

type CompleteImportInput = {
  importId: string;
  importedLessons: number;
  importedVocabulary: number;
  importedQuestions: number;
};

export async function completeBookImport({
  importId,
  importedLessons,
  importedVocabulary,
  importedQuestions,
}: CompleteImportInput) {
  const { error } = await supabase
    .from("book_imports")
    .update({
      imported_lessons: importedLessons,
      imported_vocabulary:
        importedVocabulary,
      imported_questions:
        importedQuestions,
      status: "completed",
      finished_at:
        new Date().toISOString(),
    })
    .eq("id", importId);

  if (error) {
    throw error;
  }
}

export async function failBookImport(
  importId: string
) {
  const { error } = await supabase
    .from("book_imports")
    .update({
      status: "failed",
      finished_at:
        new Date().toISOString(),
    })
    .eq("id", importId);

  if (error) {
    console.error(
      "Failed to update import status:",
      error
    );
  }
}