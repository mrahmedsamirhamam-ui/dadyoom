import { describe, expect, it } from "vitest";
import { buildLessonPracticeSnapshot } from "../features/adaptive-learning/services/lesson-practice-snapshot";
import { evaluatePerformance } from "../features/adaptive-learning/services/evaluatePerformance";

describe("adaptive practice score integrity across stored lessons", () => {
  it("counts all items, not just successful answered questions", () => {
    const s=buildLessonPracticeSnapshot({
      questionIds:["q1","q2","q3"],
      activityIds:[],
      questionAttempts:[{question_id:"q1",is_correct:true}],
      activityAttempts:[],
    });
    expect(s).toMatchObject({totalItems:3,correctCount:1,score:33});
  });
  it("activity participation or failed answer does NOT become a correct answer", () => {
    const s=buildLessonPracticeSnapshot({
      questionIds:[],activityIds:["a1","a2"],
      questionAttempts:[],activityAttempts:[{activity_id:"a1",is_correct:false}],
    });
    expect(s).toMatchObject({totalItems:2,correctCount:0,score:0});
  });
  it("deduplicates correct question retries, activity retries and stale IDs", () => {
    const s=buildLessonPracticeSnapshot({
      questionIds:["q1","q1","q2"],activityIds:["a1","a1"],
      questionAttempts:[
        {question_id:"q1",is_correct:false},{question_id:"q1",is_correct:true},
        {question_id:"q1",is_correct:true},{question_id:"missing",is_correct:true},
        {question_id:"q2",is_correct:false},
      ],
      activityAttempts:[
        {activity_id:"a1",is_correct:false},{activity_id:"a1",is_correct:true},
        {activity_id:"missing",is_correct:true}
      ],
    });
    expect(s).toMatchObject({totalItems:3,correctCount:2,score:67,correctQuestionCount:1,wrongQuestionIds:["q2"]});
  });
  it("does not claim mastery from 100% activity-only participation", () => {
    const s=buildLessonPracticeSnapshot({
      questionIds:[],activityIds:["a1"],
      questionAttempts:[],activityAttempts:[{activity_id:"a1",is_correct:true}],
    });
    const r=evaluatePerformance({
      score:s.score,attempts:s.attempts,currentLessonId:"this",nextLessonId:"next",
      masteryVerified:false
    });
    expect(r.decision).not.toBe("mastered");
    expect(r.recommendedLessonId).toBe("this");
    expect(r.message).not.toContain("أتقنت الدرس");
  });
  it("allows navigation only after recorded >=90% mastered status", () => {
    const attempts=[{question_id:"q1",is_correct:true}];
    const unverified=evaluatePerformance({
      score:100,attempts,currentLessonId:"this",nextLessonId:"next"
    });
    expect(unverified.recommendedLessonId).toBe("this");
    expect(unverified.decision).toBe("continue");
    const verified=evaluatePerformance({
      score:95,attempts,currentLessonId:"this",nextLessonId:"next",
      masteryVerified:true
    });
    expect(verified.decision).toBe("mastered");
    expect(verified.recommendedLessonId).toBe("next");
  });
  it("never reports an empty lesson as mastered", () => {
    const s=buildLessonPracticeSnapshot({
      questionIds:[],activityIds:[],questionAttempts:[],activityAttempts:[]
    });
    expect(s).toMatchObject({score:0,totalItems:0,correctCount:0});
  });
});
