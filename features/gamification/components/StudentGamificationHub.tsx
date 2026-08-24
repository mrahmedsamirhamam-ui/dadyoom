import Link from "next/link";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  getUnifiedGamificationXP,
} from "@/features/student-progress/services/unified-gamification";

import LevelUpCelebration from "./LevelUpCelebration";

type LevelInfo = {
  level: number;
  currentXP: number;
  nextLevelXP: number;
  percent: number;
};

type Props = {
  level?: LevelInfo | null;
};

type AchievementRow = {
  id: string;
  achievement_key: string;
  title: string;
  description: string | null;
  icon: string | null;
  unlocked_at: string;
};

type ChallengeRow = {
  challenge_id: string;
  skill: string;
  title: string;
  target_score: number;
  status: string;
  achieved_score: number | null;
  bonus_xp: number;
  bonus_awarded: boolean;
};

type ChallengeHistoryRow = {
  challenge_date: string;
  status: string;
};

type Milestone = {
  key: string;
  icon: string;
  title: string;
  description: string;
  current: number;
  target: number;
  unit: string;
};

function getBahrainDate(
  date = new Date()
): string {
  const parts =
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
    ).formatToParts(date);

  const year =
    parts.find(
      part =>
        part.type === "year"
    )?.value;

  const month =
    parts.find(
      part =>
        part.type === "month"
    )?.value;

  const day =
    parts.find(
      part =>
        part.type === "day"
    )?.value;

  if (
    !year ||
    !month ||
    !day
  ) {
    return date
      .toISOString()
      .slice(0, 10);
  }

  return `${year}-${month}-${day}`;
}

function getLastSevenDays() {
  const today =
    getBahrainDate();

  const base =
    new Date(
      `${today}T12:00:00+03:00`
    );

  return Array.from(
    {
      length: 7,
    },
    (
      _,
      index
    ) => {
      const offset =
        6 - index;

      const date =
        new Date(
          base.getTime() -
          offset *
            24 *
            60 *
            60 *
            1000
        );

      return {
        date:
          getBahrainDate(
            date
          ),

        weekday:
          new Intl.DateTimeFormat(
            "ar-BH",
            {
              timeZone:
                "Asia/Bahrain",
              weekday:
                "short",
            }
          ).format(date),
      };
    }
  );
}

function safeNumber(
  value: unknown
): number {
  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? Math.max(
        0,
        number
      )
    : 0;
}

function clampPercent(
  current: number,
  target: number
): number {
  if (target <= 0) {
    return 100;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (
          current /
          target
        ) *
        100
      )
    )
  );
}

function skillLabel(
  skill: string
): string {
  switch (skill) {
    case "reading":
      return "القراءة";

    case "writing":
      return "الكتابة";

    case "listening":
      return "الاستماع";

    case "speaking":
      return "التحدث";

    default:
      return "المهارة";
  }
}

function skillIcon(
  skill: string
): string {
  switch (skill) {
    case "reading":
      return "📖";

    case "writing":
      return "✍️";

    case "listening":
      return "🎧";

    case "speaking":
      return "🎙️";

    default:
      return "🎯";
  }
}

