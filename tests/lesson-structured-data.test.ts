import { describe, expect, it } from "vitest";
import { buildPublicLessonStructuredData } from "@/lib/seo/lesson-structured-data";

const id = "d2f640d8-e9ca-4e16-b3aa-ac03de771412";
const fixture = {
  id,
  title: "التاء المربوطة والتاء المفتوحة",
  summary: "درس حول التفريق بين التاء المربوطة والمفتوحة.",
  instructions: [],
  status: "published",
  siteUrl: "https://dadyoom.com",
};

describe("lesson SEO structured data — no invented claims", () => {
  it("uses only verified displayed title, summary, canonical URL and organisation", () => {
    const item = buildPublicLessonStructuredData(fixture);
    expect(item).toMatchObject({
      "@type": "LearningResource",
      name: fixture.title,
      description: fixture.summary,
      url: `https://dadyoom.com/lessons/${id}`,
      provider: { "@id": "https://dadyoom.com/#organization" },
    });
    expect(JSON.stringify(item)).not.toMatch(/approved|certified|معتمد|rating|reviewCount|educationalLevel/i);
  });

  it("omits nonpublished draft lessons", () => {
    expect(buildPublicLessonStructuredData({ ...fixture, status: "draft" })).toBeNull();
  });

  it("omits published records explicitly marked source-unready", () => {
    expect(buildPublicLessonStructuredData({
      ...fixture,
      instructions: [{ kind: "dadyoom_source", source_publication_ready: false }],
    })).toBeNull();
  });

  it("omits unidentified or untitled lessons instead of inventing data", () => {
    expect(buildPublicLessonStructuredData({ ...fixture, id: "not-a-uuid" })).toBeNull();
    expect(buildPublicLessonStructuredData({ ...fixture, title: " " })).toBeNull();
  });

  it("omits absent descriptions rather than adding fictional claims", () => {
    const result = buildPublicLessonStructuredData({ ...fixture, summary: null });
    expect(result).not.toHaveProperty("description");
  });

  it("does not contain progress, accreditation, course prices or review grades", () => {
    const result = buildPublicLessonStructuredData(fixture);
    expect(result).not.toHaveProperty("aggregateRating");
    expect(result).not.toHaveProperty("educationalAlignment");
    expect(result).not.toHaveProperty("dateModified");
    expect(result).not.toHaveProperty("isAccessibleForFree");
  });
});
