import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  AssessmentDifficulty,
  GeneratedAiAssessment,
  SavedAiAssessment,
} from "@/types/ai-assessment";

type StudentSkillRow = {
  skill: string | null;
  score: number | null;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
  error?: {
    message?: string;
    status?: string;
    code?: number;
  };
};

type AssessmentInsertRow = {
  id: string;
  title: string;
  passage: string;
  question: string;
  choices: unknown;
  correct_answer: number;
  explanation: string | null;
  skill: string | null;
  difficulty: string | null;
  completed: boolean | null;
  created_at: string | null;
};

function clampScore(score: number | null): number {
  return Math.max(0, Math.min(100, Math.round(score ?? 0)));
}

function getDifficulty(score: number): AssessmentDifficulty {
  if (score < 45) return "easy";
  if (score < 75) return "medium";
  return "hard";
}

function asNonEmptyString(
  value: unknown,
  fallback: string
): string {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : fallback;
}

function normalizeChoices(
  value: unknown
): [string, string, string, string] {
  if (!Array.isArray(value) || value.length !== 4) {
    throw new Error(
      "Gemini لم يُرجع أربعة اختيارات صالحة."
    );
  }

  const choices = value.map((choice) =>
    asNonEmptyString(choice, "")
  );

  if (choices.some((choice) => !choice)) {
    throw new Error(
      "أحد اختيارات السؤال فارغ أو غير صالح."
    );
  }

  return choices as [string, string, string, string];
}

function normalizeCorrectAnswer(value: unknown): number {
  const answer = Number(value);

  if (
    !Number.isInteger(answer) ||
    answer < 0 ||
    answer > 3
  ) {
    throw new Error(
      "رقم الإجابة الصحيحة يجب أن يكون من 0 إلى 3."
    );
  }

  return answer;
}

function normalizeDifficulty(
  value: unknown,
  fallback: AssessmentDifficulty
): AssessmentDifficulty {
  return value === "easy" ||
    value === "medium" ||
    value === "hard"
    ? value
    : fallback;
}

function parseGeminiAssessment(
  rawText: string,
  fallbackSkill: string,
  fallbackDifficulty: AssessmentDifficulty
): GeneratedAiAssessment {
  const cleanedText = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: Record<string, unknown>;

  try {
    parsed = JSON.parse(cleanedText) as Record<
      string,
      unknown
    >;
  } catch {
    throw new Error(
      "تعذر قراءة استجابة Gemini كبيانات JSON."
    );
  }

  return {
    title: asNonEmptyString(
      parsed.title,
      `تدريب في ${fallbackSkill}`
    ),
    passage: asNonEmptyString(
      parsed.passage,
      "اقرأ السؤال بعناية ثم اختر الإجابة الصحيحة."
    ),
    question: asNonEmptyString(
      parsed.question,
      "ما الإجابة الصحيحة؟"
    ),
    choices: normalizeChoices(parsed.choices),
    correctAnswer: normalizeCorrectAnswer(
      parsed.correctAnswer
    ),
    explanation: asNonEmptyString(
      parsed.explanation,
      "راجع النص وحدد الدليل الذي يقود إلى الإجابة."
    ),
    skill: asNonEmptyString(
      parsed.skill,
      fallbackSkill
    ),
    difficulty: normalizeDifficulty(
      parsed.difficulty,
      fallbackDifficulty
    ),
  };
}

function buildPrompt(params: {
  studentName: string;
  skill: string;
  score: number;
  difficulty: AssessmentDifficulty;
}): string {
  return `
أنت معلم لغة عربية متخصص في التقويم التكيفي داخل منصة ضاديوم.

أنشئ سؤال اختيار من متعدد واحدًا فقط للطالب:
- اسم الطالب: ${params.studentName}
- المهارة المستهدفة: ${params.skill}
- مستوى الطالب في المهارة: ${params.score} من 100
- مستوى الصعوبة المطلوب: ${params.difficulty}

الشروط:
1. استخدم العربية الفصحى الواضحة.
2. اجعل المحتوى مناسبًا لطالب مدرسة، وخاليًا من الموضوعات الحساسة.
3. أنشئ قطعة قصيرة من 50 إلى 100 كلمة عند الحاجة.
4. أنشئ سؤالًا واحدًا له أربعة اختيارات فقط.
5. يجب أن يكون هناك اختيار صحيح واحد بوضوح.
6. correctAnswer هو رقم فهرس الإجابة الصحيحة ويبدأ من 0 وينتهي عند 3.
7. اكتب شرحًا تعليميًا موجزًا يوضح سبب صحة الإجابة.
8. لا تستخدم Markdown.
9. أعد كائن JSON فقط وبالمفاتيح التالية تمامًا:

{
  "title": "عنوان التدريب",
  "passage": "القطعة أو السياق",
  "question": "السؤال",
  "choices": ["الاختيار الأول", "الاختيار الثاني", "الاختيار الثالث", "الاختيار الرابع"],
  "correctAnswer": 0,
  "explanation": "شرح الإجابة",
  "skill": "${params.skill}",
  "difficulty": "${params.difficulty}"
}
`.trim();
}

