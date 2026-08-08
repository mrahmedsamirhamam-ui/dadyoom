import path from "node:path";
import dotenv from "dotenv";
import { detectBookLessons } from "./pipeline/detect-book-lessons";

dotenv.config({
  path: path.join(
    process.cwd(),
    ".env.local"
  ),
  quiet: true,
});

async function main() {
  const outputDirectory = path.join(
    process.cwd(),
    "importer",
    "output"
  );

  await detectBookLessons(
    path.join(
      outputDirectory,
      "clean-pages",
      "clean-pages.json"
    ),
    path.join(
      outputDirectory,
      "detected-lessons"
    )
  );
}

main().catch((error) => {
  console.error(
    "Lesson detection failed:"
  );

  console.error(error);

  process.exit(1);
});