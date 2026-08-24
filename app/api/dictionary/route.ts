import {
  NextResponse,
} from "next/server";

import {
  askAI,
} from "@/importer/ai/client";

type DictionaryRequest = {
  text?: unknown;
  targetWord?: unknown;
};

type DictionaryWord = {
  word: string;
  type: string;
  meaning: string;
};

type ContextAnalysis = {
  word: string;
  normalizedWord: string;
  type: string;
  meaningInContext: string;
  simpleMeaning: string;
  synonyms: string[];
  antonyms: string[];
  root: string | null;
  pattern: string | null;
  example: string;
  explanation: string;
};

type DictionaryResult = {
  sentence: string;
  targetWord: string | null;
  analysis: ContextAnalysis | null;
  words: DictionaryWord[];
};

function cleanText(
  value: unknown
): string {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

function stringArray(
  value: unknown
): string[] {
  return Array.isArray(value)
    ? value
        .filter(
          (item):
            item is string =>
            typeof item ===
              "string"
        )
        .map(
          (item) =>
            item.trim()
        )
        .filter(Boolean)
    : [];
}

function asRecord(
  value: unknown
): Record<
  string,
  unknown
> {
  return (
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(value)
  )
    ? value as Record<
        string,
        unknown
      >
    : {};
}

function parseJsonResponse(
  raw: string
): unknown {
  const cleaned =
    raw
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

  try {
    return JSON.parse(
      cleaned
    );
  } catch {
    const firstBrace =
      cleaned.indexOf("{");

    const lastBrace =
      cleaned.lastIndexOf("}");

    if (
      firstBrace >= 0 &&
      lastBrace > firstBrace
    ) {
      return JSON.parse(
        cleaned.slice(
          firstBrace,
          lastBrace + 1
        )
      );
    }

    throw new Error(
      "Invalid dictionary AI response."
    );
  }
}

function normalizeResult(
  value: unknown,
  sentence: string,
  requestedWord: string
): DictionaryResult {
  const root =
    asRecord(value);

  const rawAnalysis =
    asRecord(
      root.analysis
    );

  const rawWords =
    Array.isArray(
      root.words
    )
      ? root.words
      : [];

  const words:
    DictionaryWord[] =
      rawWords
        .map(
          (item) => {
            const row =
              asRecord(item);

            const word =
              cleanText(
                row.word
              );

            if (!word) {
              return null;
            }

            return {
              word,

              type:
                cleanText(
                  row.type
                ) ||
                "غير محدد",

              meaning:
                cleanText(
                  row.meaning
                ) ||
                "المعنى غير متاح",
            };
          }
        )
        .filter(
          (
            item
          ): item is DictionaryWord =>
            item !== null
        );

  const analysisWord =
    cleanText(
      rawAnalysis.word
    );

  const analysis:
    ContextAnalysis | null =
      analysisWord
        ? {
            word:
              analysisWord,

            normalizedWord:
              cleanText(
                rawAnalysis
                  .normalizedWord
              ) ||
              analysisWord,

            type:
              cleanText(
                rawAnalysis.type
              ) ||
              "غير محدد",

            meaningInContext:
              cleanText(
                rawAnalysis
                  .meaningInContext
              ),

            simpleMeaning:
              cleanText(
                rawAnalysis
                  .simpleMeaning
              ),

            synonyms:
              stringArray(
                rawAnalysis
                  .synonyms
              ),

            antonyms:
              stringArray(
                rawAnalysis
                  .antonyms
              ),

            root:
              cleanText(
                rawAnalysis.root
              ) ||
              null,

            pattern:
              cleanText(
                rawAnalysis.pattern
              ) ||
              null,

            example:
              cleanText(
                rawAnalysis.example
              ),

            explanation:
              cleanText(
                rawAnalysis
                  .explanation
              ),
          }
        : null;

  return {
    sentence:
      cleanText(
        root.sentence
      ) ||
      sentence,

    targetWord:
      cleanText(
        root.targetWord
      ) ||
      requestedWord ||
      analysis?.word ||
      null,

    analysis,

    words,
  };
}

export async function POST(
  request: Request
) {
  try {
    const body =
      await request
        .json() as
        DictionaryRequest;

    const text =
      cleanText(
        body.text
      );

    const targetWord =
      cleanText(
        body.targetWord
      );

    if (!text) {
      return NextResponse.json(
        {
          success: false,
          error:
            "اكتب كلمة أو جملة أولًا.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      text.length > 600
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "النص طويل جدًا. استخدم جملة قصيرة أو فقرة صغيرة.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      targetWord.length > 80
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "الكلمة المطلوبة طويلة جدًا.",
        },
        {
          status: 400,
        }
      );
    }

    const prompt = `
أنت "قاموس ضاديوم السياقي"، متخصص في تعليم اللغة العربية للطلاب.

مهمتك فهم معنى الكلمة داخل السياق، وليس إعطاء معنى معجمي عام فقط.

النص:
${text}

الكلمة التي يريد المستخدم تحليلها:
${targetWord || "اختر أهم كلمة مناسبة من النص للتحليل"}

القواعد:
- استخدم العربية الفصحى السهلة.
- حدد معنى الكلمة حسب السياق الموجود فقط.
- إذا كان للكلمة أكثر من معنى، اشرح لماذا هذا المعنى هو الأنسب هنا.
- لا تخترع جذرًا أو وزنًا صرفيًا إذا لم تكن واثقًا.
- اجعل المعنى المبسط مناسبًا لطالب مدرسة.
- أعط مرادفات وأضدادًا فقط عندما تكون صحيحة ومناسبة.
- أنشئ مثالًا عربيًا قصيرًا جديدًا يستخدم الكلمة بالمعنى نفسه.
- حلل كلمات الجملة المهمة تحليلًا موجزًا.
- أعد JSON فقط دون Markdown أو شرح خارجه.

استخدم الشكل التالي حرفيًا:

{
  "sentence": "...",
  "targetWord": "...",
  "analysis": {
    "word": "...",
    "normalizedWord": "...",
    "type": "اسم أو فعل أو حرف أو وصف أدق",
    "meaningInContext": "...",
    "simpleMeaning": "...",
    "synonyms": ["..."],
    "antonyms": ["..."],
    "root": "..." أو null,
    "pattern": "..." أو null,
    "example": "...",
    "explanation": "..."
  },
  "words": [
    {
      "word": "...",
      "type": "...",
      "meaning": "..."
    }
  ]
}
`;

    const aiResponse =
      (
        await askAI(
          prompt
        )
      ).trim();

    const parsed =
      parseJsonResponse(
        aiResponse
      );

    const result =
      normalizeResult(
        parsed,
        text,
        targetWord
      );

    if (
      !result.analysis &&
      result.words.length ===
        0
    ) {
      throw new Error(
        "Empty dictionary analysis."
      );
    }

    return NextResponse.json({
      success: true,
      result,
    });

  } catch (error) {
    console.error(
      "Dictionary request failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "تعذر تحليل الكلمة الآن. حاول مرة أخرى.",
      },
      {
        status: 500,
      }
    );
  }
}
