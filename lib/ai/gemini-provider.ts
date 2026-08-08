import { GoogleGenAI } from "@google/genai";

import type {
  AIProvider,
  AiLearningPlan,
  AiRecommendation,
  StudentAiContext,
} from "./provider";

type GeminiRecommendationResponse = {
  title?: unknown;
  message?: unknown;
  priority?: unknown;
  lessonId?: unknown;
};

type GeminiLearningPlanResponse = {
  title?: unknown;
  message?: unknown;
  priority?: unknown;
  focusSkill?: unknown;
  recommendedLesson?: unknown;
  practiceType?: unknown;
  dailyGoal?: unknown;
  motivation?: unknown;
};

const RECOMMENDATION_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    message: { type: "string" },
    priority: {
      type: "string",
      enum: ["low", "medium", "high"],
    },
    lessonId: {
      anyOf: [
        { type: "string" },
        { type: "null" },
      ],
    },
  },
  required: [
    "title",
    "message",
    "priority",
    "lessonId",
  ],
  additionalProperties: false,
} as const;

const LEARNING_PLAN_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    message: { type: "string" },
    priority: {
      type: "string",
      enum: ["low", "medium", "high"],
    },
    focusSkill: {
      anyOf: [
        { type: "string" },
        { type: "null" },
      ],
    },
    recommendedLesson: {
      anyOf: [
        { type: "string" },
        { type: "null" },
      ],
    },
    practiceType: {
      type: "string",
      enum: ["lesson", "quiz", "reading"],
    },
    dailyGoal: {
      anyOf: [
        { type: "string" },
        { type: "null" },
      ],
    },
    motivation: {
      anyOf: [
        { type: "string" },
        { type: "null" },
      ],
    },
  },
  required: [
    "title",
    "message",
    "priority",
    "focusSkill",
    "recommendedLesson",
    "practiceType",
    "dailyGoal",
    "motivation",
  ],
  additionalProperties: false,
} as const;

function normalizePriority(
  value: unknown
): AiRecommendation["priority"] {
  if (
    value === "low" ||
    value === "medium" ||
    value === "high"
  ) {
    return value;
  }

  return "medium";
}

function nullableText(
  value: unknown
): string | null {
  return typeof value === "string" &&
    value.trim()
    ? value.trim()
    : null;
}

function parseJson<T>(
  responseText: string,
  errorMessage: string
): T {
  try {
    return JSON.parse(responseText) as T;
  } catch {
    throw new Error(errorMessage);
  }
}

function parseRecommendation(
  responseText: string
): AiRecommendation {
  const parsed =
    parseJson<GeminiRecommendationResponse>(
      responseText,
      "أعاد Gemini توصية غير صالحة بصيغة JSON."
    );

  const title = nullableText(parsed.title);
  const message = nullableText(parsed.message);

  if (!title || !message) {
    throw new Error(
      "استجابة Gemini لا تحتوي على توصية صالحة."
    );
  }

  return {
    title,
    message,
    priority: normalizePriority(parsed.priority),
    lessonId: nullableText(parsed.lessonId),
  };
}

function parseLearningPlan(
  responseText: string
): AiLearningPlan {
  const parsed =
    parseJson<GeminiLearningPlanResponse>(
      responseText,
      "أعاد Gemini خطة تعلم غير صالحة بصيغة JSON."
    );

  const title = nullableText(parsed.title);
  const message = nullableText(parsed.message);

  if (!title || !message) {
    throw new Error(
      "استجابة Gemini لا تحتوي على خطة تعلم صالحة."
    );
  }

  const practiceType =
    parsed.practiceType === "lesson" ||
    parsed.practiceType === "reading"
      ? parsed.practiceType
      : "quiz";

  return {
    title,
    message,
    priority: normalizePriority(parsed.priority),
    focusSkill: nullableText(parsed.focusSkill),
    recommendedLesson: nullableText(
      parsed.recommendedLesson
    ),
    practiceType,
    dailyGoal: nullableText(parsed.dailyGoal),
    motivation: nullableText(parsed.motivation),
  };
}

export class GeminiAIProvider implements AIProvider {
  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor(apiKey: string, model?: string) {
    const normalizedApiKey = apiKey.trim();

    if (!normalizedApiKey) {
      throw new Error("GEMINI_API_KEY غير موجود.");
    }

    this.client = new GoogleGenAI({
      apiKey: normalizedApiKey,
    });

    this.model =
      model?.trim() || "gemini-3.6-flash";
  }

