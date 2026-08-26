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

const packFiles =
  fs.readdirSync(dir)
    .filter(
      (name) =>
        name.endsWith(".json") &&
        name !== "arab-countries.json"
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
          packs: 0,
          lessons: 0,
        },
      ]
    )
  );

let totalLessons = 0;

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

  item.packs += 1;
  item.lessons += lessons;

  totalLessons += lessons;

  console.log(
    `PACK_READY=${fileName} COUNTRY=${pack.country.code} LESSONS=${lessons}`
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
console.log(
  `TOTAL_PACK_LESSONS=${totalLessons}`
);
console.log(
  "CURRICULUM_COVERAGE_GATE=PASS"
);
