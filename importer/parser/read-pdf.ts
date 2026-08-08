import fs from "node:fs/promises";
import { PDFParse } from "pdf-parse";

export async function readPdf(filePath: string) {
  const buffer = await fs.readFile(filePath);

  const parser = new PDFParse({
    data: buffer,
  });

  try {
    const textResult = await parser.getText();
    const infoResult = await parser.getInfo();

    return {
      pages: textResult.total,
      text: textResult.text,
     info: infoResult ?? null,
      metadata: infoResult.metadata ?? null,
    };
  } finally {
    await parser.destroy();
  }
}