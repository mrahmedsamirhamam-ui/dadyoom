export type SkillName =
  | "reading"
  | "writing"
  | "listening"
  | "speaking";

export type SavedSkillProgress = {
  skill: SkillName;
  latestScore: number;
  bestScore: number;
  attempts: number;
  gainedXp: number;
  xp: number;
  level: string;
};

export async function saveSkillProgress(
  skill: SkillName,
  score: number
): Promise<SavedSkillProgress | null> {
  try {
    const response =
      await fetch(
        "/api/skills/progress",
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              skill,
              score,
            }),
        }
      );

    const data =
      await response
        .json();

    if (
      response.status === 409 &&
      data.code === "UNVERIFIED_SKILL_SCORE"
    ) {
      // A formative, browser-graded exercise cannot mint academic XP.
      // Keep the on-page feedback, without reporting a server failure.
      return null;
    }

    if (
      !response.ok ||
      !data.ok
    ) {
      console.warn(
        "SKILL_PROGRESS_SAVE_SKIPPED:",
        data
      );

      return null;
    }

    return data.progress;
  }
  catch (error) {
    console.warn(
      "SKILL_PROGRESS_SAVE_FAILED:",
      error
    );

    return null;
  }
}
