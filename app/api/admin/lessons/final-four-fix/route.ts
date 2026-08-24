import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  validateActivity,
} from "@/lib/lesson-ai/activity-validator";

type JsonObject =
  Record<string, unknown>;

type Fix = {
  id: string;
  content: JsonObject;
  answer: JsonObject;
};

const fixes: Fix[] = [
  {
    id:
      "d92efbcd-7c4c-4f1e-83e2-a2fb6f9e7ed3",

    content: {
      words: [
        "بدور",
        "جابر",
        "مسبحة",
        "الحليب",
      ],

      source_page: 17,

      items: [
        {
          sentence:
            "أُجَرِّدُ حرف الباء من كلمة: بدور",
        },
        {
          sentence:
            "أُجَرِّدُ حرف الباء من كلمة: جابر",
        },
        {
          sentence:
            "أُجَرِّدُ حرف الباء من كلمة: مسبحة",
        },
        {
          sentence:
            "أُجَرِّدُ حرف الباء من كلمة: الحليب",
        },
      ],
    },

    answer: {
      correct_letter:
        "ب",

      answers: [
        "ب",
        "ب",
        "ب",
        "ب",
      ],
    },
  },

  {
    id:
      "23c154af-daea-47ca-a661-d44629aacc11",

    content: {
      words: [
        "جاموس",
      ],

      image_url:
        "/curriculum/bahrain/grade-01/lesson-13/page-142.jpg",

      audio_text:
        "أكون كلمات مستعينا بالألوان كما في المثال",

      source_page: 142,

      items: [
        {
          sentence:
            "أُكَوِّنُ الكلمة: جاموس",
        },
      ],
    },

    answer: {
      answers: [
        "جاموس",
      ],
    },
  },

  {
    id:
      "22999073-bb36-4456-8c0d-a8a089b13d3c",

    content: {
      words: [
        "نُجُومٌ",
        "نَاقُوسٌ",
        "نِزَارٌ",
        "عَنِيدٌ",
      ],

      image_url:
        "/curriculum/bahrain/grade-01/lesson-14/page-154.jpg",

      audio_text:
        "أجرْد الحرف ن من الكلمات التالية",

      source_page: 154,

      image_region: {
        x: 10,
        y: 48,
        width: 80,
        height: 20,
      },

      items: [
        {
          sentence:
            "أُجَرِّدُ حرف النون من كلمة: نُجُومٌ",
        },
        {
          sentence:
            "أُجَرِّدُ حرف النون من كلمة: نَاقُوسٌ",
        },
        {
          sentence:
            "أُجَرِّدُ حرف النون من كلمة: نِزَارٌ",
        },
        {
          sentence:
            "أُجَرِّدُ حرف النون من كلمة: عَنِيدٌ",
        },
      ],
    },

    answer: {
      answers: [
        "ن",
        "ن",
        "ن",
        "ن",
      ],
    },
  },

  {
    id:
      "104a3af0-e45f-40ab-a1b7-1db769beee15",

    content: {
      words: [
        "حَنَانُ",
        "نُمُورٌ",
        "نَسِيمٌ",
      ],

      image_url:
        "/curriculum/bahrain/grade-01/lesson-14/page-154.jpg",

      audio_text:
        "أقرأ الكلمات الآتية وأحللها إلى مقاطعها",

      source_page: 154,

      image_region: {
        x: 10,
        y: 70,
        width: 80,
        height: 25,
      },

      items: [
        {
          sentence:
            "أُحَلِّلُ الكلمة إلى مقاطع: حَنَانُ",
        },
        {
          sentence:
            "أُحَلِّلُ الكلمة إلى مقاطع: نُمُورٌ",
        },
        {
          sentence:
            "أُحَلِّلُ الكلمة إلى مقاطع: نَسِيمٌ",
        },
      ],
    },

    answer: {
      answers: [
        "حَ / نَا / نُ",
        "نُ / مُو / رٌ",
        "نَ / سِي / مٌ",
      ],
    },
  },
];

export async function POST() {
  try {
    const supabase =
      await createClient();

    const results = [];

    for (const fix of fixes) {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            "lesson_activities"
          )
          .select(`
            id,
            title,
            activity_type,
            is_published
          `)
          .eq(
            "id",
            fix.id
          )
          .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        results.push({
          id:
            fix.id,
          action:
            "not_found",
        });

        continue;
      }

      const validation =
        validateActivity({
          title:
            data.title,

          activity_type:
            data.activity_type,

          content:
            fix.content,

          answer:
            fix.answer,
        });

      if (
        validation.score !== 100 ||
        validation.issues.length > 0
      ) {
        results.push({
          id:
            fix.id,

          title:
            data.title,

          action:
            "validation_rejected",

          score:
            validation.score,

          issues:
            validation.issues,
        });

        continue;
      }

      const {
        error:
          updateError,
      } =
        await supabase
          .from(
            "lesson_activities"
          )
          .update({
            content:
              fix.content,

            answer:
              fix.answer,

            updated_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "id",
            fix.id
          );

      if (updateError) {
        throw updateError;
      }

      results.push({
        id:
          fix.id,

        title:
          data.title,

        published:
          data.is_published,

        action:
          "updated",

        score: 100,
      });
    }

    return NextResponse.json({
      ok: true,
      updated:
        results.filter(
          x =>
            x.action ===
            "updated"
        ).length,

      results,
    });
  }
  catch (error) {
    console.error(
      "FINAL_FOUR_FIX_ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : "Final four fix failed.",
      },
      {
        status: 500,
      }
    );
  }
}
