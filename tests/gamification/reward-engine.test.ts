import { describe, expect, it } from "vitest";

import {
  buildLearnerCertificates,
  buildLearnerRewards,
  buildSubscriptionRewards,
  type LearnerRewardSnapshot,
} from "@/features/gamification/reward-engine";

function snap(
  overrides: Partial<LearnerRewardSnapshot> = {},
): LearnerRewardSnapshot {
  return {
    totalXP: 0,
    lessonXP: 0,
    skillXP: 0,
    dailyChallengeXP: 0,
    rewardXP: 0,
    gameXP: 0,
    completedLessons: 0,
    masteredLessons: 0,
    currentStreak: 0,
    longestStreak: 0,
    dailyChallengesCompleted: 0,
    publishedGradeLessons: 18,
    skills: {
      reading: { bestScore: 0, attempts: 0, xp: 0 },
      writing: { bestScore: 0, attempts: 0, xp: 0 },
      listening: { bestScore: 0, attempts: 0, xp: 0 },
      speaking: { bestScore: 0, attempts: 0, xp: 0 },
    },
    ...overrides,
  };
}

describe("reward engine", () => {
  it("unlocks lesson milestones", () => {
    const rewards = buildLearnerRewards(snap({ completedLessons: 10, totalXP: 300 }));
    expect(rewards.find((x) => x.key === "FIRST_LESSON")?.unlocked).toBe(true);
    expect(rewards.find((x) => x.key === "TEN_LESSONS")?.unlocked).toBe(true);
    expect(rewards.find((x) => x.key === "FIFTY_LESSONS")?.unlocked).toBe(false);
  });

  it("unlocks the four-skills mastery certificate", () => {
    const skills = {
      reading: { bestScore: 95, attempts: 1, xp: 25 },
      writing: { bestScore: 95, attempts: 1, xp: 25 },
      listening: { bestScore: 95, attempts: 1, xp: 25 },
      speaking: { bestScore: 95, attempts: 1, xp: 25 },
    };

    const certs = buildLearnerCertificates(snap({ skills }));
    expect(
      certs.find((x) => x.key === "CERT_FOUR_SKILLS_MASTERY")?.unlocked,
    ).toBe(true);
  });

  it("unlocks free Plus rewards at defined milestones", () => {
    expect(
      buildSubscriptionRewards(snap({ totalXP: 2500 }))
        .find((x) => x.key === "PLUS_7D")?.unlocked,
    ).toBe(true);

    const skills = {
      reading: { bestScore: 95, attempts: 1, xp: 25 },
      writing: { bestScore: 95, attempts: 1, xp: 25 },
      listening: { bestScore: 95, attempts: 1, xp: 25 },
      speaking: { bestScore: 95, attempts: 1, xp: 25 },
    };

    expect(
      buildSubscriptionRewards(snap({ skills }))
        .find((x) => x.key === "PLUS_30D")?.unlocked,
    ).toBe(true);
  });

  it("unlocks grade completion only when all published lessons are complete", () => {
    expect(
      buildLearnerCertificates(
        snap({ completedLessons: 17, publishedGradeLessons: 18 }),
      ).find((x) => x.key === "CERT_GRADE_COMPLETE")?.unlocked,
    ).toBe(false);

    expect(
      buildLearnerCertificates(
        snap({ completedLessons: 18, publishedGradeLessons: 18 }),
      ).find((x) => x.key === "CERT_GRADE_COMPLETE")?.unlocked,
    ).toBe(true);
  });
});
