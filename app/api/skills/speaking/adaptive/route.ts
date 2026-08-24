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

type SpeakingTask = {
  title: string;
  prompt: string;
  referenceText: string;
  tips: string[];
  minimumSeconds: number;
  targetSeconds: number;
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
    minimumSeconds: number;
    targetSeconds: number;
    instructions: string;
  }
> = {
  starter: {
    label: "استكشافي",
    minimumSeconds: 5,
    targetSeconds: 10,
    instructions:
      "اجعل المهمة تقليد جملة عربية فصيحة قصيرة جدًا من 5 إلى 9 كلمات. referenceText يجب أن يحتوي الجملة التي سيقرأها الطالب.",
  },

  foundation: {
    label: "تأسيسي",
    minimumSeconds: 8,
    targetSeconds: 15,
    instructions:
      "اجعل الطالب يقرأ جملتين قصيرتين مترابطتين. referenceText يجب أن يحتوي النص المطلوب قراءته.",
  },

  guided: {
    label: "موجّه",
    minimumSeconds: 15,
    targetSeconds: 25,
    instructions:
      "اطلب من الطالب وصف موقف يومي بسيط في عدة جمل. ضع في referenceText كلمات أو بداية مقترحة تساعده، وليس إجابة كاملة.",
  },

  standard: {
    label: "متوسط",
    minimumSeconds: 25,
    targetSeconds: 40,
    instructions:
      "اطلب حديثًا قصيرًا منظمًا حول موضوع قريب من حياة الطالب، مع بداية وفكرة رئيسية وخاتمة. referenceText يحتوي نقاطًا إرشادية قصيرة فقط.",
  },

  challenge: {
    label: "تحدٍّ",
    minimumSeconds: 35,
    targetSeconds: 60,
    instructions:
      "اطلب تعبيرًا شفهيًا أعمق يتضمن رأيًا أو تفسيرًا أو مقارنة مع ذكر سبب أو مثال. referenceText يحتوي عناصر إرشادية فقط.",
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

function fallbackTask(
  difficulty: Difficulty
): SpeakingTask {
  const settings =
    config[difficulty];

  if (
    difficulty ===
    "starter"
  ) {
    return {
      title:
        "أقرأ بصوت واضح",

      prompt:
        "استمع إلى الجملة في ذهنك، ثم اقرأها بصوت واضح وهادئ.",

      referenceText:
        "أُحِبُّ أَنْ أَقْرَأَ كُلَّ يَوْمٍ.",

      tips: [
        "تحدث بهدوء.",
        "انطق كل كلمة بوضوح.",
        "لا تتعجل.",
      ],

      minimumSeconds:
        settings.minimumSeconds,

      targetSeconds:
        settings.targetSeconds,
    };
  }

  if (
    difficulty ===
    "foundation"
  ) {
    return {
      title:
        "أتحدث عن مدرستي",

      prompt:
        "اقرأ الجملتين بصوت واضح ومترابط.",

      referenceText:
        "أَذْهَبُ إِلَى مَدْرَسَتِي فِي الصَّبَاحِ. أَتَعَلَّمُ فِيهَا أَشْيَاءَ جَدِيدَةً.",

      tips: [
        "قف قليلًا بين الجملتين.",
        "انطق الحروف بوضوح.",
        "حافظ على صوت مسموع.",
      ],

      minimumSeconds:
        settings.minimumSeconds,

      targetSeconds:
        settings.targetSeconds,
    };
  }

  if (
    difficulty ===
    "guided"
  ) {
    return {
      title:
        "صف يومًا تحبه",

      prompt:
        "تحدث في عدة جمل عن يوم تحبه، وماذا تفعل فيه، ولماذا تحبه.",

      referenceText:
        "يمكنك البدء: أحب يوم... وفي هذا اليوم... وأشعر بـ...",

      tips: [
        "ابدأ بفكرة واضحة.",
        "استخدم جملًا مترابطة.",
        "اذكر سببًا واحدًا على الأقل.",
      ],

      minimumSeconds:
        settings.minimumSeconds,

      targetSeconds:
        settings.targetSeconds,
    };
  }

  if (
    difficulty ===
    "standard"
  ) {
    return {
      title:
        "هواية مفيدة",

      prompt:
        "تحدث عن هواية تحبها، واشرح كيف تمارسها وما فائدتها لك.",

      referenceText:
        "فكرتك الرئيسية • كيف تمارس الهواية • فائدتها • خاتمة قصيرة",

      tips: [
        "رتب أفكارك قبل التسجيل.",
        "استخدم روابط مثل: لأن، لذلك، ثم.",
        "اختم بجملة تلخص رأيك.",
      ],

      minimumSeconds:
        settings.minimumSeconds,

      targetSeconds:
        settings.targetSeconds,
    };
  }

  return {
    title:
      "التقنية والتعلم",

    prompt:
      "عبّر عن رأيك في استخدام التقنية في التعلم، واذكر فائدة وتحديًا واحدًا على الأقل مع مثال.",

    referenceText:
      "رأيي • الفائدة • التحدي • مثال • الخلاصة",

    tips: [
      "قدّم رأيك بوضوح.",
      "ادعم فكرتك بسبب أو مثال.",
      "استخدم لغة مترابطة.",
    ],

    minimumSeconds:
      settings.minimumSeconds,

    targetSeconds:
      settings.targetSeconds,
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
      error: authError,
    } =
      await supabase.auth
        .getUser();

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
أنت "ضاد"، معلم لغة عربية متخصص في تنمية مهارة التحدث.

أنشئ تدريب تحدث واحدًا مناسبًا لطالب في منصة ضاديوم.

المستوى:
${settings.label}

تعليمات المستوى:
${settings.instructions}

المدة الدنيا:
${settings.minimumSeconds} ثانية

المدة المستهدفة:
${settings.targetSeconds} ثانية

الشروط:
- استخدم العربية الفصحى الواضحة.
- المهمة مناسبة لطالب مدرسة.
- لا تحتاج معرفة خارجية.
- لا تجعل المهمة غامضة.
- أعط ثلاث نصائح قصيرة.
- في المستوى الاستكشافي والتأسيسي يكون referenceText نصًا يقرأه الطالب.
- في المستويات الأعلى يكون referenceText نقاط مساعدة لا نموذج إجابة كاملًا.
- أرجع JSON فقط.

{
  "title": "",
  "prompt": "",
  "referenceText": "",
  "tips": ["", "", ""],
  "minimumSeconds": ${settings.minimumSeconds},
  "targetSeconds": ${settings.targetSeconds}
}
`;

    try {
      const raw =
        await askAI(prompt);

      const parsed =
        JSON.parse(
          cleanJson(raw)
        ) as SpeakingTask;

      const valid =
        typeof parsed.title ===
          "string" &&
        parsed.title.trim().length >
          0 &&
        typeof parsed.prompt ===
          "string" &&
        parsed.prompt.trim().length >
          0 &&
        typeof parsed.referenceText ===
          "string" &&
        Array.isArray(
          parsed.tips
        ) &&
        parsed.tips.length >=
          3;

      if (!valid) {
        throw new Error(
          "Invalid speaking task."
        );
      }

      return NextResponse.json({
        ok: true,

        difficulty,

        difficultyLabel:
          settings.label,

        source:
          "generated",

        task: {
          title:
            parsed.title.trim(),

          prompt:
            parsed.prompt.trim(),

          referenceText:
            parsed.referenceText.trim(),

          tips:
            parsed.tips
              .slice(0, 3),

          minimumSeconds:
            settings.minimumSeconds,

          targetSeconds:
            settings.targetSeconds,
        },
      });
    }
    catch (
      generationError
    ) {
      console.warn(
        "ADAPTIVE_SPEAKING_FALLBACK:",
        generationError
      );

      return NextResponse.json({
        ok: true,

        difficulty,

        difficultyLabel:
          settings.label,

        source:
          "fallback",

        task:
          fallbackTask(
            difficulty
          ),
      });
    }
  }
  catch (error) {
    console.error(
      "ADAPTIVE_SPEAKING_FAILED:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "تعذر إنشاء تدريب التحدث.",
      },
      {
        status: 500,
      }
    );
  }
}
