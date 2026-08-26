import fs from "node:fs/promises";
import path from "node:path";
import { analyzeLesson } from "./analyze-lesson";

async function main() {
  const lessonPath = path.join(
    process.cwd(),
    "importer",
    "output",
    "lessons",
    "01-isqi-hadiqata-fulan.txt"
  );

  const lessonText = await fs.readFile(
    lessonPath,
    "utf8"
  );

  const result = await analyzeLesson(
    lessonText
  );

  console.dir(result, {
    depth: null,
  });
}

main().catch((error) => {
  console.error("AI test failed:");
  console.error(error);
  process.exit(1);
});
