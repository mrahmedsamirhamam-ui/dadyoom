import { approvedPack, GAME_MODES, type GamePack } from "./lesson-game-pack";

/**
 * An editor can repair drafts but never approve incomplete/duplicate items.
 * The server still revalidates the pack and the caller's admin permissions.
 */
export function validateReviewedProposal(input: unknown): GamePack | null {
  const pack = approvedPack(input);
  if (!pack) return null;
  const questions = GAME_MODES.flatMap(mode => pack[mode]);
  if (questions.length !== 25 ||
      new Set(questions.map(item => item.prompt.trim().replace(/\s+/gu, " "))).size !== 25) {
    return null;
  }
  if (questions.some(item =>
    item.options.filter(option => option === item.answer).length !== 1 ||
    (item.explanation?.trim().length ?? 0) < 24)) {
    return null;
  }
  return pack;
}
