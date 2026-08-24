import type {
  AdaptiveSkill,
} from "@/features/adaptive-skills/adaptive-skill-engine";

export type DailyChallenge = {
  id: string;
  skill: AdaptiveSkill;
  title: string;
  description: string;
  icon: string;
  href: string;
  targetScore: number;
  bonusLabel: string;
  estimatedMinutes: number;
};

type Params = {
  skill: AdaptiveSkill;
  skillLabel: string;
  href: string;
  targetScore: number;
};

const challengeText:
  Record<
    AdaptiveSkill,
    {
      icon: string;
      title: string;
      description: string;
    }
  > = {

  reading: {
    icon: "📖",
    title: "تحدي القارئ الذكي",
    description:
      "أكمل تدريب القراءة اليوم وحاول الوصول إلى هدفك.",
  },

  writing: {
    icon: "✍️",
    title: "تحدي الكاتب الصغير",
    description:
      "أنجز تدريب الكتابة وركز على الوضوح وصحة التعبير.",
  },

  listening: {
    icon: "🎧",
    title: "تحدي الأذن الذهبية",
    description:
      "استمع جيدًا وحقق أفضل نتيجة تستطيع الوصول إليها.",
  },

  speaking: {
    icon: "🎙️",
    title: "تحدي المتحدث الواثق",
    description:
      "أكمل مهمة التحدث وحاول تحقيق هدف مستواك.",
  },
};

export function createDailyChallenge({
  skill,
  skillLabel,
  href,
  targetScore,
}: Params): DailyChallenge {

  const challenge =
    challengeText[skill];

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

  return {
    id: `${today}-${skill}`,

    skill,

    icon:
      challenge.icon,

    title:
      challenge.title,

    description:
      `${challenge.description} تركيز اليوم: ${skillLabel}.`,

    href,

    targetScore,

    bonusLabel:
      "XP التدريب + خطوة نحو سلسلة الإنجاز",

    estimatedMinutes:
      7,
  };
}
