export type AdaptiveSkill =
  | "reading"
  | "writing"
  | "listening"
  | "speaking";

export type SkillProgressInput = {
  skill: AdaptiveSkill;
  latest_score: number;
  best_score: number;
  attempts: number;
  xp: number;
  level: string;
};

export type AdaptiveDifficulty =
  | "starter"
  | "foundation"
  | "guided"
  | "standard"
  | "challenge";

export type AdaptiveSkillRecommendation = {
  skill: AdaptiveSkill;
  skillLabel: string;
  icon: string;
  difficulty: AdaptiveDifficulty;
  difficultyLabel: string;
  targetScore: number;
  href: string;
  reason: string;
  message: string;
  profileComplete: boolean;
};

const skillOrder: AdaptiveSkill[] = [
  "reading",
  "listening",
  "writing",
  "speaking",
];

const skillMeta: Record<
  AdaptiveSkill,
  {
    label: string;
    icon: string;
  }
> = {
  reading: {
    label: "القراءة",
    icon: "📖",
  },

  writing: {
    label: "الكتابة",
    icon: "✍️",
  },

  listening: {
    label: "الاستماع",
    icon: "🎧",
  },

  speaking: {
    label: "التحدث",
    icon: "🎙️",
  },
};

function clampScore(
  value: number
) {
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(value)
    )
  );
}

function difficultyFromScore(
  score: number,
  attempts: number
): {
  value: AdaptiveDifficulty;
  label: string;
} {
  if (attempts === 0) {
    return {
      value: "starter",
      label: "استكشافي",
    };
  }

  if (score < 40) {
    return {
      value: "foundation",
      label: "تأسيسي",
    };
  }

  if (score < 60) {
    return {
      value: "guided",
      label: "موجّه",
    };
  }

  if (score < 85) {
    return {
      value: "standard",
      label: "متوسط",
    };
  }

  return {
    value: "challenge",
    label: "تحدٍّ",
  };
}

function targetFromScore(
  score: number
) {
  if (score < 40) {
    return 55;
  }

  if (score < 60) {
    return 70;
  }

  if (score < 75) {
    return 82;
  }

  if (score < 90) {
    return 92;
  }

  return 100;
}

export function recommendAdaptiveSkill(
  progress: SkillProgressInput[]
): AdaptiveSkillRecommendation {
  const map =
    new Map(
      progress.map(
        row => [
          row.skill,
          row,
        ]
      )
    );

  const normalized =
    skillOrder.map(
      skill => {
        const row =
          map.get(skill);

        return {
          skill,

          latest_score:
            clampScore(
              Number(
                row?.latest_score ??
                0
              )
            ),

          best_score:
            clampScore(
              Number(
                row?.best_score ??
                0
              )
            ),

          attempts:
            Math.max(
              0,
              Number(
                row?.attempts ??
                0
              )
            ),

          xp:
            Math.max(
              0,
              Number(
                row?.xp ??
                0
              )
            ),

          level:
            row?.level ??
            "مبتدئ",
        };
      }
    );

  const unpracticed =
    normalized.find(
      row =>
        row.attempts === 0
    );

  /*
   * Phase 1:
   * Before judging weakness, complete
   * the learner profile across all
   * four language skills.
   */
  if (unpracticed) {
    const meta =
      skillMeta[
        unpracticed.skill
      ];

    const difficulty =
      difficultyFromScore(
        0,
        0
      );

    return {
      skill:
        unpracticed.skill,

      skillLabel:
        meta.label,

      icon:
        meta.icon,

      difficulty:
        difficulty.value,

      difficultyLabel:
        difficulty.label,

      targetScore:
        60,

      href:
        `/skills/${unpracticed.skill}/practice?difficulty=${difficulty.value}`,

      reason:
        "لم يبدأ الطالب التدريب على هذه المهارة بعد.",

      message:
        `لن نحكم على نقاط القوة والضعف قبل تجربة المهارات الأربع. ابدأ الآن بمهارة ${meta.label}.`,

      profileComplete:
        false,
    };
  }

  /*
   * Phase 2:
   * Weighted recent performance.
   * Latest result matters more than
   * an old best score.
   */
  const ranked =
    normalized
      .map(
        row => ({
          ...row,

          adaptiveScore:
            Math.round(
              row.latest_score *
                0.7 +
              row.best_score *
                0.3
            ),
        })
      )
      .sort(
        (
          a,
          b
        ) => {
          if (
            a.adaptiveScore !==
            b.adaptiveScore
          ) {
            return (
              a.adaptiveScore -
              b.adaptiveScore
            );
          }

          return (
            a.attempts -
            b.attempts
          );
        }
      );

  const focus =
    ranked[0];

  const meta =
    skillMeta[
      focus.skill
    ];

  const difficulty =
    difficultyFromScore(
      focus.adaptiveScore,
      focus.attempts
    );

  const targetScore =
    targetFromScore(
      focus.adaptiveScore
    );

  return {
    skill:
      focus.skill,

    skillLabel:
      meta.label,

    icon:
      meta.icon,

    difficulty:
      difficulty.value,

    difficultyLabel:
      difficulty.label,

    targetScore,

    href:
      `/skills/${focus.skill}/practice?difficulty=${difficulty.value}`,

    reason:
      `النتيجة التكيفية الحالية ${focus.adaptiveScore}%، اعتمادًا بصورة أكبر على آخر أداء للطالب.`,

    message:
      `يرشح ضاد التركيز الآن على مهارة ${meta.label} بتدريب ${difficulty.label}، والهدف التالي هو الوصول إلى ${targetScore}%.`,

    profileComplete:
      true,
  };
}
