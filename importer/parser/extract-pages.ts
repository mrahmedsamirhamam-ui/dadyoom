import fs from "node:fs/promises";
import path from "node:path";
import { PDFParse } from "pdf-parse";

export type ExtractedPage = {
  pageNumber: number;
  text: string;
};

export async function extractPages(
  filePath: string
): Promise<ExtractedPage[]> {
  const buffer = await fs.readFile(filePath);

  const parser = new PDFParse({
    data: buffer,
  });

  try {
    const result = await parser.getText();

    return result.pages.map((page, index) => ({
      pageNumber: index + 1,
      text: page.text.trim(),
    }));
  } finally {
    await parser.destroy();
  }
}

export async function savePages(
  pages: ExtractedPage[],
  outputDirectory: string
) {
  await fs.mkdir(outputDirectory, { recursive: true });

  await Promise.all(
    pages.map((page) => {
      const fileName = `page-${String(page.pageNumber).padStart(
        3,
        "0"
      )}.txt`;

      return fs.writeFile(
        path.join(outputDirectory, fileName),
        page.text,
        "utf8"
      );
    })
  );

  await fs.writeFile(
    path.join(outputDirectory, "pages.json"),
    JSON.stringify(pages, null, 2),
    "utf8"
  );
}