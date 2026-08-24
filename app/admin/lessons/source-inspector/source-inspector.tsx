"use client";

import {
  useState,
} from "react";


type SourceInspection = {
  sourceUrl: string;
  sourceText: string;
  sourceCountry: string | null;
  characterCount: number;
};


type InspectResponse = {
  success?: boolean;
  sourceInspection?: SourceInspection;
  error?: string;
};


function createReviewSuggestion(
  sourceText: string
): string {
  let value =
    sourceText;


  /*
   * Structural label from page extraction.
   * Do not silently rewrite educational prose.
   */
  value =
    value
      .split(
        "\u0646\u0635 \u0627\u0644\u0641\u0647\u0645 \u0627\u0644\u0642\u0631\u0627\u0626\u064a"
      )
      .join(
        " "
      );


  /*
   * Isolated OCR garbage token seen in the source.
   */
  value =
    value.replace(
      /(^|\s)\u0646\u0633(?=\s|$)/g,
      " "
    );


  return value
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}


export default function SourceInspector() {
  const [
    sourceUrl,
    setSourceUrl,
  ] =
    useState("");


  const [
    inspection,
    setInspection,
  ] =
    useState<SourceInspection | null>(
      null
    );


  const [
    reviewText,
    setReviewText,
  ] =
    useState("");


  const [
    error,
    setError,
  ] =
    useState("");


  const [
    isInspecting,
    setIsInspecting,
  ] =
    useState(false);

  /*
   * PDF_SOURCE_REVIEW_CLIENT_V1
   */
  const [
    sourcePageStart,
    setSourcePageStart,
  ] =
    useState("");

  const [
    sourcePageEnd,
    setSourcePageEnd,
  ] =
    useState("");


  async function inspectSource() {
    setError("");
    setInspection(null);
    setReviewText("");


    const value =
      sourceUrl.trim();


    if (!value) {
      setError(
        "\u0623\u062f\u062e\u0644 \u0631\u0627\u0628\u0637 \u0627\u0644\u0645\u0635\u062f\u0631 \u0623\u0648\u0644\u064b\u0627."
      );

      return;
    }


    const pageStartText =
      sourcePageStart.trim();

    const pageEndText =
      sourcePageEnd.trim();

    const pageStart =
      pageStartText
        ? Number(pageStartText)
        : null;

    const pageEnd =
      pageEndText
        ? Number(pageEndText)
        : null;

    let isDirectPdfUrl =
      false;

    try {
      isDirectPdfUrl =
        new URL(value)
          .pathname
          .toLowerCase()
          .endsWith(".pdf");
    }
    catch {
      isDirectPdfUrl =
        /\.pdf(?:$|[?#])/i.test(
          value
        );
    }

    const hasAnyPage =
      Boolean(
        pageStartText ||
        pageEndText
      );

    if (
      (isDirectPdfUrl || hasAnyPage) &&
      (
        pageStart === null ||
        pageEnd === null ||
        !Number.isInteger(
          pageStart
        ) ||
        !Number.isInteger(
          pageEnd
        ) ||
        pageStart < 1 ||
        pageEnd < 1 ||
        pageStart > 500 ||
        pageEnd > 500
      )
    ) {
      setError(
        "\u0644\u0645\u0644\u0641 PDF \u0623\u062f\u062e\u0644 \u0631\u0642\u0645 \u0635\u0641\u062d\u0629 \u0628\u062f\u0627\u064a\u0629 \u0648\u0646\u0647\u0627\u064a\u0629 \u0635\u0627\u0644\u062d\u064a\u0646."
      );

      return;
    }

    if (
      pageStart !== null &&
      pageEnd !== null &&
      pageEnd < pageStart
    ) {
      setError(
        "\u0635\u0641\u062d\u0629 \u0646\u0647\u0627\u064a\u0629 PDF \u064a\u062c\u0628 \u0623\u0644\u0627 \u062a\u0633\u0628\u0642 \u0635\u0641\u062d\u0629 \u0627\u0644\u0628\u062f\u0627\u064a\u0629."
      );

      return;
    }

    if (
      pageStart !== null &&
      pageEnd !== null &&
      pageEnd - pageStart + 1 >
        12
    ) {
      setError(
        "\u0627\u0644\u062d\u062f \u0627\u0644\u0623\u0642\u0635\u0649 \u0644\u0641\u062d\u0635 \u0627\u0644\u062f\u0631\u0633 \u0647\u0648 12 \u0635\u0641\u062d\u0629 PDF."
      );

      return;
    }


    setIsInspecting(
      true
    );


    try {
      const response =
        await fetch(
          "/api/admin/lessons/generate",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                mode:
                  "inspect_source",

                sourceUrl:
                  value,

                sourcePageStart:
                  pageStart,

                sourcePageEnd:
                  pageEnd,
              }),
          }
        );


      const data =
        (
          await response.json()
        ) as InspectResponse;


      if (
        !response.ok ||
        !data.sourceInspection
      ) {
        throw new Error(
          data.error ||
            "\u062a\u0639\u0630\u0631 \u0641\u062d\u0635 \u0627\u0644\u0645\u0635\u062f\u0631."
        );
      }


      setInspection(
        data.sourceInspection
      );


      setReviewText(
        createReviewSuggestion(
          data.sourceInspection
            .sourceText
        )
      );
    }
    catch (caughtError) {
      setError(
        caughtError
          instanceof Error
          ? caughtError.message
          : "\u062d\u062f\u062b \u062e\u0637\u0623 \u0623\u062b\u0646\u0627\u0621 \u0641\u062d\u0635 \u0627\u0644\u0645\u0635\u062f\u0631."
      );
    }
    finally {
      setIsInspecting(
        false
      );
    }
  }


  function approveReview() {
    if (!inspection) {
      return;
    }


    const approvedText =
      reviewText.trim();


    const arabicCount =
      (
        approvedText.match(
          /[\u0600-\u06FF]/g
        ) ??
        []
      ).length;


    if (
      approvedText.length < 160 ||
      arabicCount < 80
    ) {
      setError(
        "\u0627\u0644\u0646\u0635 \u0627\u0644\u0645\u0631\u0627\u062c\u0639 \u0642\u0635\u064a\u0631 \u062c\u062f\u064b\u0627."
      );

      return;
    }


    window.sessionStorage.setItem(
      "dadyoom.sourceReview.v1",

      JSON.stringify({
        sourceUrl:
          inspection.sourceUrl,

        reviewedSourceText:
          approvedText,

        sourceCountry:
          inspection.sourceCountry,

        sourcePageStart:
          sourcePageStart.trim()
            ? Number(
                sourcePageStart
              )
            : null,

        sourcePageEnd:
          sourcePageEnd.trim()
            ? Number(
                sourcePageEnd
              )
            : null,

        approvedAt:
          new Date()
            .toISOString(),
      })
    );


    window.location.href =
      "/admin/lessons/new";
  }


  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-xl border p-5">
        <div className="space-y-2">
          <label
            htmlFor="source-inspector-url"
            className="font-medium"
          >
            {
              "\u0631\u0627\u0628\u0637 \u0627\u0644\u0645\u0635\u062f\u0631"
            }
          </label>

          <input
            id="source-inspector-url"
            type="url"
            value={sourceUrl}
            onChange={
              (event) => {
                setSourceUrl(
                  event.target.value
                );

                setInspection(null);
                setReviewText("");
                setError("");
              }
            }
            placeholder="https://..."
            className="w-full rounded-lg border bg-background px-3 py-3 text-sm outline-none focus:ring-2"
          />
        </div>


        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="source-page-start"
              className="font-medium"
            >
              {
                "\u0635\u0641\u062d\u0629 \u0627\u0644\u0628\u062f\u0627\u064a\u0629 \u2014 PDF \u0641\u0642\u0637"
              }
            </label>

            <input
              id="source-page-start"
              type="number"
              min={1}
              max={500}
              value={sourcePageStart}
              onChange={
                (event) => {
                  setSourcePageStart(
                    event.target.value
                  );

                  setInspection(null);
                  setReviewText("");
                  setError("");
                }
              }
              placeholder={
                "\u0645\u062b\u0627\u0644: 35"
              }
              className="w-full rounded-lg border bg-background px-3 py-3 text-sm outline-none focus:ring-2"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="source-page-end"
              className="font-medium"
            >
              {
                "\u0635\u0641\u062d\u0629 \u0627\u0644\u0646\u0647\u0627\u064a\u0629 \u2014 PDF \u0641\u0642\u0637"
              }
            </label>

            <input
              id="source-page-end"
              type="number"
              min={1}
              max={500}
              value={sourcePageEnd}
              onChange={
                (event) => {
                  setSourcePageEnd(
                    event.target.value
                  );

                  setInspection(null);
                  setReviewText("");
                  setError("");
                }
              }
              placeholder={
                "\u0645\u062b\u0627\u0644: 38"
              }
              className="w-full rounded-lg border bg-background px-3 py-3 text-sm outline-none focus:ring-2"
            />
          </div>
        </div>

        <p className="text-xs leading-6 text-muted-foreground">
          {
            "\u0644\u0635\u0641\u062d\u0627\u062a \u0627\u0644\u0648\u064a\u0628 \u0627\u062a\u0631\u0643 \u062d\u0642\u0644\u064a \u0627\u0644\u0635\u0641\u062d\u0627\u062a \u0641\u0627\u0631\u063a\u064a\u0646."
          }{" "}
          {
            "\u0639\u0646\u062f PDF \u064a\u0642\u0631\u0623 \u0636\u0627\u062f\u064a\u0648\u0645 \u0627\u0644\u0635\u0641\u062d\u0627\u062a \u0627\u0644\u0645\u062d\u062f\u062f\u0629 \u0628\u0635\u0631\u064a\u064b\u0627 \u0628\u0648\u0627\u0633\u0637\u0629 Gemini"
          }{" "}
          {
            "\u0644\u0627\u0633\u062a\u062e\u0631\u0627\u062c \u0627\u0644\u0646\u0635 \u0644\u0644\u0645\u0631\u0627\u062c\u0639\u0629 \u0641\u0642\u0637\u060c \u062f\u0648\u0646 \u0625\u0646\u0634\u0627\u0621 \u062f\u0631\u0633 \u0623\u0648 \u0643\u062a\u0627\u0628\u0629 \u0641\u064a \u0642\u0627\u0639\u062f\u0629 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a."
          }
        </p>


        <button
          type="button"
          onClick={inspectSource}
          disabled={isInspecting}
          className="rounded-lg border px-5 py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {
            isInspecting
              ? "\u062c\u0627\u0631\u064a \u0627\u0644\u0641\u062d\u0635..."
              : "\u0641\u062d\u0635 \u0646\u0635 \u0627\u0644\u0645\u0635\u062f\u0631"
          }
        </button>


        {error ? (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
          >
            {error}
          </div>
        ) : null}
      </section>


      {inspection ? (
        <>
          <section className="space-y-4 rounded-xl border p-5">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold">
                {
                  "\u0627\u0644\u0646\u0635 \u0627\u0644\u0645\u0633\u062a\u062e\u0631\u062c \u0645\u0646 \u0627\u0644\u0645\u0635\u062f\u0631"
                }
              </h2>

              <span className="rounded-full border px-3 py-1 text-xs">
                {
                  inspection.characterCount
                }{" "}
                {
                  "\u062d\u0631\u0641"
                }
              </span>

              {inspection.sourceCountry ? (
                <span className="rounded-full border px-3 py-1 text-xs">
                  {
                    inspection.sourceCountry
                  }
                </span>
              ) : null}
            </div>


            <div className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-xl border bg-muted/30 p-5 text-sm leading-8">
              {
                inspection.sourceText
              }
            </div>
          </section>


          <section className="space-y-4 rounded-xl border p-5">
            <div>
              <h2 className="text-xl font-bold">
                {
                  "\u0627\u0644\u0646\u0635 \u0627\u0644\u0645\u0631\u0627\u062c\u0639 \u0627\u0644\u0630\u064a \u0633\u064a\u0633\u062a\u062e\u062f\u0645\u0647 \u0636\u0627\u062f\u064a\u0648\u0645"
                }
              </h2>

              <p className="mt-2 text-sm leading-7 text-amber-700">
                {
                  "\u0631\u0627\u062c\u0639 \u0627\u0644\u0646\u0635 \u0648\u0635\u062d\u062d \u0623\u062e\u0637\u0627\u0621 OCR \u0641\u0642\u0637. \u0644\u0627 \u062a\u0639\u062f \u0635\u064a\u0627\u063a\u0629 \u0646\u0635 \u0627\u0644\u0643\u062a\u0627\u0628."
                }
              </p>
            </div>


            <textarea
              value={reviewText}
              onChange={
                (event) =>
                  setReviewText(
                    event.target.value
                  )
              }
              rows={22}
              className="w-full rounded-xl border bg-background p-5 text-sm leading-8 outline-none focus:ring-2"
            />


            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border px-3 py-1 text-xs">
                {
                  reviewText.length
                }{" "}
                {
                  "\u062d\u0631\u0641"
                }
              </span>


              <button
                type="button"
                onClick={
                  () =>
                    setReviewText(
                      createReviewSuggestion(
                        inspection.sourceText
                      )
                    )
                }
                className="rounded-lg border px-4 py-2 text-sm"
              >
                {
                  "\u0627\u0633\u062a\u0639\u0627\u062f\u0629 \u0627\u0644\u0646\u0635 \u0627\u0644\u0645\u0642\u062a\u0631\u062d"
                }
              </button>


              <button
                type="button"
                onClick={approveReview}
                className="rounded-lg border px-5 py-2 text-sm font-bold"
              >
                {
                  "\u0627\u0639\u062a\u0645\u0627\u062f \u0627\u0644\u0646\u0635 \u0648\u0627\u0644\u0627\u0646\u062a\u0642\u0627\u0644 \u0644\u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062f\u0631\u0633"
                }
              </button>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
