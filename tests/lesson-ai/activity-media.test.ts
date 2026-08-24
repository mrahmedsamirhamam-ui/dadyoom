import {
  describe,
  expect,
  it,
} from "vitest";

import {
  mergeActivityMedia,
  normalizeActivityImageRegion,
} from "@/lib/lesson-ai/activity-media";

describe(
  "lesson activity media contract",
  () => {
    it(
      "adds source page, image, region and audio text",
      () => {
        const content =
          mergeActivityMedia(
            {
              words: [
                "باء",
              ],
            },
            {
              sourcePage:
                31,

              imageUrl:
                "/book/page-031.jpg",

              audioText:
                "اقرأ الكلمات.",

              region: {
                x: 10,
                y: 20,
                width: 40,
                height: 30,
              },
            }
          );

        expect(
          content.source_page
        ).toBe(31);

        expect(
          content.image_url
        ).toBe(
          "/book/page-031.jpg"
        );

        expect(
          content.audio_text
        ).toBe(
          "اقرأ الكلمات."
        );

        expect(
          content.image_region
        ).toEqual({
          x: 10,
          y: 20,
          width: 40,
          height: 30,
        });

        expect(
          content.words
        ).toEqual([
          "باء",
        ]);
      }
    );

    it(
      "does not overwrite existing explicit media",
      () => {
        const content =
          mergeActivityMedia(
            {
              image_url:
                "/custom.jpg",

              audio_text:
                "صوت مخصص",

              image_region: {
                x: 1,
                y: 2,
                width: 3,
                height: 4,
              },
            },
            {
              sourcePage:
                5,

              imageUrl:
                "/generated.jpg",

              audioText:
                "صوت مولد",

              region: {
                x: 20,
                y: 20,
                width: 20,
                height: 20,
              },
            }
          );

        expect(
          content.image_url
        ).toBe(
          "/custom.jpg"
        );

        expect(
          content.audio_text
        ).toBe(
          "صوت مخصص"
        );

        expect(
          content.image_region
        ).toEqual({
          x: 1,
          y: 2,
          width: 3,
          height: 4,
        });
      }
    );

    it(
      "keeps regions inside page bounds",
      () => {
        expect(
          normalizeActivityImageRegion({
            x: 90,
            y: 80,
            width: 50,
            height: 40,
          })
        ).toEqual({
          x: 90,
          y: 80,
          width: 10,
          height: 20,
        });
      }
    );

    it(
      "rejects invalid image regions",
      () => {
        expect(
          normalizeActivityImageRegion({
            x: 10,
            y: 10,
            width: 0,
            height: 20,
          })
        ).toBeNull();

        expect(
          normalizeActivityImageRegion({
            x: "bad",
            y: 10,
            width: 20,
            height: 20,
          })
        ).toBeNull();
      }
    );
  }
);
