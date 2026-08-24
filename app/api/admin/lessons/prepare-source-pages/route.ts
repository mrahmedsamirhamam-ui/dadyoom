import {
  mkdir,
  readFile,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";

import path from "node:path";

import {
  NextResponse,
} from "next/server";

const BOOK_BASE =
  "https://www.edunet.bh/e_content/level_1/stage_1/subject_ID_1/Part_1/e_books/Arabic-Baraem-G1-P1-2026/Arabic%20Baraem%20G1%20P1%202026";

type RequestBody = {
  imageBaseUrl?: unknown;
  sourcePageStart?: unknown;
  sourcePageEnd?: unknown;
};

function isValidJpeg(
  bytes: Uint8Array
) {
  return (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  );
}

function normalizePage(
  value: unknown
) {
  const number =
    Number(value);

  if (
    !Number.isInteger(
      number
    ) ||
    number < 1 ||
    number > 500
  ) {
    return null;
  }

  return number;
}

export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as RequestBody;

    const imageBaseUrl =
      typeof body.imageBaseUrl ===
      "string"
        ? body.imageBaseUrl.trim()
        : "";

    /*
     * Only permit the known Bahrain Grade 1 lesson path.
     * This prevents arbitrary filesystem paths.
     */
    if (
      !/^\/curriculum\/bahrain\/grade-01\/lesson-\d{2}$/.test(
        imageBaseUrl
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "مسار صور الدرس غير صالح.",
        },
        {
          status: 400,
        }
      );
    }

    const sourcePageStart =
      normalizePage(
        body.sourcePageStart
      );

    const sourcePageEnd =
      normalizePage(
        body.sourcePageEnd
      );

    if (
      sourcePageStart ===
        null ||
      sourcePageEnd ===
        null ||
      sourcePageEnd <
        sourcePageStart
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "نطاق صفحات الدرس غير صالح.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      sourcePageEnd -
        sourcePageStart >
      40
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "عدد صفحات الدرس أكبر من الحد المسموح.",
        },
        {
          status: 400,
        }
      );
    }

    const relativeDirectory =
      imageBaseUrl.replace(
        /^\/+/,
        ""
      );

    const targetDirectory =
      path.join(
        process.cwd(),
        "public",
        relativeDirectory
      );

    await mkdir(
      targetDirectory,
      {
        recursive: true,
      }
    );

    const results: {
      page: number;
      status:
        | "existing"
        | "downloaded"
        | "failed";
      bytes: number;
      error?: string;
    }[] = [];

    for (
      let page =
        sourcePageStart;
      page <=
        sourcePageEnd;
      page++
    ) {
      const fileName =
        `page-${String(
          page
        ).padStart(
          3,
          "0"
        )}.jpg`;

      const filePath =
        path.join(
          targetDirectory,
          fileName
        );

      let existingOkay =
        false;

      try {
        const existing =
          await readFile(
            filePath
          );

        existingOkay =
          isValidJpeg(
            existing
          );

        if (
          existingOkay
        ) {
          const info =
            await stat(
              filePath
            );

          results.push({
            page,
            status:
              "existing",
            bytes:
              info.size,
          });

          continue;
        }

        await unlink(
          filePath
        ).catch(
          () => undefined
        );
      }
      catch {
        /*
         * Missing file is expected.
         * It will be downloaded below.
         */
      }

      const sourceUrl =
        `${BOOK_BASE}/files/page/${page}.jpg`;

      try {
        const response =
          await fetch(
            sourceUrl,
            {
              cache:
                "no-store",
            }
          );

        if (
          !response.ok
        ) {
          throw new Error(
            `HTTP ${response.status}`
          );
        }

        const bytes =
          new Uint8Array(
            await response.arrayBuffer()
          );

        if (
          !isValidJpeg(
            bytes
          )
        ) {
          throw new Error(
            "الملف المستلم ليس JPEG صالحًا."
          );
        }

        await writeFile(
          filePath,
          bytes
        );

        results.push({
          page,
          status:
            "downloaded",
          bytes:
            bytes.length,
        });
      }
      catch (
        error
      ) {
        results.push({
          page,
          status:
            "failed",
          bytes: 0,
          error:
            error instanceof
            Error
              ? error.message
              : "Unknown error",
        });
      }
    }

    const failed =
      results.filter(
        (item) =>
          item.status ===
          "failed"
      );

    const downloaded =
      results.filter(
        (item) =>
          item.status ===
          "downloaded"
      ).length;

    const existing =
      results.filter(
        (item) =>
          item.status ===
          "existing"
      ).length;

    if (
      failed.length >
      0
    ) {
      return NextResponse.json(
        {
          success: false,

          summary: {
            requested:
              results.length,
            existing,
            downloaded,
            failed:
              failed.length,
          },

          results,

          error:
            `تعذر تجهيز ${failed.length} صفحة من صفحات الدرس.`,
        },
        {
          status: 502,
        }
      );
    }

    return NextResponse.json({
      success: true,

      summary: {
        requested:
          results.length,
        existing,
        downloaded,
        failed: 0,
      },

      results,
    });
  }
  catch (
    error
  ) {
    console.error(
      "PREPARE_SOURCE_PAGES_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof
          Error
            ? error.message
            : "تعذر تجهيز صفحات الدرس.",
      },
      {
        status: 500,
      }
    );
  }
}
