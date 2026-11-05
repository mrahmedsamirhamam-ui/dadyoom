export type GroundedGameItem = {
  prompt: string;
  answer: string | boolean;
  options?: string[];
};

/**
 * A game has as many authentic rounds as the lesson supports.
 * Never repeat the same question just to manufacture five rounds.
 */
export function takeDistinctRounds<T extends GroundedGameItem>(
  items: T[],
  limit = 5,
): T[] {
  const seen = new Set<string>();
  const rounds: T[] = [];
  for (const item of items) {
    const prompt = String(item.prompt ?? "").trim();
    const answer = item.answer;
    if (!prompt || (typeof answer === "string" && !answer.trim())) continue;
    if (typeof answer === "string") {
      const options = item.options ?? [];
      if (new Set(options.map((value) => value.trim()).filter(Boolean)).size < 2) continue;
      if (!options.includes(answer)) continue;
    }
    const key = prompt.replace(/\s+/gu," ").toLowerCase()+"|"+String(answer);
    if (seen.has(key)) continue;
    seen.add(key);
    rounds.push(item);
    if (rounds.length >= limit) break;
  }
  return rounds;
}
