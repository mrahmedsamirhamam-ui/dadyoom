import {
  describe,
  expect,
  it,
} from "vitest";

import {
  getCorrectAnswerSpec,
} from "@/lib/lesson-activities/grading";

describe(
  "lesson activity grading contract",
  () => {
    it(
      "supports a single correct answer",
      () => {
        expect(
          getCorrectAnswerSpec({
            correct:
              "الأسرة",
          })
        ).toEqual({
          mode:
            "unordered",

          values: [
            "الأسرة",
          ],
        });
      }
    );

    it(
      "supports correct_values for multi-select activities",
      () => {
        expect(
          getCorrectAnswerSpec({
            correct_values: [
              "باب",
              "بيت",
              "طبيب",
            ],
          })
        ).toEqual({
          mode:
            "unordered",

          values: [
            "باب",
            "بيت",
            "طبيب",
          ],
        });
      }
    );

    it(
      "supports ordered fill-blank answers",
      () => {
        expect(
          getCorrectAnswerSpec({
            answers: [
              "هذا",
              "هذه",
            ],
          })
        ).toEqual({
          mode:
            "ordered",

          values: [
            "هذا",
            "هذه",
          ],
        });
      }
    );

    it(
      "supports current object matching pairs",
      () => {
        expect(
          getCorrectAnswerSpec({
            pairs: [
              {
                left:
                  "قطعة",
                right:
                  "جبن",
              },
              {
                left:
                  "علبة",
                right:
                  "حليب",
              },
            ],
          })
        ).toEqual({
          mode:
            "matching",

          values: [
            "قطعة|||جبن",
            "علبة|||حليب",
          ],
        });
      }
    );

    it(
      "still supports legacy array matching pairs",
      () => {
        expect(
          getCorrectAnswerSpec({
            pairs: [
              [
                "A",
                "1",
              ],
              [
                "B",
                "2",
              ],
            ],
          })
        ).toEqual({
          mode:
            "matching",

          values: [
            "A|||1",
            "B|||2",
          ],
        });
      }
    );

    it(
      "returns null for completion-only activities",
      () => {
        expect(
          getCorrectAnswerSpec({})
        ).toBeNull();
      }
    );
  }
);
