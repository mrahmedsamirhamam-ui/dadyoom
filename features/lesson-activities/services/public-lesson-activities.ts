/**
 * Public lesson activity projection.
 *
 * The activity `answer` database column belongs to the trusted grader.
 * Project only the fields needed to render student activities and recursively
 * remove accidental grading hints from future nested content/option schemas.
 *
 * This is defense-in-depth for the Next.js page serializer, NOT a substitute
 * for hardening the directly callable Supabase RPC/table grants.
 */
export type StudentLessonActivity = {
  id: string;
  lesson_id: string;
  title: string;
  activity_type: string;
  instructions: string | null;
  content: Record<string, unknown>;
  activity_order: number;
  points: number;
  is_published: boolean;
  section: string;
  created_at: string;
  updated_at: string;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// Normalize punctuation/case so is_correct, isCorrect and is-correct are
// treated identically, including inside arbitrary arrays of options.
const privateFields = new Set([
  "answer", "answers", "answerkey", "correctanswer", "correctanswers",
  "iscorrect", "iscorrectoption", "correctoption", "solution", "solutions",
  "grading", "gradingkey", "expectedanswer", "expectedanswers",
  "privateanswer", "rightanswer", "markingkey",
]);

function sanitizeContent(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeContent);
  }

  if (isObject(value)) {
    const safe: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (privateFields.has(normalized)) continue;
      safe[key] = sanitizeContent(nested);
    }
    return safe;
  }

  return value;
}

export function publicLessonActivities(input: unknown): StudentLessonActivity[] {
  if (!Array.isArray(input)) return [];

  return input.flatMap((item: unknown) => {
    if (!isObject(item) ||
        typeof item.id !== "string" ||
        typeof item.lesson_id !== "string" ||
        typeof item.title !== "string" ||
        typeof item.activity_type !== "string") {
      return [];
    }

    const content = sanitizeContent(item.content);
    const safeContent = isObject(content) ? content : {};
    const rawSection = typeof item.section === "string"
      ? item.section : safeContent.section;

    return [{
      id: item.id,
      lesson_id: item.lesson_id,
      title: item.title,
      activity_type: item.activity_type,
      instructions: typeof item.instructions === "string" ? item.instructions : null,
      content: safeContent,
      activity_order: typeof item.activity_order === "number" &&
        Number.isFinite(item.activity_order) ? item.activity_order : 0,
      points: typeof item.points === "number" && Number.isFinite(item.points)
        ? item.points : 0,
      is_published: item.is_published === true,
      section: typeof rawSection === "string" ? rawSection : "",
      created_at: typeof item.created_at === "string" ? item.created_at : "",
      updated_at: typeof item.updated_at === "string" ? item.updated_at : "",
    }];
  });
}
