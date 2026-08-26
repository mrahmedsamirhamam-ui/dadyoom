import fs from "node:fs";
import path from "node:path";

const catalogPath =
  path.resolve(
    process.cwd(),
    "data/video-library/catalog.json"
  );

if (!fs.existsSync(catalogPath)) {
  throw new Error(
    "VIDEO_LIBRARY_CATALOG_MISSING"
  );
}

const catalog =
  JSON.parse(
    fs.readFileSync(
      catalogPath,
      "utf8"
    )
  );

if (
  !Array.isArray(
    catalog.videos
  )
) {
  throw new Error(
    "VIDEO_LIBRARY_VIDEOS_NOT_ARRAY"
  );
}

if (
  catalog.videos.length <
  500
) {
  throw new Error(
    `VIDEO_LIBRARY_BELOW_500:${catalog.videos.length}`
  );
}

const ids =
  catalog.videos.map(
    (video) =>
      video.id
  );

if (
  new Set(ids).size !==
  ids.length
) {
  throw new Error(
    "VIDEO_LIBRARY_DUPLICATE_IDS"
  );
}

for (const video of catalog.videos) {
  if (
    !video.id ||
    !video.title ||
    !video.url ||
    !video.embedUrl ||
    !video.sourceName
  ) {
    throw new Error(
      `VIDEO_LIBRARY_BAD_ITEM:${JSON.stringify(video)}`
    );
  }

  if (
    !video.embedUrl.includes(
      "youtube-nocookie.com/embed/"
    )
  ) {
    throw new Error(
      `VIDEO_LIBRARY_NON_PRIVACY_EMBED:${video.id}`
    );
  }
}

const sourceCount =
  new Set(
    catalog.videos.map(
      (video) =>
        video.sourceKey
    )
  ).size;

const categoryCount =
  new Set(
    catalog.videos.map(
      (video) =>
        video.category
    )
  ).size;

if (sourceCount < 4) {
  throw new Error(
    `VIDEO_LIBRARY_NOT_MIXED_ENOUGH_SOURCES:${sourceCount}`
  );
}

if (categoryCount < 5) {
  throw new Error(
    `VIDEO_LIBRARY_NOT_MIXED_ENOUGH_CATEGORIES:${categoryCount}`
  );
}

console.log(
  `VIDEO_LIBRARY_TOTAL=${catalog.videos.length}`
);
console.log(
  `VIDEO_LIBRARY_UNIQUE=${new Set(ids).size}`
);
console.log(
  `VIDEO_LIBRARY_SOURCES=${sourceCount}`
);
console.log(
  `VIDEO_LIBRARY_CATEGORIES=${categoryCount}`
);
console.log(
  "VIDEO_LIBRARY_500_GATE=PASS"
);
