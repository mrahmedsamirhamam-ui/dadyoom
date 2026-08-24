export type ActivityType =
  | "listening"
  | "speaking"
  | "reading"
  | "multiple_choice"
  | "matching"
  | "fill_blank"
  | "writing"
  | "other";

export type ActivityRegion = {
  title: string;
  activityType: ActivityType;
  section: string;
  instructions: string;

  x: number;
  y: number;
  width: number;
  height: number;

  audioText: string;

  content:
    Record<string, unknown>;

  answer:
    Record<string, unknown>;
};

export type MatchableActivity = {
  id?: string;
  activity_order?: number;
  title?: unknown;
  activity_type?: unknown;
  content?: unknown;
};

export function normalizeForMatch(
  value: string
): string {
  return value
    .replace(
      /[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g,
      ""
    )
    .replace(
      /[\u0623\u0625\u0622\u0671]/g,
      "\u0627"
    )
    .replace(
      /\u0649/g,
      "\u064A"
    )
    .replace(
      /\u0624/g,
      "\u0648"
    )
    .replace(
      /\u0626/g,
      "\u064A"
    )
    .replace(
      /[^\u0600-\u06FFa-zA-Z0-9\s]/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim()
    .toLowerCase();
}

function getWords(
  value: string
): Set<string> {
  return new Set(
    normalizeForMatch(
      value
    )
      .split(" ")
      .filter(
        (word) =>
          word.length >= 2
      )
  );
}

function wordSimilarity(
  left: string,
  right: string
): number {
  const a =
    getWords(left);

  const b =
    getWords(right);

  if (
    a.size === 0 ||
    b.size === 0
  ) {
    return 0;
  }

  const shared =
    [...a].filter(
      (word) =>
        b.has(word)
    ).length;

  return (
    shared /
    Math.max(
      a.size,
      b.size
    )
  );
}

function stringifyForMatch(
  value: unknown
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (
    typeof value ===
      "string" ||
    typeof value ===
      "number" ||
    typeof value ===
      "boolean"
  ) {
    return String(value);
  }

  if (
    Array.isArray(value)
  ) {
    return value
      .map(
        stringifyForMatch
      )
      .join(" ");
  }

  if (
    typeof value ===
      "object"
  ) {
    return Object.values(
      value as Record<
        string,
        unknown
      >
    )
      .map(
        stringifyForMatch
      )
      .join(" ");
  }

  return "";
}

function getActivityPages(
  content: unknown
): number[] {
  if (
    !content ||
    typeof content !==
      "object" ||
    Array.isArray(content)
  ) {
    return [];
  }

  const data =
    content as Record<
      string,
      unknown
    >;

  const pages:
    number[] = [];

  if (
    typeof data.source_page ===
      "number"
  ) {
    pages.push(
      data.source_page
    );
  }

  if (
    Array.isArray(
      data.source_pages
    )
  ) {
    for (
      const value of
        data.source_pages
    ) {
      if (
        typeof value ===
          "number"
      ) {
        pages.push(value);
      }
    }
  }

  return pages;
}

export function scoreActivityMatch(
  pageNumber: number,
  region: ActivityRegion,
  activity: MatchableActivity
): number {
  let score = 0;

  const rawActivityTitle =
    String(
      activity.title ??
      ""
    );

  const regionTitle =
    normalizeForMatch(
      region.title
    );

  const activityTitle =
    normalizeForMatch(
      rawActivityTitle
    );

  const titleSimilarity =
    wordSimilarity(
      region.title,
      rawActivityTitle
    );

  /*
   * 1) ???????.
   *
   * ??????? ????? ??? ?? ?????
   * ??? ??? ?????? ??? ??????.
   */
  if (
    regionTitle &&
    activityTitle &&
    regionTitle ===
      activityTitle
  ) {
    score += 60;
  }
  else if (
    regionTitle &&
    activityTitle &&
    (
      regionTitle.includes(
        activityTitle
      ) ||
      activityTitle.includes(
        regionTitle
      )
    )
  ) {
    score += 48;
  }
  else {
    score +=
      titleSimilarity *
      35;
  }

  /*
   * 2) ??? ??????.
   */
  const storedType =
    String(
      activity.activity_type ??
      ""
    );

  const sameType =
    storedType ===
    region.activityType;

  if (sameType) {
    score += 25;
  }
  else {
    score -= 30;
  }

  /*
   * 3) ??????.
   */
  const pages =
    getActivityPages(
      activity.content
    );

  const exactPage =
    pages.includes(
      pageNumber
    );

  if (exactPage) {
    score += 25;
  }
  else if (
    pages.length > 0
  ) {
    const nearestDistance =
      Math.min(
        ...pages.map(
          (page) =>
            Math.abs(
              page -
              pageNumber
            )
        )
      );

    if (
      nearestDistance === 1
    ) {
      score += 8;
    }
    else if (
      nearestDistance === 2
    ) {
      score += 4;
    }
  }

  /*
   * ??? ????? ??? ????? ?? ??? ???????
   * ???? ????? ???? ????.
   *
   * ????:
   * "??? ???" ?? ???? 27
   * ?? ???? matching ?? ???? 27.
   */
  if (
    sameType &&
    exactPage
  ) {
    score += 15;
  }

  /*
   * ?????? ?????? ????? ???? ??????
   * ?? ?????? ????? ??? ????? ????
   * ?????? ????????? ?? ??? ?????? ????.
   *
   * ????:
   * ??? ????? ??????
   * ??? ????? ?????? ????????
   */
  /*
   * 4) ????? ?????? ?????????
   * ???? ????? ????.
   */
  const regionMaterial =
    [
      region.title,
      region.instructions,
      region.audioText,
      stringifyForMatch(
        region.content
      ),
    ].join(" ");

  const activityMaterial =
    [
      rawActivityTitle,
      stringifyForMatch(
        activity.content
      ),
    ].join(" ");

  score +=
    wordSimilarity(
      regionMaterial,
      activityMaterial
    ) * 10;

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        score
      )
    )
  );
}
