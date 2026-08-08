export function calculateDailyGoal(
  completedToday: number
) {
  const target = 3;

  return {
    target,
    completed: completedToday,
    remaining:
      Math.max(
        0,
        target - completedToday
      ),
    finished:
      completedToday >= target,
  };
}