async function callGemini(
  prompt: string
): Promise<{
  assessment: GeneratedAiAssessment;
  provider: "gemini";
  model: string;
}> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const model =
    process.env.GEMINI_MODEL?.trim() ||
    "gemini-2.5-flash";

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY غير موجود داخل ملف .env.local."
    );
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.65,
          responseMimeType: "application/json",
        },
      }),
      cache: "no-store",
    }
  );

  const payload =
    (await response.json()) as GeminiResponse;

  if (!response.ok || payload.error) {
    throw new Error(
      payload.error?.message ||
        `فشل اتصال Gemini برمز ${response.status}.`
    );
  }

  if (payload.promptFeedback?.blockReason) {
    throw new Error(
      `تم حظر الطلب: ${payload.promptFeedback.blockReason}`
    );
  }

  const text =
    payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim();

  if (!text) {
    throw new Error(
      "لم يُرجع Gemini محتوى صالحًا."
    );
  }

  const skillMatch = prompt.match(
    /المهارة المستهدفة:\s*(.+)/
  );
  const difficultyMatch = prompt.match(
    /مستوى الصعوبة المطلوب:\s*(easy|medium|hard)/
  );

  const fallbackSkill =
    skillMatch?.[1]?.trim() || "الاستيعاب القرائي";

  const fallbackDifficulty =
    (difficultyMatch?.[1] as AssessmentDifficulty) ||
    "medium";

  return {
    assessment: parseGeminiAssessment(
      text,
      fallbackSkill,
      fallbackDifficulty
    ),
    provider: "gemini",
    model,
  };
}

function mapSavedAssessment(
  row: AssessmentInsertRow
): SavedAiAssessment {
  return {
    id: row.id,
    title: row.title,
    passage: row.passage,
    question: row.question,
    choices: normalizeChoices(row.choices),
    correctAnswer: row.correct_answer,
    explanation:
      row.explanation ??
      "راجع النص وحدد الدليل الصحيح.",
    skill: row.skill ?? "مهارة عامة",
    difficulty: normalizeDifficulty(
      row.difficulty,
      "medium"
    ),
    completed: Boolean(row.completed),
    createdAt: row.created_at,
  };
}

export async function generateAndSaveAssessment(
  supabase: SupabaseClient,
  studentEmail: string,
  studentName = "بطل ضاديوم"
): Promise<{
  assessment: SavedAiAssessment;
  provider: "gemini";
  model: string;
}> {
  const { data: skillRows, error: skillsError } =
    await supabase
      .from("student_skills")
      .select("skill, score")
      .eq("student_email", studentEmail)
      .order("score", { ascending: true })
      .limit(1);

  if (skillsError) {
    console.warn("AI_ASSESSMENT_SKILLS_WARNING", {
      message: skillsError.message,
      details: skillsError.details,
      hint: skillsError.hint,
      code: skillsError.code,
    });
  }

  const weakestSkill =
    (skillRows?.[0] as StudentSkillRow | undefined) ??
    null;

  const skill =
    weakestSkill?.skill?.trim() ||
    "الاستيعاب القرائي";

  const score = clampScore(weakestSkill?.score ?? 50);
  const difficulty = getDifficulty(score);

  const generated = await callGemini(
    buildPrompt({
      studentName,
      skill,
      score,
      difficulty,
    })
  );

  const { data: savedRow, error: insertError } =
    await supabase
      .from("ai_assessments")
      .insert({
        student_email: studentEmail,
        title: generated.assessment.title,
        passage: generated.assessment.passage,
        question: generated.assessment.question,
        choices: generated.assessment.choices,
        correct_answer:
          generated.assessment.correctAnswer,
        explanation:
          generated.assessment.explanation,
        skill: generated.assessment.skill,
        difficulty:
          generated.assessment.difficulty,
        completed: false,
      })
      .select(
        `
          id,
          title,
          passage,
          question,
          choices,
          correct_answer,
          explanation,
          skill,
          difficulty,
          completed,
          created_at
        `
      )
      .single();

  if (insertError || !savedRow) {
    throw new Error(
      insertError?.message ||
        "تعذر حفظ التقييم في قاعدة البيانات."
    );
  }

  return {
    assessment: mapSavedAssessment(
      savedRow as AssessmentInsertRow
    ),
    provider: generated.provider,
    model: generated.model,
  };
}
