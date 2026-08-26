import { createDailyChallenge } from "@/features/gamification/daily-challenge";
import { getUnifiedGamificationXP } from "@/features/student-progress/services/unified-gamification";
import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  recommendAdaptiveSkill,
  type AdaptiveSkill,
  type SkillProgressInput,
} from "@/features/adaptive-skills/adaptive-skill-engine";

type LessonRow = {
  id: string;
  title: string | null;
  lesson_number: number | null;
  estimated_minutes: number | null;
};

type LessonProgressRow = {
  lesson_id: string;
  status: string | null;
  best_score: number | null;
  last_score: number | null;
  xp: number | null;
  updated_at: string | null;
};

const validSkills =
  new Set([
    "reading",
    "writing",
    "listening",
    "speaking",
  ]);

export async function GET() {
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

    const [
      profileResult,
      lessonsResult,
      lessonProgressResult,
      skillsResult,
    ] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle(),

        supabase
          .from("lessons")
          .select(`
            id,
            title,
            lesson_number,
            estimated_minutes
          `)
          .eq("status", "published")
          .order(
            "lesson_number",
            {
              ascending: true,
            }
          ),

        supabase
          .from(
            "student_lesson_progress"
          )
          .select(`
            lesson_id,
            status,
            best_score,
            last_score,
            xp,
            updated_at
          `)
          .eq(
            "student_id",
            user.id
          ),

        supabase
          .from(
            "student_skill_progress"
          )
          .select(`
            skill,
            latest_score,
            best_score,
            attempts,
            xp,
            level
          `)
          .eq(
            "user_id",
            user.id
          ),
      ]);

    if (
      lessonsResult.error
    ) {
      throw lessonsResult.error;
    }

    if (
      lessonProgressResult.error
    ) {
      throw lessonProgressResult.error;
    }

    if (
      skillsResult.error
    ) {
      throw skillsResult.error;
    }

    // DAILY_CHALLENGE_LOCK_SOURCE_OF_TRUTH
    // Once a challenge is accepted for the Bahrain day,
    // the persisted row becomes the source of truth.
    const today =
      new Intl.DateTimeFormat(
        "en-CA",
        {
          timeZone:
            "Asia/Bahrain",

          year:
            "numeric",

          month:
            "2-digit",

          day:
            "2-digit",
        }
      ).format(
        new Date()
      );

    const {
      data:
        lockedChallenge,

      error:
        lockedChallengeError,
    } =
      await supabase
        .from(
          "student_daily_challenges"
        )
        .select(`
          challenge_id,
          skill,
          title,
          target_score,
          status,
          achieved_score,
          bonus_xp,
          bonus_awarded
        `)
        .eq(
          "user_id",
          user.id
        )
        .eq(
          "challenge_date",
          today
        )
        .maybeSingle();

    if (
      lockedChallengeError
    ) {
      throw lockedChallengeError;
    }
    const lessons =
      (lessonsResult.data ??
        []) as LessonRow[];

    const lessonProgress =
      (lessonProgressResult.data ??
        []) as LessonProgressRow[];

    const progressMap =
      new Map(
        lessonProgress.map(
          row => [
            row.lesson_id,
            row,
          ]
        )
      );

    const inProgressLesson =
      lessons.find(
        lesson =>
          progressMap.get(
            lesson.id
          )?.status ===
          "in_progress"
      );

    const unfinishedLesson =
      lessons.find(
        lesson => {
          const status =
            progressMap.get(
              lesson.id
            )?.status;

          return (
            status !==
              "completed" &&
            status !==
              "mastered"
          );
        }
      );

    const focusLesson =
      inProgressLesson ??
      unfinishedLesson ??
      null;

    const completedLessons =
      lessonProgress.filter(
        row =>
          row.status ===
            "completed" ||
          row.status ===
            "mastered"
      ).length;

    const skillProgress:
      SkillProgressInput[] =
      (skillsResult.data ?? [])
        .filter(
          row =>
            typeof row.skill ===
              "string" &&
            validSkills.has(
              row.skill
            )
        )
        .map(
          row => ({
            skill:
              row.skill as
                AdaptiveSkill,

            latest_score:
              Number(
                row.latest_score ??
                  0
              ),

            best_score:
              Number(
                row.best_score ??
                  0
              ),

            attempts:
              Number(
                row.attempts ??
                  0
              ),

            xp:
              Number(
                row.xp ??
                  0
              ),

            level:
              typeof row.level ===
                "string"
                ? row.level
                : "مبتدئ",
          })
        );

    const skillRecommendation =
      recommendAdaptiveSkill(
        skillProgress
      );

    const recommendedDailyChallenge =
      createDailyChallenge({
        skill:
          skillRecommendation.skill,

        skillLabel:
          skillRecommendation.skillLabel,

        href:
          skillRecommendation.href,

        targetScore:
          skillRecommendation.targetScore,
      });

    const lockedSkill =
      lockedChallenge &&
      typeof lockedChallenge
        .skill === "string" &&
      validSkills.has(
        lockedChallenge.skill
      )
        ? (
            lockedChallenge
              .skill as AdaptiveSkill
          )
        : null;

    const lockedSkillMeta =
      lockedSkill ===
        "reading"
        ? {
            icon:
              "📖",
            label:
              "القراءة",
          }
        : lockedSkill ===
            "writing"
          ? {
              icon:
                "✍️",
              label:
                "الكتابة",
            }
          : lockedSkill ===
              "listening"
            ? {
                icon:
                  "🎧",
                label:
                  "الاستماع",
              }
            : {
                icon:
                  "🎙️",
                label:
                  "التحدث",
              };

    const dailyChallenge =
      lockedChallenge &&
      lockedSkill &&
      lockedChallenge
        .challenge_id
        ? {
            ...recommendedDailyChallenge,

            id:
              String(
                lockedChallenge
                  .challenge_id
              ),

            skill:
              lockedSkill,

            icon:
              lockedSkillMeta
                .icon,

            title:
              typeof lockedChallenge
                .title === "string" &&
              lockedChallenge
                .title.trim()
                ? lockedChallenge
                    .title
                : recommendedDailyChallenge
                    .title,

            description:
              `واصل تحدي اليوم في مهارة ${lockedSkillMeta.label} وحاول تحقيق هدفك.`,

            href:
              `/skills/${lockedSkill}/practice`,

            targetScore:
              Math.max(
                0,
                Math.min(
                  100,
                  Math.round(
                    Number(
                      lockedChallenge
                        .target_score
                    ) ||
                    recommendedDailyChallenge
                      .targetScore
                  )
                )
              ),
          }
        : recommendedDailyChallenge;
    const {
      totalXP: totalXp,
    } =
      await getUnifiedGamificationXP(
        user.id,
        supabase
      );

    const studentName =
      (
        profileResult.data as
          | {
              full_name?:
                string | null;
            }
          | null
      )?.full_name ||
      user.user_metadata
        ?.full_name ||
      user.email?.split(
        "@"
      )[0] ||
      "طالب ضاديوم";

    const lessonStep = {
      id:
        "lesson",

      number:
        1,

      icon:
        "📘",

      eyebrow:
        "الخطوة الأولى",

      title:
        focusLesson
          ? focusLesson.title ??
            "درس اليوم"
          : "مراجعة ما تعلمته",

      description:
        focusLesson
          ? "ابدأ بالدرس الحالي أو أكمل من حيث توقفت."
          : "لقد أكملت الدروس المنشورة حاليًا. راجع ما تعلمته.",

      href:
        focusLesson
          ? `/lessons/${focusLesson.id}`
          : "/courses",

      action:
        focusLesson
          ? "ابدأ الدرس"
          : "استعرض الدروس",

      minutes:
        Number(
          focusLesson
            ?.estimated_minutes ??
            10
        ),

      available:
        true,
    };

    const skillStep = {
      id:
        "skill",

      number:
        2,

      icon:
        skillRecommendation
          .icon,

      eyebrow:
        "الخطوة الثانية",

      title:
        `تدريب ${skillRecommendation.skillLabel}`,

      description:
        skillRecommendation
          .message,

      href:
        skillRecommendation
          .href,

      action:
        "ابدأ تدريب المهارة",

      minutes:
        10,

      available:
        true,

      difficulty:
        skillRecommendation
          .difficultyLabel,

      targetScore:
        skillRecommendation
          .targetScore,
    };

    const assessmentStep = {
      id:
        "assessment",

      number:
        3,

      icon:
        "📝",

      eyebrow:
        "الخطوة الثالثة",

      title:
        focusLesson
          ? "اختبار قصير"
          : "تقييم مستواك",

      description:
        focusLesson
          ? "اختبر فهمك بعد الدرس والتدريب، ثم دع ضاد يحدث توصياتك."
          : "اختبر مستواك لتحديد أفضل خطوة تعليمية تالية.",

      href:
        focusLesson
          ? `/assessment/${focusLesson.id}`
          : "/assessment",

      action:
        "ابدأ التقييم",

      minutes:
        5,

      available:
        true,
    };

    return NextResponse.json({
      ok: true,

      journey: {
        studentName,

        headline:
          `خطة اليوم لـ ${studentName}`,

        message:
          "ثلاث خطوات قصيرة تجمع التعلم والتدريب والتقييم في مسار واحد.",

        completedLessons,

        totalXp,

        estimatedMinutes:
          lessonStep.minutes +
          skillStep.minutes +
          assessmentStep.minutes,

        focusSkill:
          skillRecommendation
            .skillLabel,

        focusDifficulty:
          skillRecommendation
            .difficultyLabel,

        targetScore:
          skillRecommendation
            .targetScore,

        dailyChallenge,

        steps: [
          lessonStep,
          skillStep,
          assessmentStep,
        ],
      },
    });
  }
  catch (error) {
    console.error(
      "SMART_DAILY_JOURNEY_FAILED:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "تعذر إعداد رحلة اليوم.",
      },
      {
        status: 500,
      }
    );
  }
}
