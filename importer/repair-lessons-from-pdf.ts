import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs/promises";
import { GoogleGenAI } from "@google/genai";
import { PDFDocument } from "pdf-lib";
import { createClient } from "@supabase/supabase-js";

dotenv.config({
  path: path.resolve(process.cwd(), ".env.local"),
});

type LessonRow = {
  id: string;
  title: string;
  lesson_number: number;
  source_page_start: number | null;
  source_page_end: number | null;
  status: string;
};

type RepairedLesson = {
  title: string;
  content: string;
  summary: string;
};

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const geminiApiKey =
  process.env.GEMINI_API_KEY_BACKUP ||
  process.env.GEMINI_API_KEY;

const geminiModel =
  process.env.REPAIR_GEMINI_MODEL ||
  process.env.GEMINI_MODEL_BACKUP ||
  process.env.GEMINI_MODEL ||
  "gemini-3.5-flash-lite";

if (!supabaseUrl) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL is missing."
  );
}

if (!serviceRoleKey) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY is missing."
  );
}

if (!geminiApiKey) {
  throw new Error(
    "Gemini API key is missing."
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

const ai = new GoogleGenAI({
  apiKey: geminiApiKey,
});

const pdfPath = path.resolve(
  process.cwd(),
  "public/books/ARA04Read.pdf"
);

const outputDirectory = path.resolve(
  process.cwd(),
  "importer/output/repaired-lessons"
);

function cleanJsonResponse(
  value: string
): string {
  return value
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

function arabicRatio(
  value: string
): number {
  const letters =
    value.match(
      /[A-Za-z\u0600-\u06FF]/g
    ) ?? [];

  const arabic =
    value.match(
      /[\u0600-\u06FF]/g
    ) ?? [];

  if (letters.length === 0) {
    return 0;
  }

  return arabic.length / letters.length;
}

function containsBrokenText(
  value: string
): boolean {
  return (
    value.includes("�") ||
    /[\uE000-\uF8FF]/u.test(value) ||
    /[]/u.test(value)
  );
}

function validateRepair(
  lesson: RepairedLesson
): void {
  if (
    typeof lesson.title !== "string" ||
    !lesson.title.trim()
  ) {
    throw new Error(
      "Gemini returned an empty title."
    );
  }

  if (
    typeof lesson.content !== "string" ||
    lesson.content.trim().length < Number(process.env.REPAIR_MIN_CONTENT_LENGTH ?? "150")
  ) {
    throw new Error(
      "Extracted content is too short."
    );
  }

  if (
    typeof lesson.summary !== "string" ||
    !lesson.summary.trim()
  ) {
    throw new Error(
      "Gemini returned an empty summary."
    );
  }

  if (
    containsBrokenText(lesson.title) ||
    containsBrokenText(lesson.content)
  ) {
    throw new Error(
      "Broken characters remain in output."
    );
  }

  if (
    arabicRatio(lesson.content) < 0.45
  ) {
    throw new Error(
      "Arabic text ratio is too low."
    );
  }
}

async function createLessonPdfBase64(
  sourcePdfBytes: Uint8Array,
  startPage: number,
  endPage: number
): Promise<string> {
  const sourcePdf = await PDFDocument.load(
    sourcePdfBytes,
    {
      ignoreEncryption: true,
    }
  );

  const totalPages =
    sourcePdf.getPageCount();

  const safeStart = Math.max(
    1,
    startPage
  );

  const safeEnd = Math.min(
    endPage,
    totalPages
  );

  if (safeStart > safeEnd) {
    throw new Error(
      `Invalid page range: ${startPage}-${endPage}`
    );
  }

  const pageIndexes = Array.from(
    {
      length:
        safeEnd - safeStart + 1,
    },
    (_, index) =>
      safeStart - 1 + index
  );

  const lessonPdf =
    await PDFDocument.create();

  const copiedPages =
    await lessonPdf.copyPages(
      sourcePdf,
      pageIndexes
    );

  for (const page of copiedPages) {
    lessonPdf.addPage(page);
  }

  const lessonPdfBytes =
    await lessonPdf.save({
      useObjectStreams: true,
    });

  const lessonSizeMb =
    lessonPdfBytes.length /
    1024 /
    1024;

  console.log(
    `Lesson PDF pages ${safeStart}-${safeEnd}: ${lessonSizeMb.toFixed(2)} MB`
  );

  if (lessonSizeMb > 50) {
    throw new Error(
      "Lesson PDF is still larger than 50 MB."
    );
  }

  return Buffer
    .from(lessonPdfBytes)
    .toString("base64");
}

async function repairLesson(
  sourcePdfBytes: Uint8Array,
  lesson: LessonRow
): Promise<RepairedLesson> {
  if (
    !lesson.source_page_start ||
    !lesson.source_page_end
  ) {
    throw new Error(
      "Lesson has no source page range."
    );
  }

  const lessonPdfBase64 =
    await createLessonPdfBase64(
      sourcePdfBytes,
      lesson.source_page_start,
      lesson.source_page_end
    );

  const prompt = `
أنت محرر متخصص في كتب اللغة العربية المدرسية.

اقرأ ملف PDF المرفق بصريًا، ولا تعتمد على النص الداخلي المشوَّه في الملف.

المطلوب:
استخراج نص الدرس رقم ${lesson.lesson_number}.

العنوان المتوقع:
${lesson.title}

صفحات المصدر:
من الصفحة ${lesson.source_page_start}
إلى الصفحة ${lesson.source_page_end}

تعليمات إلزامية:
1. اقرأ الصفحات المحددة فقط.
2. انسخ نص القراءة العربي الصحيح.
3. أصلح الرموز المشوهة وترتيب الحروف.
4. حافظ على التشكيل وعلامات الترقيم قدر الإمكان.
5. لا تضف معلومات ليست في الكتاب.
6. احذف أرقام الصفحات ورؤوسها وتعليمات الطباعة.
7. لا تضع عبارات مثل PDF PAGE داخل النص.
8. إذا تضمنت الصفحات أسئلة وأنشطة، استخرج نص القراءة الأساسي فقط.
9. اكتب ملخصًا أمينًا من جملتين.
10. أعد JSON صالحًا فقط دون Markdown.

صيغة الإخراج:
{
  "title": "العنوان الصحيح للدرس",
  "content": "النص العربي الصحيح كاملًا",
  "summary": "ملخص الدرس في جملتين"
}
`;

  console.log(
    `Using Gemini model: ${geminiModel}`
  );

  const response =
    await ai.models.generateContent({
      model: geminiModel,
      contents: [
        {
          inlineData: {
            mimeType:
              "application/pdf",
            data: lessonPdfBase64,
          },
        },
        {
          text: prompt,
        },
      ],
      config: {
        responseMimeType:
          "application/json",
        temperature: 0.1,
      },
    });

  const rawText =
    response.text?.trim();

  if (!rawText) {
    throw new Error(
      "Gemini returned an empty response."
    );
  }

  let parsed: RepairedLesson;

  try {
    parsed = JSON.parse(
      cleanJsonResponse(rawText)
    ) as RepairedLesson;
  } catch {
    console.error(
      "Invalid Gemini response:",
      rawText
    );

    throw new Error(
      "Gemini response is not valid JSON."
    );
  }

  validateRepair(parsed);

  return {
    title: parsed.title.trim(),
    content: parsed.content.trim(),
    summary: parsed.summary.trim(),
  };
}

async function main(): Promise<void> {
  await fs.mkdir(
    outputDirectory,
    {
      recursive: true,
    }
  );

  console.log("Reading PDF...");

  const pdfBuffer =
    await fs.readFile(pdfPath);

  const pdfSizeMb =
    pdfBuffer.length /
    1024 /
    1024;

  console.log(
    `PDF loaded: ${pdfSizeMb.toFixed(2)} MB`
  );

  const requestedLessonNumber =
    process.env.REPAIR_LESSON_NUMBER
      ? Number(
          process.env
            .REPAIR_LESSON_NUMBER
        )
      : null;

  const batchLimit = Number(
    process.env.REPAIR_LIMIT ?? "1"
  );

  let query = supabase
    .from("lessons")
    .select(`
      id,
      title,
      lesson_number,
      source_page_start,
      source_page_end,
      status
    `)
    .in(
      "status",
      ["published", "review"]
    )
    .order(
      "lesson_number",
      {
        ascending: true,
      }
    );

  if (
    requestedLessonNumber !== null
  ) {
    query = query.eq(
      "lesson_number",
      requestedLessonNumber
    );
  } else {
    query = query.limit(
      batchLimit
    );
  }

  const {
    data,
    error,
  } = await query;

  if (error) {
    throw error;
  }

  const lessons =
    (data ?? []) as LessonRow[];

  if (lessons.length === 0) {
    console.log(
      "No lessons found to repair."
    );

    return;
  }

  for (const lesson of lessons) {
    console.log(
      `Repairing lesson ${lesson.lesson_number}: ${lesson.title}`
    );

    try {
      const repaired =
        await repairLesson(pdfBuffer, lesson);

      const backupPath =
        path.join(
          outputDirectory,
          `lesson-${lesson.lesson_number}.json`
        );

      await fs.writeFile(
        backupPath,
        JSON.stringify(
          {
            lessonId: lesson.id,
            previousTitle:
              lesson.title,
            repaired,
          },
          null,
          2
        ),
        "utf8"
      );

      const {
        error: updateError,
      } = await supabase
        .from("lessons")
        .update({
          title: repaired.title,
          content:
            repaired.content,
          summary:
            repaired.summary,
          status: "review",
          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          lesson.id
        );

      if (updateError) {
        throw updateError;
      }

      console.log(
        `Repaired successfully: ${repaired.title}`
      );

      console.log(
        `Backup: ${backupPath}`
      );
    } catch (error) {
      console.error(
        `Repair failed for lesson ${lesson.lesson_number}:`,
        error
      );
    }

    if (lessons.length > 1) {
      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            15000
          )
      );
    }
  }

  console.log(
    "Repair batch completed."
  );
}

main().catch((error) => {
  console.error(
    "Lesson repair failed:",
    error
  );

  process.exitCode = 1;
});
