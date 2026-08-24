import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  askAI,
} from "@/importer/ai/client";

type Difficulty =
  | "starter"
  | "foundation"
  | "guided"
  | "standard"
  | "challenge";

type ListeningQuestion = {
  question: string;
  options: string[];
  correct: string;
  explanation: string;
  skill:
    | "direct"
    | "vocabulary"
    | "sequence"
    | "inference"
    | "main_idea";
};

type ListeningExercise = {
  title: string;
  passage: string;
  questions: ListeningQuestion[];
};

const allowed =
  new Set<Difficulty>([
    "starter",
    "foundation",
    "guided",
    "standard",
    "challenge",
  ]);

const config: Record<
  Difficulty,
  {
    label: string;
    questions: number;
    instructions: string;
  }
> = {
  starter: {
    label: "استكشافي",
    questions: 2,
    instructions:
      "استخدم نصًا عربيًا بسيطًا جدًا من 25 إلى 40 كلمة، وجملًا قصيرة. اجعل السؤالين في الفهم المباشر فقط تقريبًا.",
  },

  foundation: {
    label: "تأسيسي",
    questions: 3,
    instructions:
      "استخدم نصًا من 40 إلى 60 كلمة. اختبر الفهم المباشر ومعنى كلمة سهلة من السياق.",
  },

  guided: {
    label: "موجّه",
    questions: 4,
    instructions:
      "استخدم نصًا من 60 إلى 85 كلمة. نوّع بين التفاصيل والمفردات وترتيب الأحداث، مع استنتاج بسيط واحد.",
  },

  standard: {
    label: "متوسط",
    questions: 4,
    instructions:
      "استخدم نصًا من 85 إلى 120 كلمة. اختبر الفكرة الرئيسية والتفاصيل والمفردات والاستنتاج.",
  },

  challenge: {
    label: "تحدٍّ",
    questions: 5,
    instructions:
      "استخدم نصًا من 120 إلى 160 كلمة، أكثر ثراءً لغويًا. اختبر الفكرة الرئيسية والاستنتاج والعلاقات بين الأحداث والمفردات والسياق.",
  },
};

function cleanJson(
  value: string
) {
  const cleaned =
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

  const start =
    cleaned.indexOf("{");

  const end =
    cleaned.lastIndexOf("}");

  if (
    start >= 0 &&
    end > start
  ) {
    return cleaned.slice(
      start,
      end + 1
    );
  }

  return cleaned;
}

function fallbackExercise(
  difficulty: Difficulty
): ListeningExercise {
  if (
    difficulty ===
    "starter"
  ) {
    return {
      title:
        "زيارة الحديقة",

      passage:
        "ذَهَبَ سَامِرٌ مَعَ أُسْرَتِهِ إِلَى الحَدِيقَةِ صَبَاحًا. لَعِبَ بِالكُرَةِ مَعَ أَخِيهِ، ثُمَّ جَلَسَتِ الأُسْرَةُ تَحْتَ شَجَرَةٍ كَبِيرَةٍ.",

      questions: [
        {
          question:
            "أين ذهب سامر مع أسرته؟",

          options: [
            "إلى الحديقة",
            "إلى المدرسة",
            "إلى السوق",
          ],

          correct:
            "إلى الحديقة",

          explanation:
            "ذكر النص أن سامر ذهب مع أسرته إلى الحديقة.",

          skill: "direct" as const,
        },

        {
          question:
            "ماذا فعل سامر في الحديقة؟",

          options: [
            "لعب بالكرة",
            "قرأ كتابًا",
            "ذهب للنوم",
          ],

          correct:
            "لعب بالكرة",

          explanation:
            "قال النص إن سامر لعب بالكرة مع أخيه.",

          skill: "direct" as const,
        },
      ],
    };
  }

  return {
    title:
      "المكتبة الصغيرة",

    passage:
      "افتتحت المدرسة مكتبة صغيرة ليستفيد منها الطلاب في أوقات الفراغ. رتبت المعلمة الكتب في أقسام، منها القصص والعلوم والتاريخ. اعتاد خالد زيارة المكتبة بعد انتهاء الحصة الأخيرة، وكان يختار كل أسبوع كتابًا جديدًا. ومع مرور الوقت أصبح أكثر حبًا للقراءة، وبدأ يشارك زملاءه ما يتعلمه من الكتب.",

    questions: [
      {
        question:
          "لماذا افتتحت المدرسة المكتبة؟",

        options: [
          "ليستفيد منها الطلاب",
          "لحفظ الأدوات الرياضية",
          "لعقد الاجتماعات",
        ],

        correct:
          "ليستفيد منها الطلاب",

        explanation:
          "ذكر النص أن المكتبة افتتحت ليستفيد منها الطلاب في أوقات الفراغ.",

        skill: "direct" as const,
      },

      {
        question:
          "متى كان خالد يزور المكتبة؟",

        options: [
          "بعد الحصة الأخيرة",
          "قبل وصوله إلى المدرسة",
          "في منتصف الليل",
        ],

        correct:
          "بعد الحصة الأخيرة",

        explanation:
          "ورد في النص أنه اعتاد زيارتها بعد انتهاء الحصة الأخيرة.",

        skill: "direct" as const,
      },

      {
        question:
          "ما أثر القراءة في خالد؟",

        options: [
          "أصبح أكثر حبًا للقراءة",
          "توقف عن زيارة المكتبة",
          "كره مشاركة زملائه",
        ],

        correct:
          "أصبح أكثر حبًا للقراءة",

        explanation:
          "يوضح النص أن استمرار خالد في القراءة زاد حبه لها.",

        skill: "inference" as const,
      },

      {
        question:
          "ما الفكرة الرئيسية للنص؟",

        options: [
          "أثر المكتبة والقراءة في الطالب",
          "كيفية بناء مدرسة جديدة",
          "أهمية ممارسة الرياضة",
        ],

        correct:
          "أثر المكتبة والقراءة في الطالب",

        explanation:
          "يدور النص حول المكتبة وعادة خالد في القراءة وأثر ذلك فيه.",

        skill: "main_idea" as const,
      },

      {
        question:
          "أي كلمة تدل على الاستمرار والتكرار؟",

        options: [
          "اعتاد",
          "افتتحت",
          "رتبت",
        ],

        correct:
          "اعتاد",

        explanation:
          "كلمة اعتاد تدل على أن خالد كان يفعل ذلك بصورة متكررة.",

        skill: "vocabulary" as const,
      },
    ].slice(
      0,
      config[difficulty]
        .questions
    ),
  };
}