  async generateRecommendation(
    context: StudentAiContext
  ): Promise<AiRecommendation> {
    const prompt = `
أنت "معلم ضاديوم الذكي"، مساعد تربوي متخصص في تعليم اللغة العربية.

أنشئ توصية تعليمية شخصية واحدة اعتمادًا فقط على بيانات الطالب التالية:
${JSON.stringify(context, null, 2)}

القواعد:
- اكتب بالعربية الفصحى السهلة.
- استخدم أسلوبًا دافئًا ومحفزًا.
- لا تخترع بيانات غير موجودة.
- اجعل lessonId يساوي null.
`.trim();

    const response =
      await this.client.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseJsonSchema:
            RECOMMENDATION_SCHEMA,
        },
      });

    const responseText =
      response.text?.trim() ?? "";

    if (!responseText) {
      throw new Error(
        "لم يُرجع Gemini أي توصية."
      );
    }

    return parseRecommendation(responseText);
  }

  async generateLearningPlan(
    context: StudentAiContext
  ): Promise<AiLearningPlan> {
    const prompt = `
أنت معلم لغة عربية خبير داخل منصة "ضاديوم".

حلل بيانات الطالب التالية، ثم أنشئ خطة تعلم شخصية ليوم واحد:
${JSON.stringify(context, null, 2)}

ذاكرة الطالب طويلة المدى: ${context.memorySummary ?? "لا توجد ذاكرة تعلم كافية حتى الآن."}

المهارات المستخدمة في آخر الخطط: ${
      context.recentFocusSkills?.length
        ? context.recentFocusSkills.join("، ")
        : "لا توجد خطط سابقة."
    }

قواعد التنويع:
- لا تختر المهارة نفسها الموجودة في آخر خطة إلا إذا انخفض مستواها عن 70%.
- لا تكرر مهارة واحدة في خطتين متتاليتين عند إتقانها.
- اختر المهارة التالية فقط وفق هذا التسلسل: الاستنتاج، التحليل، التقويم، التعبير، التذوق.
- اجعل focusSkill مختلفًا عن آخر مهارة متقنة.

القواعد الأساسية:
- ركز على مهارة واحدة فقط تحتاج إلى التطوير.
- اجعل الخطة عملية ويمكن تنفيذها في مدة قصيرة.
- استخدم العربية الفصحى السهلة وأسلوبًا دافئًا.
- لا تخترع درجات أو أخطاء أو دروسًا غير موجودة.
- اجعل recommendedLesson يساوي null؛ لأن السياق لا يحتوي على معرّفات دروس موثوقة.
- اختر practiceType من lesson أو quiz أو reading فقط.
- استخدم high عندما تكون أضعف مهارة أقل من 60.
- اجعل dailyGoal هدفًا زمنيًا واضحًا مثل "15 دقيقة".
- اكتب motivation في جملة قصيرة موجهة للطالب.

قواعد اختيار الخطة:
1. إذا كانت المهارة الأضعف أقل من 70%، اجعلها محور الخطة.
2. إذا كانت جميع المهارات 85% أو أكثر، اختر مهارة جديدة أو مستوى أصعب.
3. إذا وصلت المهارة الحالية إلى 100%، لا تكرر التدريب الأساسي عليها.
4. عند الإتقان الكامل، انتقل وفق هذا التسلسل فقط:
   - الاستنتاج
   - التحليل
   - التقويم
   - التعبير
   - التذوق
5. يجب أن تتدرج الخطة ولا تبقي الطالب في المستوى نفسه.
6. اجعل focusSkill تمثل المهارة التالية التي ينبغي تطويرها، لا المهارة المتقنة فقط.
`.trim();

    try {
      const response =
        await this.client.models.generateContent({
          model: this.model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseJsonSchema:
              LEARNING_PLAN_SCHEMA,
          },
        });

      const responseText =
        response.text?.trim() ?? "";

      if (!responseText) {
        throw new Error(
          "لم يُرجع Gemini أي خطة تعلم."
        );
      }

      return parseLearningPlan(responseText);
    } catch (error) {
      console.warn(
        "GEMINI_LEARNING_PLAN_ERROR",
        {
          model: this.model,
          message:
            error instanceof Error
              ? error.message
              : String(error),
        }
      );

      throw error;
    }
  }
}