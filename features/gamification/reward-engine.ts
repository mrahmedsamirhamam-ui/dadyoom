import { getLevelByXp } from "@/lib/constants/levels";

export type SkillKey = "reading" | "writing" | "listening" | "speaking";

export type SkillRewardStat = {
  bestScore: number;
  attempts: number;
  xp: number;
};

export type LearnerRewardSnapshot = {
  totalXP: number;
  lessonXP: number;
  skillXP: number;
  dailyChallengeXP: number;
  rewardXP: number;
  gameXP: number;
  completedLessons: number;
  masteredLessons: number;
  currentStreak: number;
  longestStreak: number;
  dailyChallengesCompleted: number;
  publishedGradeLessons: number;
  skills: Record<SkillKey, SkillRewardStat>;
};

export type RewardDefinition = {
  key: string;
  category: "badge" | "title" | "subscription";
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
  current: number;
  target: number;
  unit: string;
  plusDays?: number;
};

export type CertificateDefinition = {
  key: string;
  title: string;
  subtitle: string;
  unlocked: boolean;
  detail: string;
};

const skillKeys: SkillKey[] = ["reading", "writing", "listening", "speaking"];

function skillCount(snapshot: LearnerRewardSnapshot, minScore: number) {
  return skillKeys.filter((key) => {
    const stat = snapshot.skills[key];
    return stat.attempts > 0 && stat.bestScore >= minScore;
  }).length;
}

function milestone(
  key: string,
  icon: string,
  title: string,
  description: string,
  current: number,
  target: number,
  unit: string,
  category: RewardDefinition["category"] = "badge",
): RewardDefinition {
  return {
    key,
    icon,
    title,
    description,
    current,
    target,
    unit,
    category,
    unlocked: current >= target,
  };
}

export function buildLearnerRewards(
  snapshot: LearnerRewardSnapshot,
): RewardDefinition[] {
  const level = getLevelByXp(snapshot.totalXP);

  return [
    milestone("FIRST_LESSON", "🥇", "أول خطوة", "أكملت أول درس في ضاديوم.", snapshot.completedLessons, 1, "درس"),
    milestone("FIVE_LESSONS", "📚", "طالب مجتهد", "أكملت خمسة دروس.", snapshot.completedLessons, 5, "دروس"),
    milestone("TEN_LESSONS", "🏅", "عاشق التعلّم", "أكملت عشرة دروس.", snapshot.completedLessons, 10, "دروس"),
    milestone("TWENTY_FIVE_LESSONS", "🎯", "صاحب الهمة", "أكملت خمسة وعشرين درسًا.", snapshot.completedLessons, 25, "درسًا"),
    milestone("FIFTY_LESSONS", "🏆", "بطل ضاديوم", "أكملت خمسين درسًا.", snapshot.completedLessons, 50, "درسًا"),
    milestone("HUNDRED_LESSONS", "👑", "نجم المئة", "أكملت مئة درس.", snapshot.completedLessons, 100, "درس"),
    milestone("MASTERY_10", "⭐", "متقن العربية", "أتقنت عشرة دروس.", snapshot.masteredLessons, 10, "دروس"),
    milestone("MASTERY_20", "🌟", "خبير العربية", "أتقنت عشرين درسًا.", snapshot.masteredLessons, 20, "درسًا"),
    milestone("STREAK_3", "🔥", "شعلة البداية", "ثلاثة أيام متتالية من النشاط.", snapshot.currentStreak, 3, "أيام"),
    milestone("SEVEN_DAY_STREAK", "🔥", "سبعة أيام من الحماس", "سبعة أيام متتالية من التعلم.", snapshot.currentStreak, 7, "أيام"),
    milestone("STREAK_30", "💎", "ثبات لا يتوقف", "ثلاثون يومًا متتالية من التعلم.", snapshot.currentStreak, 30, "يومًا"),
    milestone("FOUR_SKILLS_STARTED", "🧠", "مستكشف المهارات الأربع", "بدأت القراءة والكتابة والاستماع والتحدث.", skillCount(snapshot, 1), 4, "مهارات"),
    milestone("FOUR_SKILLS_75", "🎓", "متوازن المهارات", "وصلت إلى 75% أو أكثر في المهارات الأربع.", skillCount(snapshot, 75), 4, "مهارات"),
    milestone("FOUR_SKILLS_90", "🏛️", "متقن المهارات الأربع", "وصلت إلى 90% أو أكثر في المهارات الأربع.", skillCount(snapshot, 90), 4, "مهارات"),
    milestone("XP_100", "⚡", "جامع النقاط", "وصلت إلى 100 XP.", snapshot.totalXP, 100, "XP"),
    milestone("XP_500", "🚀", "منطلق بقوة", "وصلت إلى 500 XP.", snapshot.totalXP, 500, "XP"),
    milestone("XP_1000", "🌠", "ألف نقطة خبرة", "وصلت إلى 1000 XP.", snapshot.totalXP, 1000, "XP"),
    milestone("TITLE_KNIGHT", "⚔️", "لقب فارس العربية", "لقب شرفي عند بلوغ المستوى السابع.", level.level, 7, "مستوى", "title"),
    milestone("TITLE_AMBASSADOR", "🕊️", "لقب سفير العربية", "لقب شرفي عند بلوغ المستوى الثامن.", level.level, 8, "مستوى", "title"),
    milestone("TITLE_STAR", "🌟", "لقب نجم ضاديوم", "لقب شرفي عند بلوغ المستوى التاسع.", level.level, 9, "مستوى", "title"),
    milestone("TITLE_LEGEND", "👑", "لقب أسطورة العربية", "أعلى لقب شرفي في ضاديوم.", level.level, 10, "مستوى", "title"),
  ];
}

