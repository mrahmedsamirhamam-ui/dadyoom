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
  activityType?: string;
  content?: JsonObject;
  answer: JsonObject;
};

const fixes: Fix[] = [

  // ==========================================================
  // PAGE 176 — activity 6: sentence -> picture
  // ==========================================================
  {
    id:
      "a899f6f1-5527-4ec2-a453-59514cdae646",

    activityType:
      "matching",

    content: {
      left: [
        "بَدَأَتِ المُبَارَاةُ، وَاشْتَدَّتْ حَمَاسَةُ اللاَّعِبِينَ.",
        "اتَّجَهَ بِهَا نَحْوَ الْمَرْمَى.",
        "قَالَ العَمُّ جَابِرٌ: بَسِيطَةٌ يَا حَاتِمُ.",
      ],

      right: [
        "المشهد الأول",
        "المشهد الثاني",
        "المشهد الثالث",
      ],

      image_url:
        "/curriculum/bahrain/grade-01/lesson-16/page-176.jpg",

      source_page: 176,
    },

    answer: {
      pairs: [
        {
          left:
            "بَدَأَتِ المُبَارَاةُ، وَاشْتَدَّتْ حَمَاسَةُ اللاَّعِبِينَ.",
          right:
            "المشهد الثالث",
        },
        {
          left:
            "اتَّجَهَ بِهَا نَحْوَ الْمَرْمَى.",
          right:
            "المشهد الأول",
        },
        {
          left:
            "قَالَ العَمُّ جَابِرٌ: بَسِيطَةٌ يَا حَاتِمُ.",
          right:
            "المشهد الثاني",
        },
      ],
    },
  },

  // ==========================================================
  // PAGE 176 — activity 7
  // ==========================================================
  {
    id:
      "8b079392-0724-45cb-9051-4eda3f1c6b95",

    answer: {
      correct_values: [
        "المُبَارَاةُ",
        "تُحَافِظُ",
        "تُوجَدُ",
        "اشْتَدَّتْ",
      ],
    },
  },

  // ==========================================================
  // PAGE 176 — activity 8: sentence analysis
  // ==========================================================
  {
    id:
      "78147988-ccfd-4658-83f6-a9195193f467",

    activityType:
      "matching",

    content: {
      text:
        "سَقَطَتِ الْكُرَةُ أَمَامَ خَالِدٍ.",

      words: [
        "سَقَطَتِ",
        "الْكُرَةُ",
        "أَمَامَ",
        "خَالِدٍ",
      ],

      image_url:
        "/curriculum/bahrain/grade-01/lesson-16/page-176.jpg",

      source_page: 176,
    },

    answer: {
      correct_words: [
        "سَقَطَتِ",
        "الْكُرَةُ",
        "أَمَامَ",
        "خَالِدٍ",
      ],
    },
  },

  // ==========================================================
  // PAGE 38
  // ==========================================================
  {
    id:
      "6b63b00e-1807-44f3-a2d9-7926a7a79039",

    answer: {
      answers: [
        "صَغِيرَةٌ",
        "الأَوَّلِ",
        "الثَّانِي",
      ],
    },
  },

  // ==========================================================
  // PAGE 44 — sounds of م
  // ==========================================================
  {
    id:
      "775df43b-767f-45a0-80da-5dba4b4d2cee",

    answer: {
      correct_values: [
        "أَمَلُ",
        "مَنَازِلُ",
        "مُزَارِعٌ",
        "مُعَلِّمَةٌ",
        "مِرَشٌّ",
        "مَاجِدٌ",
        "مَائِدَةٌ",
        "نُمُورٌ",
        "أَمِيرَةٌ",
        "جَمِيلَةٌ",
      ],
    },
  },

  // ==========================================================
  // PAGE 45
  // ==========================================================
  {
    id:
      "198081b9-e057-4311-a9d7-a60e4f3b0734",

    answer: {
      correct_values: [
        "مَرْحَبًا",
        "مِظَلَّةٌ",
        "مُعَلِّمٌ",
      ],
    },
  },

  // ==========================================================
  // PAGE 135
  // ==========================================================
  {
    id:
      "f8674b69-8004-480f-b7ef-55475b8842da",

    content: {
      items: [
        {
          prompt:
            "صَلَّى بَدْرٌ مَعَ وَالِدِهِ جَابِرٍ صَلَاةَ",
          options: [
            "الجُمُعَةِ",
            "المَغْرِبِ",
          ],
        },
        {
          prompt:
            "غَابَ الجَارُ جَاسِمٌ عَنِ الصَّلَاةِ بِسَبَبِ",
          options: [
            "السَّفَرِ",
            "المَرَضِ",
          ],
        },
        {
          prompt:
            "سَيَزُورُ جَابِرٌ وَمُحَمَّدٌ جَارَهُمَا جَاسِمًا بَعْدَ صَلَاةِ",
          options: [
            "المَغْرِبِ",
            "العِشَاءِ",
          ],
        },
      ],

      image_url:
        "/curriculum/bahrain/grade-01/lesson-13/page-135.jpg",

      audio_text:
        "أَضَعُ حَوْلَ الكَلِمَةِ المُنَاسِبَةِ.",

      source_page: 135,
    },

    answer: {
      answers: [
        "الجُمُعَةِ",
        "المَرَضِ",
        "المَغْرِبِ",
      ],
    },
  },

  // ==========================================================
  // فوق / تحت
  // ==========================================================
  {
    id:
      "0fe360ad-ddb1-4c9c-ac43-9509a71c083a",

    content: {
      items: [
        {
          prompt:
            "الدِّيكُ (...) السِّيَاجِ.",
          options: [
            "فَوْقَ",
            "تَحْتَ",
          ],
        },
        {
          prompt:
            "القِطَّةُ (...) الكُرْسِيِّ.",
          options: [
            "فَوْقَ",
            "تَحْتَ",
          ],
        },
        {
          prompt:
            "العُصْفُورُ (...) الغُصْنِ.",
          options: [
            "فَوْقَ",
            "تَحْتَ",
          ],
        },
      ],

      options: [
        "فَوْقَ",
        "تَحْتَ",
      ],
    },

    answer: {
      answers: [
        "فَوْقَ",
        "تَحْتَ",
        "فَوْقَ",
      ],
    },
  },

  // ==========================================================
  // PAGE 156
  // ==========================================================
  {
    id:
      "6f630dce-ba3e-4bbe-b1ad-ddccca56fb99",

    content: {
      items: [
        {
          prompt:
            "الحِصَانُ حَيَوَانُ",
          options: [
            "سَرِيعٌ",
            "بَطِيءٌ",
          ],
        },
        {
          prompt:
            "الفِيلُ حَيَوَانُ",
          options: [
            "صَغِيرٌ",
            "كَبِيرٌ",
          ],
        },
        {
          prompt:
            "العُصْفُورُ طَائِرُ",
          options: [
            "صَغِيرٌ",
            "كَبِيرٌ",
          ],
        },
      ],

      image_url:
        "/curriculum/bahrain/grade-01/lesson-14/page-156.jpg",

      audio_text:
        "أضع دائرة حول الكلمة المناسبة لأكمل الجملة",

      source_page: 156,
    },

    answer: {
      answers: [
        "سَرِيعٌ",
        "كَبِيرٌ",
        "صَغِيرٌ",
      ],
    },
  },

  // ==========================================================
  // PAGE 100 — activity 1
  // ==========================================================
  {
    id:
      "ae938878-348e-4ac9-bd55-afb6fc6cea18",

    answer: {
      answers: [
        "الأَحَدِ",
        "الْمَرْسَمِ",
      ],
    },
  },

  // ==========================================================
  // PAGE 100 — activity 2
  // ==========================================================
  {
    id:
      "7da994d1-7ecf-42cf-bbf0-edc724fafec6",

    answer: {
      correct:
        "الشَّجَرَةِ.",
    },
  },
];


