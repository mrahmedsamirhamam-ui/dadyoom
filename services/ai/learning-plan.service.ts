import { logger } from "@/lib/logger";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAIProvider } from "@/lib/ai";
import type { AiLearningPlan, StudentAiContext } from "@/lib/ai/provider";
import { getStudentMemory } from "@/features/student-memory/services/getStudentMemory";
import { buildStudentMemorySummary } from "@/features/student-memory/services/buildStudentMemorySummary";

type SkillRow = {
  skill: string | null;
  score: number | null;
};

type MistakeRow = {
  category: string | null;
  mistake_count: number | null;
};

type ProgressRow = {
  completed: boolean | null;
  earned_points: number | null;
};

type ProfileRow = {
  full_name: string | null;
};

type SessionRow = {
  id: string;
  lesson_id: string;
};

type SessionAnswerRow = {
  skill: string | null;
  is_correct: boolean | null;
};

type SkillResult = {
  total: number;
  correct: number;
  percentage: number;
};

const STRICT_SKILL_SEQUENCE = [
  "الاستيعاب المباشر",
  "الاستنتاج",
  "التحليل",
  "التقويم",
  "التعبير",
  "التذوق",
] as const;

function normalizeSkillName(value: string | null | undefined): string {
  const normalized = value?.trim().replace(/\s+/gu, " ") ?? "";

  if (
    normalized === "الاستيعاب" ||
    normalized === "فهم المقروء" ||
    normalized === "الفهم المباشر"
  ) {
    return "الاستيعاب المباشر";
  }

  return normalized || "الاستيعاب المباشر";
}

function buildSkillResults(
  answers: SessionAnswerRow[]
): Record<string, SkillResult> {
  const skills: Record<string, SkillResult> = {};

  for (const answer of answers) {
    const skill = normalizeSkillName(answer.skill);

    if (!skills[skill]) {
      skills[skill] = {
        total: 0,
        correct: 0,
        percentage: 0,
      };
    }

    skills[skill].total += 1;

    if (answer.is_correct === true) {
      skills[skill].correct += 1;
    }
  }

  for (const skillResult of Object.values(skills)) {
    skillResult.percentage = Math.round(
      (skillResult.correct / Math.max(skillResult.total, 1)) * 100
    );
  }

  return skills;
}

