export const REVIEW_STAGES = [
  "published_unreviewed", "draft", "language_review", "curriculum_review",
  "limited_trial", "approved", "published",
] as const;
export type ReviewStage = (typeof REVIEW_STAGES)[number];

export const NEXT_REVIEW_STAGE: Partial<Record<ReviewStage, ReviewStage>> = {
  published_unreviewed: "draft",
  draft: "language_review",
  language_review: "curriculum_review",
  curriculum_review: "limited_trial",
  limited_trial: "approved",
  approved: "published",
};

export const QUALITY_AXES = [
  { key: "language", name: "الصحة اللغوية", description: "النحو والإملاء والصرف والتشكيل" },
  { key: "curriculum", name: "مطابقة المنهج", description: "الدولة والصف ومخرجات التعلم والمصدر" },
  { key: "audio", name: "الصوت والنطق", description: "وجود تسجيل حقيقي واضح عند الحاجة ودقة النطق" },
  { key: "four_skills", name: "المهارات الأربع", description: "تحديد ما يقيسه الدرس فعليًا، لا الافتراض بوجود الأربع" },
  { key: "mastery", name: "الإتقان", description: "تشخيص قبلي وبعدي ومراجعة لاحقة" },
  { key: "usability", name: "سهولة الاستخدام", description: "الجوال والتشكيل وسرعة تشغيل الصوت" },
] as const;
export type QualityAxis = (typeof QUALITY_AXES)[number]["key"];
export type AxisState = "unreviewed" | "in_review" | "approved" | "needs_changes";
export type AxisReview = { axis: QualityAxis; state: AxisState; reviewer_id?: string | null; reviewed_at?: string | null; notes?: string | null };

export const STAGE_LABELS: Record<ReviewStage, string> = {
  published_unreviewed: "منشور — لم يُراجَع",
  draft: "مسودة",
  language_review: "مراجعة لغوية",
  curriculum_review: "مراجعة منهجية",
  limited_trial: "تجربة محدودة",
  approved: "معتمد داخليًا",
  published: "منشور بعد المراجعة",
};
export const AXIS_LABELS: Record<AxisState,string> = {
  unreviewed: "لم يُراجَع",
  in_review: "قيد المراجعة",
  approved: "معتمد داخليًا",
  needs_changes: "يحتاج تعديلًا",
};

export function isApprovedOnAllAxes(reviews: readonly AxisReview[]): boolean {
  return QUALITY_AXES.every(({ key }) => reviews.some(
    (r) => r.axis === key && r.state === "approved"
      && Boolean(r.reviewer_id) && Boolean(r.reviewed_at) && Boolean(r.notes?.trim()),
  ));
}

export function isValidNextStage(from: ReviewStage, to: ReviewStage): boolean {
  return NEXT_REVIEW_STAGE[from] === to;
}

// Deliberate hard stop: NEVER enable visitors' badge through a data flag alone.
// Requires separate explicit user approval and separately reviewed code change.
export const PUBLIC_REVIEW_BADGE_ENABLED = false as const;
export function shouldDisplayPublicReviewBadge(
  stage: ReviewStage,
  axes: readonly AxisReview[],
): boolean {
  return Boolean(PUBLIC_REVIEW_BADGE_ENABLED) && stage === "published" && isApprovedOnAllAxes(axes);
}