export async function POST(
  request: Request
) {
  try {
    const supabase =
      await createClient();

    const {
      data: { user },
    } =
      await supabase.auth
        .getUser();

    if (!user) {
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
        difficulty?: unknown;
      };

    const requested =
      typeof body.difficulty ===
        "string"
        ? body.difficulty
        : "starter";

    const difficulty:
      Difficulty =
      allowed.has(
        requested as
          Difficulty
      )
        ? requested as
            Difficulty
        : "starter";

    const settings =
      config[difficulty];

    const prompt = `
أنت "ضاد"، معلم متخصص في تعليم اللغة العربية.

أنشئ تدريب استماع جديدًا لطالب في منصة ضاديوم.

المستوى:
${settings.label}

متطلبات المستوى:
${settings.instructions}

عدد الأسئلة المطلوب بالضبط:
${settings.questions}

شروط النص:
- النص مناسب لطالب مدرسة.
- عربي فصيح طبيعي وسهل القراءة بصوت مسموع.
- اختر موضوعًا تربويًا أو حياتيًا مختلفًا قدر الإمكان.
- لا تضع معلومات تحتاج معرفة خارج النص للإجابة عنها.
- لا تجعل الإجابة الصحيحة غامضة.
- لكل سؤال ثلاثة خيارات فقط.
- لا تجعل موضع الإجابة الصحيحة ثابتًا في جميع الأسئلة.
- explanation يشرح الإجابة باختصار.
- استخدم أنواع المهارات عند الحاجة:
  direct
  vocabulary
  sequence
  inference
  main_idea

أرجع JSON فقط بهذا الشكل:

{
  "title": "",
  "passage": "",
  "questions": [
    {
      "question": "",
      "options": ["", "", ""],
      "correct": "",
      "explanation": "",
      "skill": "direct"
    }
  ]
}
`;

    try {
      const raw =
        await askAI(prompt);

      const parsed =
        JSON.parse(
          cleanJson(raw)
        ) as ListeningExercise;

      const valid =
        typeof parsed.title ===
          "string" &&
        typeof parsed.passage ===
          "string" &&
        Array.isArray(
          parsed.questions
        ) &&
        parsed.questions.length ===
          settings.questions &&
        parsed.questions.every(
          question =>
            typeof question.question ===
              "string" &&
            Array.isArray(
              question.options
            ) &&
            question.options.length ===
              3 &&
            question.options.every(
              option =>
                typeof option ===
                "string"
            ) &&
            typeof question.correct ===
              "string" &&
            question.options.includes(
              question.correct
            )
        );

      if (!valid) {
        throw new Error(
          "Generated exercise is invalid."
        );
      }

      return NextResponse.json({
        ok: true,
        difficulty,
        difficultyLabel:
          settings.label,
        source:
          "generated",
        exercise:
          parsed,
      });
    }
    catch (
      generationError
    ) {
      console.warn(
        "ADAPTIVE_LISTENING_GENERATION_FALLBACK:",
        generationError
      );

      return NextResponse.json({
        ok: true,
        difficulty,
        difficultyLabel:
          settings.label,
        source:
          "fallback",
        exercise:
          fallbackExercise(
            difficulty
          ),
      });
    }
  }
  catch (error) {
    console.error(
      "ADAPTIVE_LISTENING_FAILED:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "تعذر إنشاء تدريب الاستماع.",
      },
      {
        status: 500,
      }
    );
  }
}