export function buildSubscriptionRewards(
  snapshot: LearnerRewardSnapshot,
): RewardDefinition[] {
  const level = getLevelByXp(snapshot.totalXP);
  const fourMastered = skillCount(snapshot, 90);

  const plus7 =
    level.level >= 7 ||
    snapshot.completedLessons >= 50 ||
    snapshot.masteredLessons >= 25;

  const plus30 =
    level.level >= 9 ||
    snapshot.completedLessons >= 100 ||
    fourMastered === 4;

  return [
    {
      key: "PLUS_7D",
      category: "subscription",
      icon: "🎁",
      title: "هدية Plus لمدة 7 أيام",
      description: "تُفتح عند مستوى فارس العربية، أو 50 درسًا مكتملًا، أو 25 درسًا متقنًا.",
      unlocked: plus7,
      current: plus7 ? 1 : Math.max(level.level / 7, snapshot.completedLessons / 50, snapshot.masteredLessons / 25),
      target: 1,
      unit: "إنجاز",
      plusDays: 7,
    },
    {
      key: "PLUS_30D",
      category: "subscription",
      icon: "🏆",
      title: "هدية Plus لمدة 30 يومًا",
      description: "تُفتح عند مستوى نجم ضاديوم، أو 100 درس، أو إتقان المهارات الأربع بنسبة 90% فأكثر.",
      unlocked: plus30,
      current: plus30 ? 1 : Math.max(level.level / 9, snapshot.completedLessons / 100, fourMastered / 4),
      target: 1,
      unit: "إنجاز",
      plusDays: 30,
    },
  ];
}

