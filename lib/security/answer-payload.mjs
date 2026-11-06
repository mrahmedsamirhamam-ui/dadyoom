/**
 * Strict allow-list for the public question-answer endpoint.
 * Never accept client-supplied identity, correctness, score, answer key,
 * XP or progress. Those values are computed/loaded on the server.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
const KEYS = Object.freeze(["questionId", "selectedAnswer"]);

export function parseTrustedAnswerInput(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return Object.freeze({ ok: false, error: "INVALID_BODY" });
  }
  const keys = Object.keys(raw);
  if (keys.length !== 2 || keys.some(key => !KEYS.includes(key))) {
    return Object.freeze({ ok: false, error: "UNTRUSTED_FIELDS" });
  }
  const { questionId, selectedAnswer } = raw;
  if (typeof questionId !== "string" || !UUID.test(questionId)) {
    return Object.freeze({ ok: false, error: "INVALID_QUESTION_ID" });
  }
  if (typeof selectedAnswer !== "string" || selectedAnswer.length < 1 || selectedAnswer.length > 256) {
    return Object.freeze({ ok: false, error: "INVALID_SELECTED_ANSWER" });
  }
  return Object.freeze({ ok: true, questionId, selectedAnswer });
}
