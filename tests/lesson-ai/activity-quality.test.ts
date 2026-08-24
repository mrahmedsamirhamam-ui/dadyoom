import {
  describe,
  expect,
  it,
} from "vitest";

import {
  normalizeActivity,
} from "@/lib/lesson-ai/activity-normalizer";

import {
  validateActivity,
} from "@/lib/lesson-ai/activity-validator";

describe(
  "lesson activity quality engine",
  () => {
    it(
      "normalizes shared multiple-choice answers into item options",
      () => {
        const result =
          normalizeActivity({
            activity_type:
              "multiple_choice",

            content: {
              items: [
                {
                  prompt:
                    "book",

                  sentence:
                    "this book",
                },
                {
                  prompt:
                    "bag",

                  sentence:
                    "that bag",
                },
              ],
            },

            answer: {
              answers: [
                "this",
                "that",
              ],
            },
          });

        expect(
          result.changed
        ).toBe(true);

        const items =
          result.content
            .items as Array<{
              options?: string[];
            }>;

        expect(
          items
        ).toHaveLength(2);

        expect(
          items[0].options
        ).toEqual([
          "this",
          "that",
        ]);

        expect(
          items[1].options
        ).toEqual([
          "this",
          "that",
        ]);
      }
    );

    it(
      "normalizes correct-word activities from sentence tokens",
      () => {
        const result =
          normalizeActivity({
            activity_type:
              "multiple_choice",

            content: {
              items: [
                {
                  prompt:
                    "large",

                  sentence:
                    "my room is large",
                },
              ],
            },

            answer: {
              correct_words: [
                "large",
              ],
            },
          });

        expect(
          result.changed
        ).toBe(true);

        const items =
          result.content
            .items as Array<{
              options?: string[];
              correctWord?: string;
            }>;

        expect(
          items[0].options
        ).toContain(
          "large"
        );

        expect(
          items[0]
            .correctWord
        ).toBe(
          "large"
        );
      }
    );

    it(
      "accepts a complete matching activity",
      () => {
        const result =
          validateActivity({
            title:
              "Matching",

            activity_type:
              "matching",

            content: {
              left: [
                "A",
                "B",
              ],

              right: [
                "1",
                "2",
              ],
            },

            answer: {
              pairs: [
                {
                  left: "A",
                  right: "1",
                },
                {
                  left: "B",
                  right: "2",
                },
              ],
            },
          });

        expect(
          result.validForPublish
        ).toBe(true);

        expect(
          result.score
        ).toBe(100);
      }
    );

    it(
      "blocks matching activities that only contain image descriptions",
      () => {
        const result =
          validateActivity({
            title:
              "Image matching",

            activity_type:
              "matching",

            content: {
              left: [
                "Sentence",
              ],

              right: [
                "صورة ولد",
              ],
            },

            answer: {
              pairs: [
                {
                  left:
                    "Sentence",

                  right:
                    "صورة ولد",
                },
              ],
            },
          });

        expect(
          result.validForPublish
        ).toBe(false);

        expect(
          result.issues.some(
            (issue) =>
              issue.code ===
              "IMAGE_PLACEHOLDER_ONLY"
          )
        ).toBe(true);
      }
    );

    it(
      "blocks empty fill-blank activities",
      () => {
        const result =
          validateActivity({
            title:
              "Fill blank",

            activity_type:
              "fill_blank",

            content: {},

            answer: {},
          });

        expect(
          result.validForPublish
        ).toBe(false);

        expect(
          result.issues.some(
            (issue) =>
              issue.level ===
              "error"
          )
        ).toBe(true);
      }
    );
    it(
      "accepts matching image descriptions when real indexed assets cover them",
      () => {
        const result =
          validateActivity({
            title:
              "Image matching with assets",

            activity_type:
              "matching",

            content: {
              left: [
                "Sentence A",
                "Sentence B",
              ],

              right: [
                "???? ???",
                "???? ???",
              ],

              image_options: [
                {
                  index: 1,
                  label:
                    "???? ???",
                  image_url:
                    "/page.jpg",
                  region: {
                    x: 10,
                    y: 10,
                    width: 20,
                    height: 20,
                  },
                },
                {
                  index: 2,
                  label:
                    "???? ???",
                  image_url:
                    "/page.jpg",
                  region: {
                    x: 40,
                    y: 10,
                    width: 20,
                    height: 20,
                  },
                },
              ],
            },

            answer: {
              pairs: [
                {
                  left:
                    "Sentence A",
                  right:
                    "???? ???",
                },
                {
                  left:
                    "Sentence B",
                  right:
                    "???? ???",
                },
              ],
            },
          });

        expect(
          result.issues.some(
            (issue) =>
              issue.code ===
              "IMAGE_PLACEHOLDER_ONLY"
          )
        ).toBe(false);

        expect(
          result.validForPublish
        ).toBe(true);
      }
    );

    it(
      "accepts multiple-choice image labels when real indexed assets cover them",
      () => {
        const result =
          validateActivity({
            title:
              "Image multiple choice with assets",

            activity_type:
              "multiple_choice",

            content: {
              imageLabels: [
                "???",
                "???",
              ],

              image_options: [
                {
                  index: 1,
                  label:
                    "???",
                  image_url:
                    "/page.jpg",
                  region: {
                    x: 10,
                    y: 10,
                    width: 20,
                    height: 20,
                  },
                },
                {
                  index: 2,
                  label:
                    "???",
                  image_url:
                    "/page.jpg",
                  region: {
                    x: 40,
                    y: 10,
                    width: 20,
                    height: 20,
                  },
                },
              ],
            },

            answer: {
              correct_values: [
                "???",
              ],
            },
          });

        expect(
          result.issues.some(
            (issue) =>
              issue.code ===
              "IMAGE_OPTIONS_NEED_ASSETS"
          )
        ).toBe(false);

        expect(
          result.validForPublish
        ).toBe(true);
      }
    );


  }
);
