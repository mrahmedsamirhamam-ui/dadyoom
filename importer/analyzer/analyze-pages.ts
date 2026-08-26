import fs from "node:fs/promises";
import path from "node:path";

type CleanedPage = {
  pageNumber: number;
  text: string;
};

type PageAnalysis = {
  pageNumber: number;
  characters: number;
  lines: number;
  preview: string;
  possibleTitle: string | null;
  hasArabic: boolean;
};

function normalizeLine(line: string): string {
  return line
    .replace(/\s+/g, " ")
    .replace(/[ـ]+/g, "")
    .trim();
}

function containsArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

function detectPossibleTitle(text: string): string | null {
  const lines = text
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter(Boolean);

  for (const line of lines.slice(0, 8)) {
    if (
      containsArabic(line) &&
      line.length >= 3 &&
      line.length <= 80 &&
      !/^\d+$/.test(line) &&
      !line.includes("وزارة التربية") &&
      !line.includes("مملكة البحرين")
    ) {
      return line;
    }
  }

  return null;
}

export async function analyzePages(
  cleanPagesFile: string,
  outputDirectory: string
): Promise<PageAnalysis[]> {
  const raw = await fs.readFile(cleanPagesFile, "utf8");
  const pages = JSON.parse(raw) as CleanedPage[];

  const analysis: PageAnalysis[] = pages.map((page) => {
    const normalizedText = page.text.trim();
    const lines = normalizedText
      .split(/\r?\n/)
      .map(normalizeLine)
      .filter(Boolean);

    return {
      pageNumber: page.pageNumber,
      characters: normalizedText.length,
      lines: lines.length,
      preview: normalizedText.slice(0, 300),
      possibleTitle: detectPossibleTitle(normalizedText),
      hasArabic: containsArabic(normalizedText),
    };
  });

  await fs.mkdir(outputDirectory, { recursive: true });

  await fs.writeFile(
    path.join(outputDirectory, "page-analysis.json"),
    JSON.stringify(analysis, null, 2),
    "utf8"
  );

  const readableReport = analysis
    .filter((page) => page.hasArabic && page.characters > 20)
    .map(
      (page) =>
        [
          `==============================`,
          `PDF PAGE: ${page.pageNumber}`,
          `TITLE: ${page.possibleTitle ?? "غير محدد"}`,
          `CHARACTERS: ${page.characters}`,
          `LINES: ${page.lines}`,
          ``,
          page.preview,
          ``,
        ].join("\n")
    )
    .join("\n");

  await fs.writeFile(
    path.join(outputDirectory, "page-analysis.txt"),
    readableReport,
    "utf8"
  );

  return analysis;
}
