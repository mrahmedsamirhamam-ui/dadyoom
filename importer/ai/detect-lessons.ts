import { askAI } from "./client";

export type DetectedLesson = {
  title: string;
  pdfPageStart: number;
  pdfPageEnd: number;
  lessonType:
    | "reading"
    | "writing"
    | "listening"
    | "speaking"
    | "grammar"
    | "spelling"
    | "vocabulary"
    | "assessment";
};

type PageInput = {
  pageNumber: number;
  text: string;
};

function extractJson(text: string): string {
  const fencedMatch = text.match(
    /```json\s*([\s\S]*?)```/i
  );

  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBracket = text.indexOf("[");
  const lastBracket = text.lastIndexOf("]");

  if (
    firstBracket === -1 ||
    lastBracket === -1
  ) {
    throw new Error(
      "Gemini لم يُرجع قائمة JSON صالحة."
    );
  }

  return text.slice(
    firstBracket,
    lastBracket + 1
  );
}

export async function detectLessons(
  pages: PageInput[]
): Promise<DetectedLesson[]> {
  const pageText = pages
    .map(
      (page) =>
        `===== PDF PAGE ${page.pageNumber} =====
${page.text.slice(0, 5000)}`
    )
    .join("\n\n");

  const response = await askAI(`
أنت خبير في تحليل كتب اللغة العربية المدرسية.

حلّل صفحات كتاب اللغة العربية للصف الرابع، وحدد الموضوعات أو الدروس الرئيسة فقط.

أعد مصفوفة JSON فقط بهذا الشكل:

[
  {
    "title": "عنوان الدرس كما ورد في الكتاب",
    "pdfPageStart": 12,
    "pdfPageEnd": 13,
    "lessonType": "reading"
  }
]

القيم المسموحة لـ lessonType:

reading
writing
listening
speaking
grammar
spelling
vocabulary
assessment

الشروط:

- لا تعتبر صفحات الغلاف أو الفهرس دروسًا.
- لا تعتبر أسئلة الدرس درسًا جديدًا.
- اجمع صفحات النص وأنشطته التابعة له في درس واحد.
- استخدم أرقام PDF PAGE المكتوبة قبل كل صفحة.
- لا تخترع عناوين غير موجودة.
- أعد JSON فقط دون Markdown أو شرح.

الصفحات:

${pageText}
`);

  const parsed = JSON.parse(
    extractJson(response)
  ) as DetectedLesson[];

  return parsed.filter(
    (lesson) =>
      lesson.title?.trim() &&
      Number.isInteger(
        lesson.pdfPageStart
      ) &&
      Number.isInteger(
        lesson.pdfPageEnd
      ) &&
      lesson.pdfPageEnd >=
        lesson.pdfPageStart
  );
}
