import fs from "node:fs";
import path from "node:path";

const file =
  path.resolve(
    process.cwd(),
    "data/teacher-academy/catalog.json"
  );

if (!fs.existsSync(file)) {
  throw new Error(
    "TEACHER_ACADEMY_CATALOG_MISSING"
  );
}

const catalog =
  JSON.parse(
    fs.readFileSync(
      file,
      "utf8"
    )
  );

if (
  !Array.isArray(
    catalog.items
  )
) {
  throw new Error(
    "TEACHER_ACADEMY_ITEMS_NOT_ARRAY"
  );
}

if (
  catalog.items.length <
  500
) {
  throw new Error(
    `TEACHER_ACADEMY_BELOW_500:${catalog.items.length}`
  );
}

const ids =
  catalog.items.map(
    (item) =>
      item.id
  );

if (
  new Set(ids).size !==
  ids.length
) {
  throw new Error(
    "TEACHER_ACADEMY_DUPLICATE_VIDEO_IDS"
  );
}

const tracks =
  new Set(
    catalog.items.map(
      (item) =>
        item.trackSlug
    )
  );

if (tracks.size < 25) {
  throw new Error(
    `TEACHER_ACADEMY_TRACKS_BELOW_25:${tracks.size}`
  );
}

for (const item of catalog.items) {
  if (
    !item.title ||
    !item.channel ||
    !item.url ||
    !item.embedUrl ||
    !item.outcome ||
    !item.practice
  ) {
    throw new Error(
      `TEACHER_ACADEMY_BAD_ITEM:${item.id}`
    );
  }

  if (
    !item.embedUrl.includes(
      "youtube-nocookie.com/embed/"
    )
  ) {
    throw new Error(
      `TEACHER_ACADEMY_BAD_EMBED:${item.id}`
    );
  }
}

const arabicTitleCount =
  catalog.items.filter(
    (item) =>
      /[\u0600-\u06FF]/.test(
        item.title
      )
  ).length;

if (
  arabicTitleCount <
  450
) {
  throw new Error(
    `TEACHER_ACADEMY_ARABIC_TITLES_TOO_LOW:${arabicTitleCount}`
  );
}

console.log(
  `TEACHER_ACADEMY_TOTAL=${catalog.items.length}`
);
console.log(
  `TEACHER_ACADEMY_UNIQUE=${new Set(ids).size}`
);
console.log(
  `TEACHER_ACADEMY_TRACKS=${tracks.size}`
);
console.log(
  `TEACHER_ACADEMY_CHANNELS=${catalog.channelCount}`
);
console.log(
  `TEACHER_ACADEMY_ARABIC_TITLES=${arabicTitleCount}`
);
console.log(
  "TEACHER_ACADEMY_500_GATE=PASS"
);
