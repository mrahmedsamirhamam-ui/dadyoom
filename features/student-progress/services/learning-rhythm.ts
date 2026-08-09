import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import {
  calculateDailyGoal,
} from "@/features/learning-engine/services/daily-goal";

type ProgressDateRow = {
  completed_at: string | null;
};

export type StudentLearningRhythm = {
  currentStreak: number;
  longestStreak: number;

  today: {
    completedLessons: number;
    active: boolean;
  };

  dailyGoal: {
    target: number;
    completed: number;
    remaining: number;
    finished: boolean;
  };
};

const BAHRAIN_TIME_ZONE =
  "Asia/Bahrain";

function formatBahrainDate(
  date: Date
): string {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          BAHRAIN_TIME_ZONE,

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
      (part) =>
        part.type === "year"
    )?.value;

  const month =
    parts.find(
      (part) =>
        part.type === "month"
    )?.value;

  const day =
    parts.find(
      (part) =>
        part.type === "day"
    )?.value;

  if (
    !year ||
    !month ||
    !day
  ) {
    throw new Error(
      "Unable to format Bahrain date."
    );
  }

  return `${year}-${month}-${day}`;
}

function dateKeyToUtcDay(
  dateKey: string
): number {
  const [
    year,
    month,
    day,
  ] =
    dateKey
      .split("-")
      .map(Number);

  return Date.UTC(
    year,
    month - 1,
    day
  );
}

function calculateStreaks(
  dateKeys: string[],
  todayKey: string
) {
  const uniqueDates =
    Array.from(
      new Set(dateKeys)
    ).sort();

  if (
    uniqueDates.length === 0
  ) {
    return {
      currentStreak: 0,
      longestStreak: 0,
    };
  }

  let longestStreak = 1;
  let runningStreak = 1;

  for (
    let index = 1;
    index < uniqueDates.length;
    index++
  ) {
    const previousDay =
      dateKeyToUtcDay(
        uniqueDates[index - 1]
      );

    const currentDay =
      dateKeyToUtcDay(
        uniqueDates[index]
      );

    const difference =
      Math.round(
        (
          currentDay -
          previousDay
        ) /
          86_400_000
      );

    if (difference === 1) {
      runningStreak += 1;
    } else {
      runningStreak = 1;
    }

    longestStreak =
      Math.max(
        longestStreak,
        runningStreak
      );
  }

  const lastDate =
    uniqueDates[
      uniqueDates.length - 1
    ];

  const todayDay =
    dateKeyToUtcDay(
      todayKey
    );

  const lastDay =
    dateKeyToUtcDay(
      lastDate
    );

  const daysSinceLastActivity =
    Math.round(
      (
        todayDay -
        lastDay
      ) /
        86_400_000
    );

  /*
   * السلسلة تبقى فعالة إذا:
   * - تعلم الطالب اليوم.
   * - أو كان آخر نشاط بالأمس،
   *   وما زال أمامه اليوم ليحافظ عليها.
   */
  let currentStreak = 0;

  if (
    daysSinceLastActivity === 0 ||
    daysSinceLastActivity === 1
  ) {
    currentStreak = 1;

    for (
      let index =
        uniqueDates.length - 1;
      index > 0;
      index--
    ) {
      const current =
        dateKeyToUtcDay(
          uniqueDates[index]
        );

      const previous =
        dateKeyToUtcDay(
          uniqueDates[index - 1]
        );

      const difference =
        Math.round(
          (
            current -
            previous
          ) /
            86_400_000
        );

      if (difference !== 1) {
        break;
      }

      currentStreak += 1;
    }
  }

  return {
    currentStreak,
    longestStreak,
  };
}

export async function getStudentLearningRhythm(
  supabase: SupabaseClient,
  studentId: string
): Promise<StudentLearningRhythm> {
  const {
    data,
    error,
  } = await supabase
    .from(
      "student_lesson_progress"
    )
    .select(
      "completed_at"
    )
    .eq(
      "student_id",
      studentId
    )
    .in(
      "status",
      [
        "completed",
        "mastered",
      ]
    )
    .not(
      "completed_at",
      "is",
      null
    );

  if (error) {
    throw error;
  }

  const rows =
    (data ?? []) as
      ProgressDateRow[];

  const todayKey =
    formatBahrainDate(
      new Date()
    );

  const activityDates =
    rows
      .map(
        (row) =>
          row.completed_at
      )
      .filter(
        (
          value
        ): value is string =>
          Boolean(value)
      )
      .map(
        (value) =>
          formatBahrainDate(
            new Date(value)
          )
      );

  const completedToday =
    activityDates.filter(
      (dateKey) =>
        dateKey === todayKey
    ).length;

  const streaks =
    calculateStreaks(
      activityDates,
      todayKey
    );

  const dailyGoal =
    calculateDailyGoal(
      completedToday
    );

  return {
    currentStreak:
      streaks.currentStreak,

    longestStreak:
      streaks.longestStreak,

    today: {
      completedLessons:
        completedToday,

      active:
        completedToday > 0,
    },

    dailyGoal,
  };
}