export async function generateStudentLearningPlan(
  supabase: SupabaseClient,
  userId: string,
  studentEmail: string
): Promise<AiLearningPlan> {
  const cacheEnabled = process.env.LEARNING_PLAN_CACHE_ENABLED
    ? process.env.LEARNING_PLAN_CACHE_ENABLED === "true"
    : process.env.NODE_ENV === "production";

  const cacheThreshold = new Date(
    Date.now() - 24 * 60 * 60 * 1000
  ).toISOString();

  if (cacheEnabled) {
    const { data: cachedPlan, error: cachedPlanError } = await supabase
      .from("learning_plans")
      .select(`
        title,
        message,
        priority,
        focus_skill,
        recommended_lesson,
        practice_type,
        daily_goal,
        motivation,
        created_at
      `)
      .eq("student_email", studentEmail)
      .or("completed.eq.false,completed.is.null")
      .gte("created_at", cacheThreshold)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cachedPlanError) {
      console.warn("LEARNING_PLAN_CACHE_QUERY_WARNING", cachedPlanError);
    }

    if (cachedPlan) {
      logger.info("LEARNING_PLAN_CACHE_HIT", {
        studentEmail,
        createdAt: cachedPlan.created_at,
      });

      return {
        title: cachedPlan.title,
        message: cachedPlan.message,
        priority: cachedPlan.priority,
        focusSkill: cachedPlan.focus_skill,
        recommendedLesson: cachedPlan.recommended_lesson,
        practiceType: cachedPlan.practice_type,
        dailyGoal: cachedPlan.daily_goal,
        motivation: cachedPlan.motivation,
      } as AiLearningPlan;
    }

    logger.info("LEARNING_PLAN_CACHE_MISS", {
      studentEmail,
      cacheThreshold,
    });
  } else {
    logger.info("LEARNING_PLAN_CACHE_BYPASS", {
      studentEmail,
      environment: process.env.NODE_ENV,
    });
  }

  const [
    profileResult,
    skillsResult,
    mistakesResult,
    progressResult,
    latestSessionResult,
    recentPlansResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle(),

    supabase
      .from("student_skills")
      .select("skill, score")
      .eq("student_email", studentEmail)
      .order("score", { ascending: true }),

    supabase
      .from("student_mistakes")
      .select(`category, mistake_count`)
      .eq("student_email", studentEmail)
      .order("mistake_count", { ascending: false })
      .limit(1),

    supabase
      .from("student_progress")
      .select(`completed, earned_points`)
      .eq("student_email", studentEmail),

    supabase
      .from("assessment_sessions")
      .select(`id, lesson_id`)
      .eq("student_id", userId)
      .eq("finished", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),

    supabase
      .from("learning_plans")
      .select("focus_skill")
      .eq("student_email", studentEmail)
      .not("focus_skill", "is", null)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  if (profileResult.error) console.warn("LEARNING_PLAN_PROFILE_QUERY_WARNING", profileResult.error);
  if (skillsResult.error) console.warn("LEARNING_PLAN_SKILLS_QUERY_WARNING", skillsResult.error);
  if (mistakesResult.error) console.warn("LEARNING_PLAN_MISTAKES_QUERY_WARNING", mistakesResult.error);
  if (progressResult.error) console.warn("LEARNING_PLAN_PROGRESS_QUERY_WARNING", progressResult.error);
  if (latestSessionResult.error) console.warn("LEARNING_PLAN_SESSION_QUERY_WARNING", latestSessionResult.error);
  if (recentPlansResult.error) console.warn("LEARNING_PLAN_RECENT_SKILLS_WARNING", recentPlansResult.error);

  const profile = profileResult.data as ProfileRow | null;
  const storedSkills = (skillsResult.data ?? []) as SkillRow[];
  const mistakes = (mistakesResult.data ?? []) as MistakeRow[];
  const progress = (progressResult.data ?? []) as ProgressRow[];
  const latestSession = latestSessionResult.data as SessionRow | null;

  let adaptiveSkills: Record<string, SkillResult> = {};

  const {
    data: studentAnswers,
    error: studentAnswersError,
  } = await supabase
    .from("assessment_session_answers")
    .select(`skill, is_correct`)
    .eq("student_id", userId)
    .order("created_at", {
      ascending: false,
    })
    .limit(200);

  if (studentAnswersError) {
    console.warn(
      "LEARNING_PLAN_ANSWERS_QUERY_WARNING",
      studentAnswersError
    );
  } else {
    adaptiveSkills =
      buildSkillResults(
        (studentAnswers ?? []) as SessionAnswerRow[]
      );
  }

  // 1. تحضير المهارات المخزنة وتوحيد أسمائها مسبقاً
  const historicalSkills: Record<string, SkillResult> = {};
  for (const skillItem of storedSkills) {
    if (!skillItem.skill || typeof skillItem.score !== "number") continue;
    const normalizedSkill = normalizeSkillName(skillItem.skill);
    const score = Math.max(0, Math.min(100, skillItem.score ?? 0));

    const existing = historicalSkills[normalizedSkill];
    if (existing) {
      existing.total += 1;
      if (score >= 50) existing.correct += 1;
      existing.percentage = Math.round((existing.percentage + score) / 2);
    } else {
      historicalSkills[normalizedSkill] = {
        total: 1,
        correct: score >= 50 ? 1 : 0,
        percentage: score,
      };
    }
  }

  // 2. دمج مهارات الجلسة الحالية مع البيانات التاريخية بوزن ترجيحي
  const mergedSkills: Record<string, SkillResult> = {
    ...historicalSkills,
  };

  for (const [rawSkill, currentResult] of Object.entries(adaptiveSkills)) {
    const skill = normalizeSkillName(rawSkill);
    const previous = mergedSkills[skill];

    if (!previous) {
      mergedSkills[skill] = currentResult;
      continue;
    }

    const total =
      previous.total +
      currentResult.total;

    const correct =
      previous.correct +
      currentResult.correct;

    mergedSkills[skill] = {
      total,
      correct,
      percentage: Math.round(
        (correct /
          Math.max(total, 1)) *
          100
      ),
    };
  }

  logger.info("NORMALIZED_MERGED_SKILLS", mergedSkills);

  const recentFocusSkills = (recentPlansResult.data ?? [])
    .map((item) => (typeof item.focus_skill === "string" ? item.focus_skill.trim() : ""))
    .filter(Boolean);

  // 3. تحديد المهارات المتقنة (100%) والمهارة التالية وفق التسلسل الصارم
  const masteredSkills = new Set(
    Object.entries(mergedSkills)
      .filter(([, skill]) => skill.percentage >= 100)
      .map(([name]) => name)
  );

  let progressionSkill: typeof STRICT_SKILL_SEQUENCE[number] = STRICT_SKILL_SEQUENCE[0];
  for (const skill of STRICT_SKILL_SEQUENCE) {
    if (!masteredSkills.has(skill)) {
      progressionSkill = skill;
      break;
    }
  }

  const progressionScore = mergedSkills[progressionSkill]?.percentage ?? 0;

  logger.info("STRICT_LEARNING_SEQUENCE", {
    progressionSkill,
    progressionScore,
    masteredSkills: [...masteredSkills],
  });

  const primaryRecommendation = {
    skill: progressionSkill,
    priority: 5,
    recommendation:
      progressionScore >= 100
        ? `ابدأ تعلم مهارة ${progressionSkill} من خلال شرح مبسط وتدريب قصير.`
        : `واصل تحسين مهارة ${progressionSkill} حتى تصل إلى 100٪ قبل الانتقال للمهارة التالية.`,
  };

  // استخراج أضعف وأقوى مهارة للسياق
  const sortedSkillEntries = Object.entries(mergedSkills).sort(
    ([, a], [, b]) => a.percentage - b.percentage
  );

  const weakestEntry = sortedSkillEntries[0] ?? null;
  const strongestEntry = sortedSkillEntries.length > 0 ? sortedSkillEntries[sortedSkillEntries.length - 1] : null;

  const weakestSkill = weakestEntry?.[0] ?? null;
  const weakestSkillScore = weakestEntry?.[1].percentage ?? 0;

  const strongestSkill = strongestEntry?.[0] ?? null;
  const strongestSkillScore = strongestEntry?.[1].percentage ?? 0;

  const completedLessons = progress.filter((item) => item.completed === true).length;
  const totalXp = progress.reduce((total, item) => total + (item.earned_points ?? 0), 0);
  const fallbackMistake = mistakes[0]?.category ?? null;

  const adaptiveNeed = primaryRecommendation
    ? `${primaryRecommendation.skill}: ${primaryRecommendation.recommendation}`
    : null;

  const context: StudentAiContext = {
    studentName: profile?.full_name || studentEmail.split("@")[0] || "بطل ضاديوم",
    totalXp,
    completedLessons,
    strongestSkill,
    strongestSkillScore,
    weakestSkill,
    weakestSkillScore,
    mostFrequentMistake: adaptiveNeed ?? fallbackMistake,
    recentFocusSkills,
  };

  const memory = await getStudentMemory({
    supabase,
    studentId: userId,
  });

  const memorySummary = buildStudentMemorySummary(memory);
  context.memorySummary = memorySummary.summary;

  const aiProvider = getAIProvider();

  const generatedPlan =
    process.env.NODE_ENV === "development"
      ? {
          title: `خطة اليوم: ${primaryRecommendation.skill}`,
          message: primaryRecommendation.recommendation,
          priority: "high" as const,
          focusSkill: primaryRecommendation.skill,
          recommendedLesson: null,
          practiceType: "quiz" as const,
          dailyGoal: "15 دقيقة",
          motivation:
            `واصل التقدم في مهارة ${primaryRecommendation.skill} بخطوة ثابتة كل يوم.`,
        }
      : await aiProvider.generateLearningPlan(context);

  // اعتماد القرار المحلي صارماً وتجاوز أي اختيار من Gemini
  const localFocusSkill = primaryRecommendation.skill;

  const resolvedPlan: AiLearningPlan = {
    ...generatedPlan,
    title: `خطة اليوم: ${localFocusSkill}`,
    message: primaryRecommendation.recommendation,
    priority: "high",
    focusSkill: localFocusSkill,
    practiceType:
      primaryRecommendation.priority >= 3
        ? "quiz"
        : generatedPlan.practiceType,
  };

  logger.info("LEARNING_PLAN_FINAL_SKILL", {
    localFocusSkill,
    geminiFocusSkill: generatedPlan.focusSkill ?? null,
    recommendationSkill: primaryRecommendation.skill,
  });

  const focusSkill = localFocusSkill;
  let recommendedLessonId: string | null = latestSession?.lesson_id ?? null;

  if (focusSkill) {
    const searchTerms = focusSkill
      .split(/\s+/u)
      .map((term) => term.trim())
      .filter((term) => term.length >= 3)
      .slice(0, 3);

    for (const searchTerm of searchTerms) {
      const { data: matchingLesson, error: matchingLessonError } = await supabase
        .from("lessons")
        .select("id")
        .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
        .limit(1)
        .maybeSingle();

      if (matchingLessonError) {
        console.warn("LEARNING_PLAN_LESSON_SEARCH_WARNING", {
          searchTerm,
          error: matchingLessonError,
        });
        continue;
      }

      if (matchingLesson?.id) {
        recommendedLessonId = matchingLesson.id;
        break;
      }
    }
  }

  const plan: AiLearningPlan = {
    ...resolvedPlan,
    focusSkill,
    recommendedLesson: recommendedLessonId,
  };

  const { error: insertError } = await supabase.from("learning_plans").insert({
    student_email: studentEmail,
    title: plan.title,
    message: plan.message,
    priority: plan.priority,
    focus_skill: plan.focusSkill,
    recommended_lesson: plan.recommendedLesson,
    practice_type: plan.practiceType,
    daily_goal: plan.dailyGoal,
    motivation: plan.motivation,
    completed: false,
  });

  if (insertError) {
    console.error("LEARNING_PLAN_INSERT_ERROR", insertError);
    throw new Error("تعذر حفظ خطة التعلم الشخصية.");
  }

  return plan;
}