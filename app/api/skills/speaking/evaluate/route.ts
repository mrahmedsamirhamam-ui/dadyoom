import {
  NextResponse,
} from "next/server";

import {
  GoogleGenAI,
} from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { readBoundedMultipart } from "@/lib/http/read-bounded-multipart";

type AudioEvaluation = {
  transcript: string;
  overallScore: number;
  pronunciationScore: number;
  fluencyScore: number;
  clarityScore: number;
  accuracyScore: number;
  strengths: string[];
  improvements: string[];
  wordsToPractice: string[];
  feedback: string;
};

function clampScore(
  value: unknown
): number {
  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(number)
    )
  );
}

function stringArray(
  value: unknown
): string[] {
  if (
    !Array.isArray(value)
  ) {
    return [];
  }

  return value
    .filter(
      (
        item
      ): item is string =>
        typeof item ===
          "string"
    )
    .map(
      item =>
        item.trim()
    )
    .filter(Boolean)
    .slice(0, 6);
}

function extractJson(
  value: string
): string {
  const clean =
    value
      .replace(
        /^```json\s*/iu,
        ""
      )
      .replace(
        /^```\s*/u,
        ""
      )
      .replace(
        /```\s*$/u,
        ""
      )
      .trim();

  const first =
    clean.indexOf("{");

  const last =
    clean.lastIndexOf("}");

  if (
    first >= 0 &&
    last > first
  ) {
    return clean.slice(
      first,
      last + 1
    );
  }

  return clean;
}

export async function POST(
  request: Request
) {
  try {
    // Authenticate before reading microphone data or opening a paid model.
    const supabase = await createClient();
    const { data: { user }, error: authError } =
      await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: "يجب تسجيل الدخول أولًا." },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }

    const upload = await readBoundedMultipart(request);
    if (!upload.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: upload.status === 413
            ? "حجم التسجيل أكبر من الحد المسموح."
            : "صيغة طلب التسجيل غير صالحة.",
        },
        {
          status: upload.status,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }
    const formData = upload.value;
    const audio = formData.get("audio");
    const originalText = formData.get("expectedText");
    const expectedText =
      typeof originalText === "string" ? originalText.trim() : "";

    if (!(audio instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "لم يصل التسجيل الصوتي." },
        { status: 400 },
      );
    }

    // Current speaking client uploads a converted WAV. Reject script, JSON,
    // MP4 and other files disguised as audio before any model invocation.
    if (!/^(audio\/(wav|wave|x-wav))$/i.test(audio.type) ||
      audio.size < 44 || audio.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        { ok: false, error: "صيغة أو حجم التسجيل غير صالحين." },
        { status: 400 },
      );
    }
    if (expectedText.length < 2 || expectedText.length > 600 ||
      /[\u0000-\u001f\u007f]/u.test(expectedText)) {
      return NextResponse.json(
        { ok: false, error: "الجملة النموذجية غير صالحة." },
        { status: 400 },
      );
    }

    const header = new Uint8Array(await audio.slice(0, 12).arrayBuffer());
    const tag = (offset: number) =>
      String.fromCharCode(...header.slice(offset, offset + 4));
    if (tag(0) !== "RIFF" || tag(8) !== "WAVE") {
      return NextResponse.json(
        { ok: false, error: "التسجيل لا يحتوي على ملف WAV صالح." },
        { status: 400 },
      );
    }

    const apiKey =
      process.env
        .GEMINI_API_KEY_BACKUP ||
      process.env
        .GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "Gemini API key is missing."
      );
    }

    const model =
      process.env
        .GEMINI_AUDIO_MODEL ||
      process.env
        .GEMINI_MODEL_BACKUP ||
      process.env
        .GEMINI_MODEL ||
      "gemini-3.5-flash";

    const bytes =
      Buffer.from(
        await audio
          .arrayBuffer()
      );

    const base64 =
      bytes.toString(
        "base64"
      );

    const prompt = `
أنت "ضاد"، مدرب نطق باللغة العربية للأطفال والطلاب.

استمع إلى التسجيل الصوتي المرفق وقارنه بالجملة النموذجية التالية:

"${expectedText}"

مهمتك تقييم أداء الطالب اعتمادًا على الصوت الذي تسمعه.

قيّم الجوانب التالية من 100:
- pronunciationScore: جودة نطق الكلمات بصورة عامة.
- fluencyScore: الطلاقة والاستمرار دون توقفات غير طبيعية.
- clarityScore: وضوح الكلام.
- accuracyScore: مدى مطابقة ما قرأه الطالب للجملة النموذجية.
- overallScore: تقييم متوازن للأداء كله.

قواعد مهمة:
- اكتب transcript لما تسمعه فعلًا.
- لا تفترض أن الطالب أخطأ إذا كان التسجيل غير واضح.
- لا تدّعِ تحديد مخرج حرف بدقة إذا لم يكن ذلك واضحًا في التسجيل.
- لا تستخدم لغة محبطة.
- strengths: نقاط القوة القصيرة.
- improvements: خطوات عملية للتحسين.
- wordsToPractice: الكلمات التي تستحق إعادة التدريب فقط عندما يكون لديك سبب واضح.
- feedback: تعليق تربوي قصير مناسب لطالب.
- لا تستخدم Markdown.
- أرجع JSON فقط.

الشكل:

{
  "transcript": "",
  "overallScore": 0,
  "pronunciationScore": 0,
  "fluencyScore": 0,
  "clarityScore": 0,
  "accuracyScore": 0,
  "strengths": [],
  "improvements": [],
  "wordsToPractice": [],
  "feedback": ""
}
`;

    const ai =
      new GoogleGenAI({
        apiKey,
      });

    const response =
      await ai.models
        .generateContent({
          model,

          contents: [
            {
              text:
                prompt,
            },
            {
              inlineData: {
                mimeType:
                  "audio/wav",

                data:
                  base64,
              },
            },
          ],

          config: {
            temperature:
              0.1,
          },
        });

    const raw =
      response.text?.trim() ??
      "";

    if (!raw) {
      throw new Error(
        "Empty audio evaluation."
      );
    }

    const parsed =
      JSON.parse(
        extractJson(raw)
      ) as Partial<AudioEvaluation>;

    const evaluation:
      AudioEvaluation = {
        transcript:
          typeof parsed
            .transcript ===
            "string"
            ? parsed
                .transcript
                .trim()
            : "",

        overallScore:
          clampScore(
            parsed
              .overallScore
          ),

        pronunciationScore:
          clampScore(
            parsed
              .pronunciationScore
          ),

        fluencyScore:
          clampScore(
            parsed
              .fluencyScore
          ),

        clarityScore:
          clampScore(
            parsed
              .clarityScore
          ),

        accuracyScore:
          clampScore(
            parsed
              .accuracyScore
          ),

        strengths:
          stringArray(
            parsed.strengths
          ),

        improvements:
          stringArray(
            parsed.improvements
          ),

        wordsToPractice:
          stringArray(
            parsed
              .wordsToPractice
          ),

        feedback:
          typeof parsed
            .feedback ===
            "string"
            ? parsed
                .feedback
                .trim()
            : "أحسنت. استمع إلى النموذج وحاول مرة أخرى.",
      };

    return NextResponse.json({
      ok: true,
      evaluation,
    });
  }
  catch (error) {
    // Provider errors can include request or infrastructure details.
    console.error(
      "SPEAKING_AUDIO_EVALUATION_FAILED:",
      error instanceof Error ? error.name : "UnknownError",
    );

    return NextResponse.json(
      {
        ok: false,
        error: "تعذر تقييم التسجيل الآن. حاول مرة أخرى.",
      },
      {
        status: 500,
      }
    );
  }
}
