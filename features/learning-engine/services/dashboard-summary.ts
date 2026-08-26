type DashboardSummaryState = {
  profile: {
    current_level?: number | null;
    total_xp?: number | null;
  } | null;

  statistics: {
    totalXP: number;
    level: {
      level: number;
    };
  };
};

export function dashboardSummary(
  state: DashboardSummaryState
): string {
  const xp = state.statistics.totalXP;
  const level = state.statistics.level.level;

  if (xp < 100) {
    return `أنت في بداية رحلتك. المستوى ${level}.`;
  }

  if (xp < 500) {
    return "أداؤك جيد، استمر للوصول إلى المستوى التالي.";
  }

  return "ممتاز! أنت من الطلاب المتقدمين في ضاديوم.";
}
