import {
  describe,
  expect,
  it,
} from "vitest";

import {
  getRequiredImageLabels,
  imageOptionsCoverLabels,
  normalizeImageOptions,
} from "@/lib/lesson-ai/image-options";

describe(
  "activity image options",
  () => {
    it(
      "reads image labels from multiple choice",
      () => {
        expect(
          getRequiredImageLabels(
            "multiple_choice",
            {
              imageLabels: [
                "باب",
                "بيت",
              ],
            }
          )
        ).toEqual([
          "باب",
          "بيت",
        ]);
      }
    );

    it(
      "keeps duplicate requested image labels",
      () => {
        expect(
          getRequiredImageLabels(
            "multiple_choice",
            {
              imageLabels: [
                "صورة",
                "صورة",
              ],
            }
          )
        ).toEqual([
          "صورة",
          "صورة",
        ]);
      }
    );

    it(
      "reads picture labels from matching right values",
      () => {
        expect(
          getRequiredImageLabels(
            "matching",
            {
              right: [
                "صورة ولد",
                "صورة بنت",
              ],
            }
          )
        ).toEqual([
          "صورة ولد",
          "صورة بنت",
        ]);
      }
    );

    it(
      "matches Gemini results by stable requested index",
      () => {
        const result =
          normalizeImageOptions(
            {
              options: [
                {
                  index: 1,
                  x: 10,
                  y: 20,
                  width: 20,
                  height: 20,
                  confidence: 95,
                },
                {
                  index: 2,
                  x: 40,
                  y: 20,
                  width: 25,
                  height: 20,
                  confidence: 92,
                },
              ],
            },
            [
              "FIRST",
              "SECOND",
            ],
            "/page.jpg"
          );

        expect(
          result.complete
        ).toBe(true);

        expect(
          result.options
            .map(
              (item) => ({
                index:
                  item.index,

                label:
                  item.label,
              })
            )
        ).toEqual([
          {
            index: 1,
            label: "FIRST",
          },
          {
            index: 2,
            label: "SECOND",
          },
        ]);
      }
    );

    it(
      "keeps duplicate labels as separate indexed images",
      () => {
        const result =
          normalizeImageOptions(
            {
              options: [
                {
                  index: 1,
                  x: 10,
                  y: 10,
                  width: 20,
                  height: 20,
                  confidence: 90,
                },
                {
                  index: 2,
                  x: 40,
                  y: 40,
                  width: 20,
                  height: 20,
                  confidence: 91,
                },
              ],
            },
            [
              "SAME_LABEL",
              "SAME_LABEL",
            ],
            "/page.jpg"
          );

        expect(
          result.complete
        ).toBe(true);

        expect(
          result.options
        ).toHaveLength(2);

        expect(
          result.options[0]
            .index
        ).toBe(1);

        expect(
          result.options[1]
            .index
        ).toBe(2);

        expect(
          result.options[0]
            .region
        ).not.toEqual(
          result.options[1]
            .region
        );
      }
    );

    it(
      "requires full index coverage before apply",
      () => {
        const result =
          normalizeImageOptions(
            {
              options: [
                {
                  index: 1,
                  x: 10,
                  y: 20,
                  width: 20,
                  height: 20,
                  confidence: 95,
                },
              ],
            },
            [
              "FIRST",
              "SECOND",
            ],
            "/book/page.jpg"
          );

        expect(
          result.complete
        ).toBe(false);

        expect(
          result.missing
        ).toEqual([
          "SECOND",
        ]);
      }
    );

    it(
      "creates page-backed cropped image options",
      () => {
        const result =
          normalizeImageOptions(
            {
              options: [
                {
                  index: 1,
                  x: 10,
                  y: 20,
                  width: 20,
                  height: 30,
                  confidence: 96,
                },
              ],
            },
            [
              "FIRST",
            ],
            "/book/page.jpg"
          );

        expect(
          result.options[0]
        ).toEqual({
          index: 1,
          label: "FIRST",
          image_url:
            "/book/page.jpg",
          region: {
            x: 10,
            y: 20,
            width: 20,
            height: 30,
          },
          confidence: 96,
        });
      }
    );

    it(
      "still accepts legacy exact labels",
      () => {
        const result =
          normalizeImageOptions(
            {
              options: [
                {
                  label:
                    "LEGACY",
                  x: 1,
                  y: 2,
                  width: 20,
                  height: 20,
                  confidence: 90,
                },
              ],
            },
            [
              "LEGACY",
            ],
            "/page.jpg"
          );

        expect(
          result.complete
        ).toBe(true);

        expect(
          result.options[0]
            .index
        ).toBe(1);
      }
    );

    it(
      "converts Gemini 0..1000 coordinates to percentages",
      () => {
        const result =
          normalizeImageOptions(
            {
              options: [
                {
                  index: 1,
                  x: 305,
                  y: 709,
                  width: 84,
                  height: 74,
                  confidence: 99,
                },
                {
                  index: 2,
                  x: 298,
                  y: 786,
                  width: 80,
                  height: 65,
                  confidence: 99,
                },
              ],
            },
            [
              "FIRST_IMAGE",
              "SECOND_IMAGE",
            ],
            "/page.jpg"
          );

        expect(
          result.options[0]
            .region
        ).toEqual({
          x: 30.5,
          y: 70.9,
          width: 8.4,
          height: 7.4,
        });

        expect(
          result.options[1]
            .region
        ).toEqual({
          x: 29.8,
          y: 78.6,
          width: 8,
          height: 6.5,
        });
      }
    );

    it(
      "detects complete stored indexed image assets",
      () => {
        expect(
          imageOptionsCoverLabels(
            {
              image_options: [
                {
                  index: 1,
                  label:
                    "SAME",
                  image_url:
                    "/page.jpg",
                  region: {
                    x: 1,
                    y: 2,
                    width: 20,
                    height: 20,
                  },
                },
                {
                  index: 2,
                  label:
                    "SAME",
                  image_url:
                    "/page.jpg",
                  region: {
                    x: 30,
                    y: 2,
                    width: 20,
                    height: 20,
                  },
                },
              ],
            },
            [
              "SAME",
              "SAME",
            ]
          )
        ).toBe(true);
      }
    );
  }
);
