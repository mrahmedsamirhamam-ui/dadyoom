export type TocCandidate = {
  id: string;
  title: string;
  semester: number | null;
  official_content_scope: string | null;
};

export type TitleMatch = {
  title: string;
  status: "candidate_only" | "missing" | "ambiguous";
  lessonId: string | null;
  lessonTitle: string | null;
};

/**
 * Conservative candidate finder, NOT book certification or verification.
 * It excludes independent enrichment, other terms and duplicate titles.
 */
export function normalizeTocTitle(text: string): string {
  return text.normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670\u0640]/gu, "")
    .replace(/[أإآٱ]/gu, "ا")
    .replace(/[،؛؟!.,:()[\]{}"“”«»_\-]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

export function inspectTocMatches(
  outline: string,
  lessons: readonly TocCandidate[],
  term: number,
): TitleMatch[] {
  const items = outline.split(/\r?\n/u).map(x => x.trim()).filter(Boolean);
  const eligible = lessons.filter(lesson =>
    lesson.semester === term &&
    (lesson.official_content_scope === "plan-scheduled" ||
     lesson.official_content_scope === "official-book-unscheduled")
  );
  const lessonMap = new Map<string, TocCandidate[]>();
  for (const lesson of eligible) {
    const key = normalizeTocTitle(lesson.title);
    if (!key) continue;
    lessonMap.set(key, [...(lessonMap.get(key) ?? []), lesson]);
  }
  const seen = new Map<string, number>();
  for (const item of items) {
    const key = normalizeTocTitle(item);
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  return items.map(title => {
    const key = normalizeTocTitle(title);
    const candidates = lessonMap.get(key) ?? [];
    if (!key || (seen.get(key) ?? 0) > 1 || candidates.length > 1) {
      return { title, status: "ambiguous" as const, lessonId: null, lessonTitle: null };
    }
    if (candidates.length === 0) {
      return { title, status: "missing" as const, lessonId: null, lessonTitle: null };
    }
    return {
      title, status: "candidate_only" as const,
      lessonId: candidates[0].id, lessonTitle: candidates[0].title,
    };
  });
}
