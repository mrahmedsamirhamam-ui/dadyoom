import { needsSourcePublicationReview, publicLessonDescription } from "../lesson-content/publication-readiness";

/**
 * Descriptive structured data only. Not a claim of curriculum approval or an
 * eligible Google rich-result feature. Keep source-unready lessons unmarked.
 */
export type PublicLessonSeoInput = {
  id: string;
  title: string | null;
  summary: string | null;
  instructions: unknown;
  status: string;
  siteUrl: string;
};

export function buildPublicLessonStructuredData(input: PublicLessonSeoInput) {
  if (
    input.status !== "published" ||
    needsSourcePublicationReview(input.instructions) ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.id)
  ) return null;

  const title = input.title?.trim();
  if (!title) return null;

  const base = input.siteUrl.replace(/\/$/, "");
  const url = `${base}/lessons/${input.id}`;
  const description = publicLessonDescription(input.summary, input.instructions).trim();

  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    "@id": `${url}#learning-resource`,
    url,
    name: title,
    ...(description ? { description } : {}),
    inLanguage: "ar",
    learningResourceType: "Lesson",
    isPartOf: { "@id": `${base}/#website` },
    provider: { "@id": `${base}/#organization` },
  };
}
