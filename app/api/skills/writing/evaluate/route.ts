import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { askAI } from "@/importer/ai/client";

type WritingEvaluation = {
  overallScore: number;
  spellingScore: number;
  grammarScore: number;
  coherenceScore: number;
  styleScore: number;
  strengths: string[];
  improvements: string[];
  correctedText: string;
  improvedText: string;
  feedback: string;
};

function clampScore(value: unknown): number {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(100, Math.round(number))
  );
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === "string"
    )
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function cleanJsonResponse(text: string): string {
  const trimmed = text.trim();

  const fenced =
    trimmed.match(
      /```(?:json)?\s*([\s\S]*?)```/iu
    );

  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const firstBrace =
    trimmed.indexOf("{");

  const lastBrace =
    trimmed.lastIndexOf("}");

  if (
    firstBrace >= 0 &&
    lastBrace > firstBrace
  ) {
    return trimmed.slice(
      firstBrace,
      lastBrace + 1
    );
  }

  return trimmed;
}

export async function POST(
  request: Request
) {
  try {
    const supabase =
      await createClient();

    const {
      data: { user },
      error: authError,
    } =
      await supabase.auth.getUser();

    if (
      authError ||
      !user
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "يجب تسجيل الدخول أولًا.",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      (await request.json()) as {
        text?: unknown;
        prompt?: unknown;
      };

    const text =
      typeof body.text ===
        "string"
        ? body.text.trim()
        : "";

    const writingPrompt =
      typeof body.prompt ===
        "string"
        ? body.prompt.trim()
        : "";

    if (text.length < 3) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "اكتب نصًا أطول قليلًا حتى يستطيع ضاد تقييمه.",
        },
        {
          status: 400,
        }
      );
    }

    if (text.length > 4000) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "النص طويل جدًا. اختصره إلى أقل من 4000 حرف.",
        },
        {
          status: 400,
        }
      );
    }

    const prompt = `
أنت "ضاد"، معلم متخصص في تعليم الكتابة باللغة العربية.

مهمتك تقييم كتابة الطالب تربويًا، وليس مجرد البحث عن الأخطاء.

موضوع الكتابة:
${writingPrompt || "كتابة حرة"}

نص الطالب:
"""
${text}
"""

قيّم النص في أربعة جوانب من 100:
1. الإملاء.
2. النحو والتراكيب.
3. الترابط وتنظيم الأفكار.
4. الأسلوب والتعبير.

ثم احسب overallScore من 100.

قواعد مهمة:
- راعِ أن المتعلم طالب وليس كاتبًا محترفًا.
- شجّع الطالب ولا تستخدم لغة محبطة.
- لا تغيّر فكرة الطالب الأساسية.
- correctedText يصحح الأخطاء فقط قدر الإمكان.
- improvedText يقدم صياغة تعليمية محسنة مع الحفاظ على معنى الطالب.
- strengths من 1 إلى 4 نقاط قصيرة.
- improvements من 1 إلى 4 نقاط قصيرة.
- feedback جملة أو جملتان بالعربية الفصحى السهلة.
- لا تستخدم Markdown.
- أرجع JSON صالحًا فقط دون أي كلام قبله أو بعده.

الشكل المطلوب حرفيًا:

{
  "overallScore": 0,
  "spellingScore": 0,
  "grammarScore": 0,
  "coherenceScore": 0,
  "styleScore": 0,
  "strengths": [],
  "improvements": [],
  "correctedText": "",
  "improvedText": "",
  "feedback": ""
}
`;

    const rawAnswer =
      await askAI(prompt);

    const parsed =
      JSON.parse(
        cleanJsonResponse(rawAnswer)
      ) as Partial<WritingEvaluation>;

    const result: WritingEvaluation = {
      overallScore:
        clampScore(
          parsed.overallScore
        ),

      spellingScore:
        clampScore(
          parsed.spellingScore
        ),

      grammarScore:
        clampScore(
          parsed.grammarScore
        ),

      coherenceScore:
        clampScore(
          parsed.coherenceScore
        ),

      styleScore:
        clampScore(
          parsed.styleScore
        ),

      strengths:
        stringArray(
          parsed.strengths
        ),

      improvements:
        stringArray(
          parsed.improvements
        ),

      correctedText:
        typeof parsed.correctedText ===
          "string"
          ? parsed.correctedText.trim()
          : text,

      improvedText:
        typeof parsed.improvedText ===
          "string"
          ? parsed.improvedText.trim()
          : text,

      feedback:
        typeof parsed.feedback ===
          "string"
          ? parsed.feedback.trim()
          : "أحسنت، استمر في التدريب على الكتابة.",
    };

    return NextResponse.json({
      ok: true,
      evaluation: result,
    });
  } catch (error) {
    console.error(
      "WRITING_EVALUATION_FAILED",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "تعذر تقييم الكتابة الآن. حاول مرة أخرى.",
      },
      {
        status: 500,
      }
    );
  }
}