export default async function StudentGamificationHub({
  level,
}: Props) {
  const supabase =
    await createClient();

  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const email =
    user.email?.trim() ??
    "";

  const today =
    getBahrainDate();

  const lastSevenDays =
    getLastSevenDays();

  const firstHistoryDate =
    lastSevenDays[0]
      ?.date ??
    today;

  const [
    xp,
    streakResult,
    achievementsResult,
    challengeResult,
    challengeHistoryResult,
    completedLessonsResult,
  ] =
    await Promise.all([
      getUnifiedGamificationXP(
        user.id,
        supabase
      ),

      email
        ? supabase
            .from(
              "student_streaks"
            )
            .select(`
              current_streak,
              longest_streak,
              last_activity_date
            `)
            .eq(
              "student_email",
              email
            )
            .maybeSingle()
        : Promise.resolve({
            data: null,
            error: null,
          }),

      email
        ? supabase
            .from(
              "student_achievements"
            )
            .select(`
              id,
              achievement_key,
              title,
              description,
              icon,
              unlocked_at
            `)
            .eq(
              "student_email",
              email
            )
            .order(
              "unlocked_at",
              {
                ascending:
                  false,
              }
            )
        : Promise.resolve({
            data: [],
            error: null,
          }),

      supabase
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
        .maybeSingle(),

      supabase
        .from(
          "student_daily_challenges"
        )
        .select(`
          challenge_date,
          status
        `)
        .eq(
          "user_id",
          user.id
        )
        .gte(
          "challenge_date",
          firstHistoryDate
        )
        .lte(
          "challenge_date",
          today
        ),

      supabase
        .from(
          "student_lesson_progress"
        )
        .select(
          "lesson_id",
          {
            count:
              "exact",
            head:
              true,
          }
        )
        .eq(
          "student_id",
          user.id
        )
        .in(
          "status",
          [
            "completed",
            "mastered",
          ]
        ),
    ]);

  if (
    streakResult.error
  ) {
    console.warn(
      "GAMIFICATION_HUB_STREAK_FAILED:",
      streakResult.error
    );
  }

  if (
    achievementsResult.error
  ) {
    console.warn(
      "GAMIFICATION_HUB_ACHIEVEMENTS_FAILED:",
      achievementsResult.error
    );
  }

  if (
    challengeResult.error
  ) {
    console.warn(
      "GAMIFICATION_HUB_CHALLENGE_FAILED:",
      challengeResult.error
    );
  }

  if (
    challengeHistoryResult.error
  ) {
    console.warn(
      "GAMIFICATION_HUB_HISTORY_FAILED:",
      challengeHistoryResult.error
    );
  }

  if (
    completedLessonsResult.error
  ) {
    console.warn(
      "GAMIFICATION_HUB_LESSON_COUNT_FAILED:",
      completedLessonsResult.error
    );
  }

  const streak =
    streakResult.data;

  const achievements =
    (
      achievementsResult.data ??
      []
    ) as AchievementRow[];

  const challenge =
    challengeResult.data as
      | ChallengeRow
      | null;

  const challengeHistory =
    (
      challengeHistoryResult.data ??
      []
    ) as ChallengeHistoryRow[];

  const completedLessons =
    safeNumber(
      completedLessonsResult.count
    );

  const currentStreak =
    safeNumber(
      streak?.current_streak
    );

  const longestStreak =
    safeNumber(
      streak?.longest_streak
    );

  const completedToday =
    challenge?.status ===
      "completed";

  const challengeXp =
    safeNumber(
      challenge?.bonus_xp
    );

  const displayedAchievements =
    achievements.slice(
      0,
      4
    );

  const completedChallengeDates =
    new Set(
      challengeHistory
        .filter(
          item =>
            item.status ===
              "completed"
        )
        .map(
          item =>
            item.challenge_date
        )
    );

  const milestones:
    Milestone[] = [
      {
        key:
          "STREAK_3",
        icon:
          "🔥",
        title:
          "سلسلة 3 أيام",
        description:
          "حافظ على نشاطك ثلاثة أيام متتالية.",
        current:
          currentStreak,
        target:
          3,
        unit:
          "يوم",
      },

      {
        key:
          "LESSONS_10",
        icon:
          "📚",
        title:
          "عاشق التعلم",
        description:
          "أكمل 10 دروس في ضاديوم.",
        current:
          completedLessons,
        target:
          10,
        unit:
          "درس",
      },

      {
        key:
          "STREAK_7",
        icon:
          "⚡",
        title:
          "أسبوع بلا انقطاع",
        description:
          "حافظ على سلسلة تعلم لمدة 7 أيام.",
        current:
          currentStreak,
        target:
          7,
        unit:
          "يوم",
      },

      {
        key:
          "XP_1000",
        icon:
          "⭐",
        title:
          "جامع النجوم",
        description:
          "اجمع 1000 XP من رحلتك التعليمية.",
        current:
          xp.totalXP,
        target:
          1000,
        unit:
          "XP",
      },
    ];

  const nextMilestone =
    milestones
      .filter(
        item =>
          item.current <
          item.target
      )
      .sort(
        (
          a,
          b
        ) =>
          clampPercent(
            b.current,
            b.target
          ) -
          clampPercent(
            a.current,
            a.target
          )
      )[0] ??
    null;

  const nextMilestonePercent =
    nextMilestone
      ? clampPercent(
          nextMilestone.current,
          nextMilestone.target
        )
      : 100;

  return (
    <>
      <LevelUpCelebration
        userId={user.id}
        level={
          level?.level ??
          1
        }
        totalXP={
          xp.totalXP
        }
      />

      <aside className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">

        <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-6 text-white">

          <div className="flex items-start justify-between gap-4">

            <div>
              <p className="text-sm font-bold text-amber-100">
                مركز التحفيز
              </p>

              <h2 className="mt-1 text-2xl font-black">
                رحلتي في ضاديوم
              </h2>

              <p className="mt-2 text-sm leading-6 text-orange-50">
                نقاطك، سلسلتك، أوسمتك وتحدي اليوم في مكان واحد.
              </p>
            </div>

            <div className="rounded-2xl bg-white/20 px-4 py-3 text-center backdrop-blur">
              <div className="text-xs font-bold text-orange-50">
                المستوى
              </div>

              <div className="mt-1 text-2xl font-black">
                {level?.level ?? 1}
              </div>
            </div>
          </div>


          <div className="mt-6 grid grid-cols-2 gap-3">

            <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
              <div className="text-2xl">
                ⭐
              </div>

              <div
                dir="ltr"
                className="mt-2 text-2xl font-black"
              >
                {xp.totalXP} XP
              </div>

              <div className="mt-1 text-xs font-bold text-orange-50">
                إجمالي النقاط
              </div>
            </div>


            <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
              <div className="text-2xl">
                🔥
              </div>

              <div className="mt-2 text-2xl font-black">
                {currentStreak}
              </div>

              <div className="mt-1 text-xs font-bold text-orange-50">
                السلسلة الحالية
              </div>
            </div>

          </div>
        </div>


        <div className="p-6">

          <div className="grid grid-cols-3 gap-3">

            <MiniMetric
              icon="📘"
              value={xp.lessonXP}
              label="XP الدروس"
            />

            <MiniMetric
              icon="🎯"
              value={xp.skillXP}
              label="XP المهارات"
            />

            <MiniMetric
              icon="🔥"
              value={xp.dailyChallengeXP}
              label="XP التحديات"
            />

          </div>


          <div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50 p-4">

            <div className="flex items-center justify-between gap-3">

              <div>
                <p className="text-xs font-bold text-orange-700">
                  أفضل سلسلة
                </p>

                <p className="mt-1 text-xl font-black text-orange-950">
                  🔥 {longestStreak} يوم
                </p>
              </div>

              <div className="text-left text-xs font-bold text-orange-700">
                {streak?.last_activity_date
                  ? `آخر نشاط: ${streak.last_activity_date}`
                  : "ابدأ سلسلتك اليوم"}
              </div>
            </div>

          </div>


          <div className="mt-5">

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-rose-700">
                  🔥 آخر 7 أيام
                </p>

                <p className="mt-1 text-sm font-black text-slate-900">
                  سجل التحديات اليومية
                </p>
              </div>

              <div className="text-xs font-bold text-slate-500">
                {completedChallengeDates.size}/7
              </div>
            </div>

            <div className="mt-3 grid grid-cols-7 gap-1.5">
              {lastSevenDays.map(
                day => {
                  const completed =
                    completedChallengeDates.has(
                      day.date
                    );

                  const isToday =
                    day.date ===
                    today;

                  return (
                    <div
                      key={
                        day.date
                      }
                      title={
                        day.date
                      }
                      className={
                        completed
                          ? "rounded-xl bg-orange-500 px-1 py-2 text-center text-white"
                          : isToday
                            ? "rounded-xl border border-orange-300 bg-orange-50 px-1 py-2 text-center text-orange-800"
                            : "rounded-xl bg-slate-100 px-1 py-2 text-center text-slate-500"
                      }
                    >
                      <div className="text-[10px] font-bold">
                        {
                          day.weekday
                        }
                      </div>

                      <div className="mt-1 text-sm">
                        {completed
                          ? "🔥"
                          : "•"}
                      </div>
                    </div>
                  );
                }
              )}
            </div>

          </div>


          {nextMilestone ? (
            <div className="mt-5 rounded-2xl border border-violet-100 bg-violet-50 p-4">

              <div className="flex items-start gap-3">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">
                  {
                    nextMilestone.icon
                  }
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-violet-700">
                    الوسام القادم
                  </p>

                  <h3 className="mt-1 font-black text-violet-950">
                    {
                      nextMilestone.title
                    }
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-violet-700">
                    {
                      nextMilestone.description
                    }
                  </p>
                </div>

              </div>

              <div className="mt-4 flex items-center justify-between gap-3 text-xs font-bold text-violet-700">
                <span>
                  {nextMilestone.current}
                  {" / "}
                  {nextMilestone.target}
                  {" "}
                  {nextMilestone.unit}
                </span>

                <span>
                  {nextMilestonePercent}%
                </span>
              </div>

              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-violet-100">
                <div
                  className="h-full rounded-full bg-violet-600"
                  style={{
                    width:
                      `${nextMilestonePercent}%`,
                  }}
                />
              </div>

            </div>
          ) : (
            <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-center">
              <div className="text-3xl">
                👑
              </div>

              <p className="mt-2 font-black text-emerald-900">
                أنجزت كل الأهداف الحالية
              </p>
            </div>
          )}


          <div className="mt-5 rounded-2xl border border-slate-200 p-4">

            <div className="flex items-start justify-between gap-4">

              <div className="min-w-0">

                <p className="text-xs font-bold text-violet-700">
                  تحدي اليوم
                </p>

                {challenge ? (
                  <>
                    <h3 className="mt-1 font-black text-slate-900">
                      {skillIcon(
                        challenge.skill
                      )}{" "}
                      {challenge.title}
                    </h3>

                    <p className="mt-2 text-sm text-slate-600">
                      مهارة{" "}
                      {skillLabel(
                        challenge.skill
                      )}
                      {" • "}
                      الهدف{" "}
                      {challenge.target_score}%
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="mt-1 font-black text-slate-900">
                      🎯 تحدي جديد بانتظارك
                    </h3>

                    <p className="mt-2 text-sm text-slate-600">
                      افتح رحلة اليوم واختر تحديك.
                    </p>
                  </>
                )}

              </div>


              <div
                className={
                  completedToday
                    ? "shrink-0 rounded-xl bg-emerald-100 px-3 py-2 text-xs font-black text-emerald-800"
                    : "shrink-0 rounded-xl bg-amber-100 px-3 py-2 text-xs font-black text-amber-800"
                }
              >
                {completedToday
                  ? "✅ مكتمل"
                  : challenge
                    ? "🔥 مستمر"
                    : "جديد"}
              </div>

            </div>


            {challenge ? (
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">

                <div className="text-sm font-bold text-slate-600">
                  {completedToday
                    ? `النتيجة ${challenge.achieved_score ?? 0}% • +${challengeXp} XP`
                    : `النتيجة الحالية ${challenge.achieved_score ?? 0}%`}
                </div>

                <Link
                  href="/journey/daily"
                  className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-black text-white transition hover:bg-violet-700"
                >
                  {completedToday
                    ? "عرض الإنجاز"
                    : "واصل التحدي"}
                </Link>

              </div>
            ) : (
              <Link
                href="/journey/daily"
                className="mt-4 inline-flex rounded-xl bg-violet-600 px-4 py-2 text-sm font-black text-white transition hover:bg-violet-700"
              >
                ابدأ تحدي اليوم
              </Link>
            )}

          </div>


          <div className="mt-6">

            <div className="flex items-center justify-between gap-4">

              <div>
                <p className="text-xs font-bold text-amber-700">
                  🏆 أوسمتي
                </p>

                <h3 className="mt-1 font-black text-slate-900">
                  {achievements.length} إنجاز
                </h3>
              </div>

              {achievements.length > 0 ? (
                <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
                  تم فتحها
                </div>
              ) : null}

            </div>


            <div className="mt-4 space-y-3">

              {displayedAchievements.length > 0
                ? displayedAchievements.map(
                    achievement => (
                      <div
                        key={
                          achievement.id
                        }
                        className="flex gap-3 rounded-2xl bg-amber-50 p-4"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">
                          {achievement.icon ??
                            "🏆"}
                        </div>

                        <div className="min-w-0">
                          <div className="font-black text-amber-950">
                            {
                              achievement.title
                            }
                          </div>

                          <p className="mt-1 text-xs leading-5 text-amber-800">
                            {achievement.description ??
                              "إنجاز جديد في رحلة تعلمك."}
                          </p>
                        </div>
                      </div>
                    )
                  )
                : (
                  <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 p-4 text-center">
                    <div className="text-3xl">
                      🌱
                    </div>

                    <p className="mt-2 font-black text-slate-800">
                      أول وسام بانتظارك
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      أكمل الدروس والتحديات لفتح إنجازات جديدة.
                    </p>
                  </div>
                )}

            </div>

          </div>


          {level ? (
            <div className="mt-6 rounded-2xl bg-slate-50 p-4">

              <div className="flex items-center justify-between gap-3 text-sm font-bold text-slate-600">

                <span>
                  تقدم المستوى
                </span>

                <span
                  dir="ltr"
                  className="inline-block"
                >
                  {level.currentXP}
                  {" / "}
                  {level.nextLevelXP}
                  {" XP"}
                </span>

              </div>

              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                  style={{
                    width:
                      `${Math.max(
                        0,
                        Math.min(
                          100,
                          level.percent
                        )
                      )}%`,
                  }}
                />
              </div>

            </div>
          ) : null}

        </div>

      </aside>
    </>
  );
}

function MiniMetric({
  icon,
  value,
  label,
}: {
  icon: string;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3 text-center">
      <div className="text-xl">
        {icon}
      </div>

      <div
        dir="ltr"
        className="mt-1 font-black text-slate-900"
      >
        {value}
      </div>

      <div className="mt-1 text-[11px] font-bold text-slate-500">
        {label}
      </div>
    </div>
  );
}