export async function POST() {
  try {
    const supabase =
      await createClient();

    const results = [];

    for (
      const fix
      of fixes
    ) {
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
            content,
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

      if (
        data.is_published ===
        true
      ) {
        results.push({
          id:
            fix.id,
          title:
            data.title,
          action:
            "published_skipped",
        });

        continue;
      }

      const activityType =
        fix.activityType ??
        data.activity_type;

      const existingContent: JsonObject =
        data.content &&
        typeof data.content === "object" &&
        !Array.isArray(data.content)
          ? (data.content as JsonObject)
          : {};

      const content: JsonObject =
        fix.content ??
        existingContent;

      const validation =
        validateActivity({
          title:
            data.title,

          activity_type:
            activityType,

          content,

          answer:
            fix.answer,
        });

      if (
        validation.score !==
          100 ||
        validation.issues.length >
          0
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
            activity_type:
              activityType,

            content,

            answer:
              fix.answer,

            updated_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "id",
            fix.id
          )
          .eq(
            "is_published",
            false
          );

      if (updateError) {
        throw updateError;
      }

      results.push({
        id:
          fix.id,

        title:
          data.title,

        type:
          activityType,

        action:
          "updated",

        score: 100,
      });
    }

    return NextResponse.json({
      ok: true,

      updated:
        results.filter(
          item =>
            item.action ===
            "updated"
        ).length,

      results,
    });
  }
  catch (error) {
    console.error(
      "FINAL_ELEVEN_FIX_ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : "Final eleven fix failed.",
      },
      {
        status: 500,
      }
    );
  }
}

