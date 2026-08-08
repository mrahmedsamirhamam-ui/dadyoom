import fs from "node:fs/promises";
import path from "node:path";
import { cleanPageText } from "./clean-page-text";

type ExtractedPage = {
  pageNumber: number;
  text: string;
};

export async function cleanPages(
  inputFile: string,
  outputDirectory: string
) {
  const raw = await fs.readFile(inputFile, "utf8");
  const pages = JSON.parse(raw) as ExtractedPage[];

  const cleanedPages = pages.map((page) => ({
    pageNumber: page.pageNumber,
    text: cleanPageText(page.text),
  }));

  await fs.mkdir(outputDirectory, { recursive: true });

  await fs.writeFile(
    path.join(outputDirectory, "clean-pages.json"),
    JSON.stringify(cleanedPages, null, 2),
    "utf8"
  );

  await Promise.all(
    cleanedPages.map((page) =>
      fs.writeFile(
        path.join(
          outputDirectory,
          `page-${String(page.pageNumber).padStart(3, "0")}.txt`
        ),
        page.text,
        "utf8"
      )
    )
  );

  return cleanedPages;
}