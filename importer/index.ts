import path from "node:path";
import dotenv from "dotenv";
import { importBook } from "./pipeline/book-import";

dotenv.config({
  path: path.join(
    process.cwd(),
    ".env.local"
  ),
});

async function main() {
  const curriculumId =
    process.env.IMPORT_CURRICULUM_ID;

  const gradeId =
    process.env.IMPORT_GRADE_ID;

  const unitId =
    process.env.IMPORT_UNIT_ID;

  if (!curriculumId) {
    throw new Error(
      "IMPORT_CURRICULUM_ID غير موجود في .env.local"
    );
  }

  if (!gradeId) {
    throw new Error(
      "IMPORT_GRADE_ID غير موجود في .env.local"
    );
  }

  if (!unitId) {
    throw new Error(
      "IMPORT_UNIT_ID غير موجود في .env.local"
    );
  }

  await importBook({
    pdfPath: path.join(
      process.cwd(),
      "public",
      "books",
      "ARA04Read.pdf"
    ),

    outputDirectory: path.join(
      process.cwd(),
      "importer",
      "output"
    ),

    sourcePdfUrl:
      "/books/ARA04Read.pdf",

    curriculumId,
    gradeId,
    unitId,
  });
}

main().catch((error) => {
  console.error("Import failed:");
  console.error(error);
  process.exit(1);
});
