import fs from "node:fs";
import path from "node:path";

import {
  validateCurriculumPack,
} from "../lib/curriculum-packs/validate.mjs";

const root = process.cwd();

const dir =
  path.resolve(
    root,
    "data/curriculum-packs"
  );

const registryPath =
  path.join(
    dir,
    "arab-countries.json"
  );

const registry =
  JSON.parse(
    fs.readFileSync(
      registryPath,
      "utf8"
    )
  );

const countries =
  Array.isArray(
    registry.countries
  )
    ? registry.countries
    : [];

if (countries.length !== 22) {
  throw new Error(
    `EXPECTED_22_ARAB_COUNTRIES_GOT_${countries.length}`
  );
}

const countryCodes =
  new Set(
    countries.map(
      (country) =>
        country.code
    )
  );

const registryFiles = new Set([
  "arab-countries.json",
  "official-sources-2026.json",
]);

const packFiles = fs
  .readdirSync(dir)
  .filter(
    (name) =>
      name.endsWith(".json") &&
      !registryFiles.has(name),
  )
  .sort();

const keys =
  new Set();

const coverage =
  new Map(
    countries.map(
      (country) => [
        country.code,
        {
          nameAr:
            country.nameAr,
          packs: 0, // publication-reviewed only
          lessons: 0,
          authoredPacks: 0,
          authoredLessons: 0,
        },
      ]
    )
  );

let totalAuthoredLessons = 0;
let totalReadyLessons = 0;
let authoredPackCount = 0;
let publicationReviewedPacks = 0;

for (const fileName of packFiles) {
  const fullPath =
    path.join(
      dir,
      fileName
    );

  const pack =
    JSON.parse(
      fs.readFileSync(
        fullPath,
        "utf8"
      )
    );

  const validation =
    validateCurriculumPack(
      pack
    );

  if (!validation.ok) {
    console.error(
      `INVALID_PACK=${fileName}`
    );

    for (const error of validation.errors) {
      console.error(
        `  ${error}`
      );
    }

    process.exitCode = 1;
    continue;
  }

  if (
    !countryCodes.has(
      pack.country.code
    )
  ) {
    console.error(
      `PACK_COUNTRY_NOT_IN_ARAB_REGISTRY=${fileName}:${pack.country.code}`
    );
    process.exitCode = 1;
    continue;
  }

  if (keys.has(pack.packKey)) {
    console.error(
      `DUPLICATE_PACK_KEY=${pack.packKey}`
    );
    process.exitCode = 1;
    continue;
  }

  keys.add(pack.packKey);

  const lessons =
    pack.units.flatMap(
      (unit) =>
        unit.lessons
    ).length;

  const item =
    coverage.get(
      pack.country.code
    );

  // Valid authored content is not equivalent to reviewed Ministry text,
  // textbook page mapping or approval to publish.
  item.authoredPacks += 1;
  item.authoredLessons += lessons;
  totalAuthoredLessons += lessons;
  authoredPackCount += 1;
  const reviewed = pack.rights?.officialTocVerified === true &&
    pack.rights?.publicationReview === "approved";
  if (reviewed) {
    item.packs += 1;
    item.lessons += lessons;
    totalReadyLessons += lessons;
    publicationReviewedPacks += 1;
  }
  console.log(
    `${reviewed ? "PACK_READY" : "PACK_AUTHORING_VALID_PENDING_REVIEW"}=${fileName} COUNTRY=${pack.country.code} LESSONS=${lessons}`
  );
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

let readyCountries = 0;

for (const country of countries) {
  const item =
    coverage.get(
      country.code
    );

  if (item.packs > 0) {
    readyCountries += 1;

    console.log(
      `COUNTRY_READY=${country.code} PACKS=${item.packs} LESSONS=${item.lessons}`
    );
  }
  else {
    if (item.authoredPacks > 0) {
      console.log(
        `COUNTRY_AUTHORING_PENDING_REVIEW=${country.code} PACKS=${item.authoredPacks} LESSONS=${item.authoredLessons}`
      );
    }
    console.log(
      `COUNTRY_SOURCE_REQUIRED=${country.code}`
    );
  }
}

console.log(
  `ARAB_COUNTRIES=${countries.length}`
);
console.log(
  `READY_COUNTRIES=${readyCountries}`
);
console.log(
  `SOURCE_REQUIRED_COUNTRIES=${countries.length - readyCountries}`
);
console.log(
  `PACK_FILES=${packFiles.length}`
);
console.log(`AUTHORED_PACKS=${authoredPackCount}`);
console.log(`PUBLICATION_REVIEWED_PACKS=${publicationReviewedPacks}`);
console.log(`TOTAL_AUTHORED_PACK_LESSONS=${totalAuthoredLessons}`);
console.log(`TOTAL_READY_PACK_LESSONS=${totalReadyLessons}`);
// Historical output retained for parsers; explicitly denotes authored content,
// NOT textbook approval or published student lessons.
console.log(`TOTAL_PACK_LESSONS=${totalAuthoredLessons}`);
const everyCountryHasPack = readyCountries === countries.length;

console.log(`CURRICULUM_PACK_COUNTRY_COVERAGE=${readyCountries}/${countries.length}`);
console.log("CURRICULUM_PACK_SCHEMA_GATE=PASS");
console.log(
  `CURRICULUM_COUNTRY_PACK_STATUS=${everyCountryHasPack ? "ALL_COUNTRIES_HAVE_PACKS" : "PARTIAL"}`
);
console.log("OFFICIAL_SYLLABUS_MATCH=NOT_VERIFIED");

if (process.argv.includes("--require-all-countries") && !everyCountryHasPack) {
  console.error(`REQUIRED_COUNTRY_PACKS_MISSING=${countries.length - readyCountries}`);
  process.exitCode = 1;
}