export function buildLearnerCertificates(
  snapshot: LearnerRewardSnapshot,
): CertificateDefinition[] {
  const level = getLevelByXp(snapshot.totalXP);
  const fourStarted = skillCount(snapshot, 1);
  const fourMastered = skillCount(snapshot, 90);
  const gradeComplete =
    snapshot.publishedGradeLessons > 0 &&
    snapshot.completedLessons >= snapshot.publishedGradeLessons;

  return [
    { key: "CERT_LESSONS_10", title: "شهادة المثابرة", subtitle: "لإكمال 10 دروس في ضاديوم", unlocked: snapshot.completedLessons >= 10, detail: `${snapshot.completedLessons} درسًا مكتملًا` },
    { key: "CERT_LESSONS_25", title: "شهادة الإنجاز", subtitle: "لإكمال 25 درسًا في ضاديوم", unlocked: snapshot.completedLessons >= 25, detail: `${snapshot.completedLessons} درسًا مكتملًا` },
    { key: "CERT_LESSONS_50", title: "شهادة التميز", subtitle: "لإكمال 50 درسًا في ضاديوم", unlocked: snapshot.completedLessons >= 50, detail: `${snapshot.completedLessons} درسًا مكتملًا` },
    { key: "CERT_LESSONS_100", title: "شهادة نجم ضاديوم", subtitle: "لإكمال 100 درس في ضاديوم", unlocked: snapshot.completedLessons >= 100, detail: `${snapshot.completedLessons} درسًا مكتملًا` },
    { key: "CERT_MASTERY_20", title: "شهادة الإتقان", subtitle: "لإتقان 20 درسًا", unlocked: snapshot.masteredLessons >= 20, detail: `${snapshot.masteredLessons} درسًا متقنًا` },
    { key: "CERT_FOUR_SKILLS", title: "شهادة المهارات الأربع", subtitle: "للتدرب على القراءة والكتابة والاستماع والتحدث", unlocked: fourStarted === 4, detail: `${fourStarted}/4 مهارات` },
    { key: "CERT_FOUR_SKILLS_MASTERY", title: "شهادة إتقان المهارات الأربع", subtitle: "لتحقيق 90% أو أكثر في المهارات الأربع", unlocked: fourMastered === 4, detail: `${fourMastered}/4 مهارات متقنة` },
    { key: "CERT_STREAK_7", title: "شهادة الاستمرارية", subtitle: "للتعلم سبعة أيام متتالية", unlocked: snapshot.longestStreak >= 7, detail: `أطول سلسلة ${snapshot.longestStreak} يومًا` },
    { key: "CERT_STREAK_30", title: "شهادة الالتزام", subtitle: "للتعلم ثلاثين يومًا متتالية", unlocked: snapshot.longestStreak >= 30, detail: `أطول سلسلة ${snapshot.longestStreak} يومًا` },
    { key: "CERT_ARABIC_KNIGHT", title: "شهادة فارس العربية", subtitle: "لبلوغ مستوى فارس العربية", unlocked: level.level >= 7, detail: `المستوى ${level.level} — ${level.name}` },
    { key: "CERT_GRADE_COMPLETE", title: "شهادة إتمام منهج الصف", subtitle: "لإكمال جميع الدروس المنشورة في الصف الحالي", unlocked: gradeComplete, detail: `${snapshot.completedLessons}/${snapshot.publishedGradeLessons} درسًا` },
  ];
}

export function roleCertificate(role: string): CertificateDefinition | null {
  const clean = role.trim().toLowerCase();

  const map: Record<string, CertificateDefinition> = {
    teacher: { key: "CERT_ROLE_TEACHER", title: "شهادة معلم ضاديوم", subtitle: "تقديرًا للمساهمة في رحلة تعلم العربية", unlocked: true, detail: "معلم في بيت العربية الرقمي" },
    parent: { key: "CERT_ROLE_PARENT", title: "شهادة شريك التعلم", subtitle: "تقديرًا لدعم رحلة الأبناء التعليمية", unlocked: true, detail: "ولي أمر داعم للتعلم" },
    school: { key: "CERT_ROLE_SCHOOL", title: "شهادة شراكة تعليمية", subtitle: "تقديرًا لدعم تعلم العربية رقميًا", unlocked: true, detail: "مدرسة شريكة في ضاديوم" },
    admin: { key: "CERT_ROLE_ADMIN", title: "شهادة إدارة ضاديوم", subtitle: "تقديرًا لدعم بيت العربية الرقمي", unlocked: true, detail: "إدارة المنصة" },
  };

  return map[clean] ?? null;
}
