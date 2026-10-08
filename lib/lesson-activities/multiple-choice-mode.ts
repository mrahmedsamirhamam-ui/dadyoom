/** Explicit modes win; keep historic multi-select behavior outside Dadyoom adult MCQs. */
export function allowsMultipleSelection(content: Record<string, unknown>, numberOfOptions: number): boolean {
  if (content.selection_mode === "multiple") return true;
  if (content.selection_mode === "single") return false;
  const origin = typeof content.origin === "string" ? content.origin : "";
  if (/^DADYOOM_BH_(?:CONTINUING_LITERACY[12]|FOLLOWUP[12])_MCQ_V1$/.test(origin)) return false;
  return numberOfOptions > 3;
}
