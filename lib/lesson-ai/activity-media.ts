export type JsonObject =
  Record<string, unknown>;

export type ActivityImageRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ActivityMediaInput = {
  sourcePage?: unknown;
  imageUrl?: unknown;
  audioText?: unknown;

  region?: {
    x?: unknown;
    y?: unknown;
    width?: unknown;
    height?: unknown;
  } | null;
};

function isObject(
  value: unknown
): value is JsonObject {
  return Boolean(
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(value)
  );
}

function cleanText(
  value: unknown
): string {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

function finiteNumber(
  value: unknown
): number | null {
  const number =
    typeof value ===
      "number"
      ? value
      : typeof value ===
          "string" &&
          value.trim()
        ? Number(value)
        : NaN;

  return Number.isFinite(
    number
  )
    ? number
    : null;
}

function clampPercent(
  value: number
): number {
  return Math.max(
    0,
    Math.min(
      100,
      value
    )
  );
}

export function normalizeActivityImageRegion(
  value:
    ActivityMediaInput["region"]
): ActivityImageRegion | null {
  if (!value) {
    return null;
  }

  const rawX =
    finiteNumber(value.x);

  const rawY =
    finiteNumber(value.y);

  const rawWidth =
    finiteNumber(
      value.width
    );

  const rawHeight =
    finiteNumber(
      value.height
    );

  if (
    rawX === null ||
    rawY === null ||
    rawWidth === null ||
    rawHeight === null
  ) {
    return null;
  }

  const x =
    clampPercent(rawX);

  const y =
    clampPercent(rawY);

  let width =
    clampPercent(
      rawWidth
    );

  let height =
    clampPercent(
      rawHeight
    );

  if (
    width <= 0 ||
    height <= 0
  ) {
    return null;
  }

  width =
    Math.min(
      width,
      100 - x
    );

  height =
    Math.min(
      height,
      100 - y
    );

  if (
    width <= 0 ||
    height <= 0
  ) {
    return null;
  }

  return {
    x,
    y,
    width,
    height,
  };
}

export function mergeActivityMedia(
  value: unknown,
  media: ActivityMediaInput
): JsonObject {
  const content =
    isObject(value)
      ? {
          ...value,
        }
      : {};

  const sourcePage =
    finiteNumber(
      media.sourcePage
    );

  if (
    sourcePage !== null &&
    sourcePage > 0
  ) {
    content.source_page =
      Math.round(
        sourcePage
      );
  }

  const imageUrl =
    cleanText(
      media.imageUrl
    );

  if (
    imageUrl &&
    !cleanText(
      content.image_url
    )
  ) {
    content.image_url =
      imageUrl;
  }

  const audioText =
    cleanText(
      media.audioText
    );

  if (
    audioText &&
    !cleanText(
      content.audio_text
    )
  ) {
    content.audio_text =
      audioText;
  }

  const imageRegion =
    normalizeActivityImageRegion(
      media.region
    );

  if (
    imageRegion &&
    !isObject(
      content.image_region
    )
  ) {
    content.image_region =
      imageRegion;
  }

  return content;
}
