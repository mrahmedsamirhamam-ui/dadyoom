/**
 * Pure curriculum-evidence contract.
 * This does not infer official coverage from a published lesson count.
 * No database access, student data, or external dependencies.
 */
export const COVERAGE_STATUS = Object.freeze({
  MISSING: "missing",
  UNVERIFIED: "unverified",
  VERIFIED: "verified",
});

const nonEmpty = (value) => typeof value === "string" && value.trim().length > 0;

export function evaluateOfficialTopicCoverage(topic, alignments = []) {
  if (!topic || !nonEmpty(topic.id)) {
    throw new TypeError("topic.id is required");
  }
  if (!Array.isArray(alignments)) {
    throw new TypeError("alignments must be an array");
  }

  const linked = alignments.filter((item) =>
    item && item.topicId === topic.id && nonEmpty(item.lessonId)
  );

  if (linked.length === 0) {
    return { status: COVERAGE_STATUS.MISSING, topicId: topic.id, lessonIds: [] };
  }

  const verified = linked.filter((item) =>
    item.reviewStatus === "approved" &&
    item.lessonPublished === true &&
    item.lessonContentReviewed === true &&
    nonEmpty(item.officialSourceUrl) &&
    nonEmpty(item.officialSourceVersion) &&
    nonEmpty(item.reviewedBy) &&
    nonEmpty(item.reviewedAt)
  );

  return {
    status: verified.length ? COVERAGE_STATUS.VERIFIED : COVERAGE_STATUS.UNVERIFIED,
    topicId: topic.id,
    lessonIds: [...new Set(verified.map((item) => item.lessonId))],
  };
}

export function summarizeOfficialCoverage(topics, alignments = []) {
  if (!Array.isArray(topics)) throw new TypeError("topics must be an array");
  const seen = new Set();
  const results = topics.map((topic) => {
    if (seen.has(topic?.id)) throw new TypeError("duplicate official topic id");
    seen.add(topic?.id);
    return evaluateOfficialTopicCoverage(topic, alignments);
  });
  const verified = results.filter((r) => r.status === COVERAGE_STATUS.VERIFIED).length;
  return {
    totalOfficialTopics: results.length,
    verified,
    unverified: results.filter((r) => r.status === COVERAGE_STATUS.UNVERIFIED).length,
    missing: results.filter((r) => r.status === COVERAGE_STATUS.MISSING).length,
    verifiedPercent: results.length ? Math.round((verified / results.length) * 10000) / 100 : null,
    results,
  };
}
