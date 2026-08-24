export type ImageOptionRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ActivityImageOption = {
  index: number;
  label: string;
  image_url: string;
  region: ImageOptionRegion;
  confidence?: number;
};

type JsonObject =
  Record<string, unknown>;

function isObject(
  value: unknown
): value is JsonObject {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function cleanText(
  value: unknown
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function finiteNumber(
  value: unknown
): number | null {
  const number =
    typeof value === "number"
      ? value
      : typeof value === "string" &&
          value.trim()
        ? Number(value)
        : NaN;

  return Number.isFinite(number)
    ? number
    : null;
}

function clamp(
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

export function normalizeOptionRegion(
  value: unknown
): ImageOptionRegion | null {
  if (!isObject(value)) {
    return null;
  }

  let x =
    finiteNumber(
      value.x
    );

  let y =
    finiteNumber(
      value.y
    );

  let width =
    finiteNumber(
      value.width
    );

  let height =
    finiteNumber(
      value.height
    );

  if (
    x === null ||
    y === null ||
    width === null ||
    height === null
  ) {
    return null;
  }

  /*
   * Gemini Vision may return coordinates
   * normalized to 0..1000.
   *
   * Dadyoom stores page regions as 0..100.
   */
  const maximum =
    Math.max(
      x,
      y,
      width,
      height
    );

  if (
    maximum > 100 &&
    maximum <= 1000
  ) {
    x /= 10;
    y /= 10;
    width /= 10;
    height /= 10;
  }

  if (
    x < 0 ||
    y < 0 ||
    width <= 0 ||
    height <= 0 ||
    x > 100 ||
    y > 100
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

export function getRequiredImageLabels(
  activityType: unknown,
  contentValue: unknown
): string[] {
  if (!isObject(contentValue)) {
    return [];
  }

  const content =
    contentValue;

  /*
   * IMPORTANT:
   * Keep duplicates.
   *
   * The stable identity of an image is its
   * requested position/index, not its label.
   */
  if (
    Array.isArray(
      content.imageLabels
    )
  ) {
    const labels =
      content.imageLabels
        .map(cleanText)
        .filter(Boolean);

    if (
      labels.length > 0
    ) {
      return labels;
    }
  }

  if (
    activityType ===
      "matching" &&
    Array.isArray(
      content.right
    )
  ) {
    const labels =
      content.right
        .map(cleanText)
        .filter(
          (value) =>
            value.startsWith(
              "صورة"
            ) ||
            value.startsWith(
              "الصورة"
            )
        );

    if (
      labels.length > 0
    ) {
      return labels;
    }
  }

  return [];
}

export function normalizeImageOptions(
  rawValue: unknown,
  requestedLabels: string[],
  imageUrl: string
): {
  options: ActivityImageOption[];
  missing: string[];
  complete: boolean;
} {
  const rawOptions =
    isObject(rawValue) &&
    Array.isArray(
      rawValue.options
    )
      ? rawValue.options
      : [];

  /*
   * Stable identity is the 1-based requested
   * image index.
   */
  const byIndex =
    new Map<
      number,
      ActivityImageOption
    >();

  for (
    const rawOption of
      rawOptions
  ) {
    if (
      !isObject(
        rawOption
      )
    ) {
      continue;
    }

    const rawIndex =
      finiteNumber(
        rawOption.index
      );

    let stableIndex =
      rawIndex !== null
        ? Math.round(
            rawIndex
          )
        : -1;

    /*
     * Legacy compatibility:
     * Older Gemini responses used exact labels.
     * Assign the first still-unoccupied matching
     * requested position.
     */
    if (
      stableIndex < 1 ||
      stableIndex >
        requestedLabels.length
    ) {
      const returnedLabel =
        cleanText(
          rawOption.label
        );

      if (
        returnedLabel
      ) {
        const found =
          requestedLabels
            .findIndex(
              (
                label,
                position
              ) =>
                label ===
                  returnedLabel &&
                !byIndex.has(
                  position + 1
                )
            );

        stableIndex =
          found >= 0
            ? found + 1
            : -1;
      }
    }

    if (
      stableIndex < 1 ||
      stableIndex >
        requestedLabels.length
    ) {
      continue;
    }

    const label =
      requestedLabels[
        stableIndex - 1
      ];

    const region =
      normalizeOptionRegion(
        rawOption
      );

    if (!region) {
      continue;
    }

    const confidenceValue =
      finiteNumber(
        rawOption.confidence
      );

    const option:
      ActivityImageOption = {
        index:
          stableIndex,

        label,

        image_url:
          imageUrl,

        region,
      };

    if (
      confidenceValue !==
        null
    ) {
      option.confidence =
        Math.round(
          clamp(
            confidenceValue
          )
        );
    }

    const existing =
      byIndex.get(
        stableIndex
      );

    if (
      !existing ||
      (
        option.confidence ??
        0
      ) >
      (
        existing.confidence ??
        0
      )
    ) {
      byIndex.set(
        stableIndex,
        option
      );
    }
  }

  const options =
    requestedLabels
      .map(
        (
          _label,
          position
        ) =>
          byIndex.get(
            position + 1
          )
      )
      .filter(
        (
          item
        ): item is
          ActivityImageOption =>
          Boolean(item)
      );

  const missing =
    requestedLabels
      .map(
        (
          label,
          position
        ) => ({
          label,
          index:
            position + 1,
        })
      )
      .filter(
        (item) =>
          !byIndex.has(
            item.index
          )
      )
      .map(
        (item) =>
          item.label
      );

  return {
    options,

    missing,

    complete:
      requestedLabels.length >
        0 &&
      byIndex.size ===
        requestedLabels.length &&
      missing.length === 0,
  };
}

export function imageOptionsCoverLabels(
  contentValue: unknown,
  labels: string[]
): boolean {
  if (
    !isObject(
      contentValue
    ) ||
    !Array.isArray(
      contentValue
        .image_options
    ) ||
    labels.length === 0
  ) {
    return false;
  }

  const rawOptions =
    contentValue
      .image_options
      .filter(isObject);

  /*
   * New contract:
   * index determines coverage.
   */
  const indexed =
    new Set<number>();

  for (
    const item of
      rawOptions
  ) {
    const rawIndex =
      finiteNumber(
        item.index
      );

    const region =
      normalizeOptionRegion(
        item.region
      );

    if (
      rawIndex === null ||
      !cleanText(
        item.image_url
      ) ||
      !region
    ) {
      continue;
    }

    const index =
      Math.round(
        rawIndex
      );

    if (
      index >= 1 &&
      index <=
        labels.length
    ) {
      indexed.add(
        index
      );
    }
  }

  if (
    indexed.size > 0
  ) {
    return labels.every(
      (
        _label,
        position
      ) =>
        indexed.has(
          position + 1
        )
    );
  }

  /*
   * Legacy stored data:
   * exact labels only.
   */
  const availableLabels =
    new Set(
      rawOptions
        .filter(
          (item) =>
            cleanText(
              item.image_url
            ) &&
            normalizeOptionRegion(
              item.region
            )
        )
        .map(
          (item) =>
            cleanText(
              item.label
            )
        )
        .filter(Boolean)
    );

  return labels.every(
    (label) =>
      availableLabels.has(
        label
      )
  );
}
