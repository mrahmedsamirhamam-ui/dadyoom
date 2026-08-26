import fs from "node:fs/promises";

export type BookPage = {
  pageNumber: number;
  text: string;
};

export async function extractPageRange(
  pagesFile: string,
  startPage: number,
  endPage: number
): Promise<BookPage[]> {
  const raw = await fs.readFile(pagesFile, "utf8");
  const pages = JSON.parse(raw) as BookPage[];

  return pages.filter(
    (page) =>
      page.pageNumber >= startPage &&
      page.pageNumber <= endPage
  );
}
