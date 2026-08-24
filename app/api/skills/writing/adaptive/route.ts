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

type WritingPrompt = {
  title: string;
  prompt: string;
  tips: string[];
  minWords: number;
  targetWords: number;
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
    minWords: number;
    targetWords: number;
    instructions: string;
  }
> = {
  starter: {
    label: "استكشافي",
    minWords: 20,
    targetWords: 35,
    instructions:
      "موضوع بسيط جدًا قريب من حياة الطالب، بجملة توجيهية واضحة، ولا يحتاج معرفة خارجية.",
  },

  foundation: {
    label: "تأسيسي",
    minWords: 30,
    targetWords: 50,
    instructions:
      "موضوع يومي سهل يتطلب وصفًا بسيطًا وتسلسلًا واضحًا للأفكار.",
  },

  guided: {
    label: "موجّه",
    minWords: 45,
    targetWords: 70,
    instructions:
      "موضوع يحتاج مقدمة قصيرة وفكرتين مترابطتين وخاتمة بسيطة.",
  },

  standard: {
    label: "متوسط",
    minWords: 65,
    targetWords: 100,
    instructions:
      "موضوع تعبيري يتطلب تنظيم الأفكار واستخدام أمثلة وروابط بين الجمل.",
  },

  challenge: {
    label: "تحدٍّ",
    minWords: 90,
    targetWords: 140,
    instructions:
      "موضوع أعمق يحتاج رأيًا أو تفسيرًا أو مقارنة مع ترابط لغوي واضح.",
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

function fallbackPrompt(
  difficulty: Difficulty
): WritingPrompt {
  const settings =
    config[difficulty];

  if (
    difficulty ===
    "starter"
  ) {
    return {
      title:
        "يومي الجميل",

      prompt:
        "اكتب فقرة قصيرة عن يوم جميل قضيته مع أسرتك أو أصدقائك.",

      tips: [
        "ابدأ بجملة واضحة.",
        "اذكر ماذا فعلت.",
        "اختم بشعورك في هذا اليوم.",
      ],

      minWords:
        settings.minWords,

      targetWords:
        settings.targetWords,
    };
  }

  return {
    title:
      "مكان أحبه",

    prompt:
      "اكتب فقرة تصف مكانًا تحب زيارته، واذكر سبب حبك له وما الذي تفعله فيه.",

    tips: [
      "استخدم أوصافًا واضحة.",
      "اربط بين الجمل.",
      "راجع علامات الترقيم.",
    ],

    minWords:
      settings.minWords,

    targetWords:
      settings.targetWords,
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
        requested as Difficulty
      )
        ? requested as Difficulty
        : "starter";

    const settings =
      config[difficulty];

    const prompt = `
أنت "ضاد"، معلم كتابة باللغة العربية.

أنشئ موضوع كتابة واحدًا مناسبًا لطالب في منصة ضاديوم.

المستوى:
${settings.label}

متطلبات المستوى:
${settings.instructions}

الحد الأدنى للكلمات:
${settings.minWords}

العدد المستهدف للكلمات:
${settings.targetWords}

الشروط:
- الموضوع مناسب لطالب مدرسة.
- عربي فصيح واضح.
- لا يحتاج معرفة خارجية.
- اجعل المهمة محددة وغير غامضة.
- أعط 3 نصائح قصيرة تساعد الطالب قبل الكتابة.
- لا تكتب نموذج إجابة.
- أرجع JSON فقط.

الشكل:

{
  "title": "",
  "prompt": "",
  "tips": ["", "", ""],
  "minWords": ${settings.minWords},
  "targetWords": ${settings.targetWords}
}
`;

    try {
      const raw =
        await askAI(prompt);

      const parsed =
        JSON.parse(
          cleanJson(raw)
        ) as WritingPrompt;

      const valid =
        typeof parsed.title ===
          "string" &&
        typeof parsed.prompt ===
          "string" &&
        Array.isArray(
          parsed.tips
        ) &&
        parsed.tips.length >=
          3;

      if (!valid) {
        throw new Error(
          "Invalid writing prompt."
        );
      }

      return NextResponse.json({
        ok: true,
        difficulty,
        difficultyLabel:
          settings.label,
        source:
          "generated",
        writingPrompt: {
          ...parsed,
          minWords:
            settings.minWords,
          targetWords:
            settings.targetWords,
        },
      });
    }
    catch (
      generationError
    ) {
      console.warn(
        "ADAPTIVE_WRITING_FALLBACK:",
        generationError
      );

      return NextResponse.json({
        ok: true,
        difficulty,
        difficultyLabel:
          settings.label,
        source:
          "fallback",
        writingPrompt:
          fallbackPrompt(
            difficulty
          ),
      });
    }
  }
  catch (error) {
    console.error(
      "ADAPTIVE_WRITING_FAILED:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "تعذر إنشاء تدريب الكتابة.",
      },
      {
        status: 500,
      }
    );
  }
}
