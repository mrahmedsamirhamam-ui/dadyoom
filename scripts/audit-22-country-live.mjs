import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL;

const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY;

if (!url || !serviceKey) {
  throw new Error(
    "Missing Supabase URL/service key in .env.local"
  );
}

const supabase = createClient(
  url,
  serviceKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

async function fetchAll(
  table,
  columns,
  configure
) {
  const rows = [];
  const size = 1000;
  let from = 0;

  while (true) {
    let query = supabase
      .from(table)
      .select(columns)
      .range(
        from,
        from + size - 1
      );

    if (configure) {
      query = configure(query);
    }

    const {
      data,
      error,
    } = await query;

    if (error) {
      throw new Error(
        `${table}: ${error.message}`
      );
    }

    const batch = data ?? [];
    rows.push(...batch);

    if (batch.length < size) {
      break;
    }

    from += size;
  }

  return rows;
}

const [
  countries,
  curricula,
  grades,
  units,
  lessons,
  questions,
  vocabulary,
] = await Promise.all([
  fetchAll(
    "countries",
    "id,code,name_ar,name_en,is_active",
    (query) =>
      query.eq(
        "is_active",
        true
      )
  ),
  fetchAll(
    "curricula",
    "id,country_id,name_ar,academic_year,is_active",
    (query) =>
      query.eq(
        "is_active",
        true
      )
  ),
  fetchAll(
    "grades",
    "id,curriculum_id,grade_number,name_ar,is_active",
    (query) =>
      query.eq(
        "is_active",
        true
      )
  ),
  fetchAll(
    "units",
    "id,grade_id,title"
  ),
  fetchAll(
    "lessons",
    "id,unit_id,status"
  ),
  fetchAll(
    "questions",
    "id,lesson_id"
  ),
  fetchAll(
    "lesson_vocabulary",
    "id,lesson_id"
  ),
]);

if (countries.length !== 22) {
  throw new Error(
    `ARAB_COUNTRY_REGISTRY_LIVE_EXPECTED_22_GOT_${countries.length}`
  );
}

const countryById =
  new Map(
    countries.map(
      (row) => [
        row.id,
        row,
      ]
    )
  );

const curriculumById =
  new Map(
    curricula.map(
      (row) => [
        row.id,
        row,
      ]
    )
  );

const gradeById =
  new Map(
    grades.map(
      (row) => [
        row.id,
        row,
      ]
    )
  );

const unitById =
  new Map(
    units.map(
      (row) => [
        row.id,
        row,
      ]
    )
  );

const lessonById =
  new Map(
    lessons.map(
      (row) => [
        row.id,
        row,
      ]
    )
  );

const stats =
  new Map(
    countries.map(
      (country) => [
        country.code,
        {
          code:
            country.code,
          nameAr:
            country.name_ar,
          curricula:
            new Set(),
          grades:
            new Set(),
          units:
            new Set(),
          lessons:
            new Set(),
          questions:
            0,
          vocabulary:
            0,
        },
      ]
    )
  );

for (const curriculum of curricula) {
  const country =
    countryById.get(
      curriculum.country_id
    );

  if (!country) {
    continue;
  }

  stats
    .get(country.code)
    ?.curricula.add(
      curriculum.id
    );
}

for (const grade of grades) {
  const curriculum =
    curriculumById.get(
      grade.curriculum_id
    );

  const country =
    curriculum
      ? countryById.get(
          curriculum.country_id
        )
      : null;

  if (!country) {
    continue;
  }

  stats
    .get(country.code)
    ?.grades.add(
      grade.id
    );
}

for (const unit of units) {
  const grade =
    gradeById.get(
      unit.grade_id
    );

  const curriculum =
    grade
      ? curriculumById.get(
          grade.curriculum_id
        )
      : null;

  const country =
    curriculum
      ? countryById.get(
          curriculum.country_id
        )
      : null;

  if (!country) {
    continue;
  }

  stats
    .get(country.code)
    ?.units.add(
      unit.id
    );
}

for (const lesson of lessons) {
  if (
    lesson.status !==
    "published"
  ) {
    continue;
  }

  const unit =
    unitById.get(
      lesson.unit_id
    );

  const grade =
    unit
      ? gradeById.get(
          unit.grade_id
        )
      : null;

  const curriculum =
    grade
      ? curriculumById.get(
          grade.curriculum_id
        )
      : null;

  const country =
    curriculum
      ? countryById.get(
          curriculum.country_id
        )
      : null;

  if (!country) {
    continue;
  }

  stats
    .get(country.code)
    ?.lessons.add(
      lesson.id
    );
}

function countryForLesson(
  lessonId
) {
  const lesson =
    lessonById.get(
      lessonId
    );

  const unit =
    lesson
      ? unitById.get(
          lesson.unit_id
        )
      : null;

  const grade =
    unit
      ? gradeById.get(
          unit.grade_id
        )
      : null;

  const curriculum =
    grade
      ? curriculumById.get(
          grade.curriculum_id
        )
      : null;

  return curriculum
    ? countryById.get(
        curriculum.country_id
      )
    : null;
}

for (const row of questions) {
  const country =
    countryForLesson(
      row.lesson_id
    );

  if (country) {
    stats.get(
      country.code
    ).questions += 1;
  }
}

for (const row of vocabulary) {
  const country =
    countryForLesson(
      row.lesson_id
    );

  if (country) {
    stats.get(
      country.code
    ).vocabulary += 1;
  }
}

const coverage =
  [...stats.values()]
    .map(
      (item) => ({
        code:
          item.code,
        nameAr:
          item.nameAr,
        curricula:
          item.curricula.size,
        grades:
          item.grades.size,
        units:
          item.units.size,
        publishedLessons:
          item.lessons.size,
        questions:
          item.questions,
        vocabulary:
          item.vocabulary,
        hasLiveContent:
          item.lessons.size > 0,
      })
    )
    .sort(
      (a, b) =>
        a.code.localeCompare(
          b.code
        )
    );

const ready =
  coverage.filter(
    (item) =>
      item.hasLiveContent
  );

const missing =
  coverage.filter(
    (item) =>
      !item.hasLiveContent
  );

const report = {
  generatedAt:
    new Date()
      .toISOString(),
  totalCountries:
    coverage.length,
  liveContentCountries:
    ready.length,
  missingContentCountries:
    missing.length,
  publishedLessons:
    coverage.reduce(
      (sum, item) =>
        sum +
        item.publishedLessons,
      0
    ),
  questions:
    coverage.reduce(
      (sum, item) =>
        sum +
        item.questions,
      0
    ),
  vocabulary:
    coverage.reduce(
      (sum, item) =>
        sum +
        item.vocabulary,
      0
    ),
  countries:
    coverage,
};

const outputDir =
  path.resolve(
    process.cwd(),
    "diagnostics"
  );

fs.mkdirSync(
  outputDir,
  {
    recursive: true,
  }
);

const outputPath =
  path.join(
    outputDir,
    "curriculum-22-live.json"
  );

fs.writeFileSync(
  outputPath,
  JSON.stringify(
    report,
    null,
    2
  ),
  "utf8"
);

for (const item of coverage) {
  console.log(
    [
      "COUNTRY",
      item.code,
      `curricula=${item.curricula}`,
      `grades=${item.grades}`,
      `units=${item.units}`,
      `lessons=${item.publishedLessons}`,
      `questions=${item.questions}`,
      `vocabulary=${item.vocabulary}`,
      `status=${item.hasLiveContent ? "LIVE" : "MISSING"}`,
    ].join(" ")
  );
}

console.log(
  `ARAB_COUNTRIES=${coverage.length}`
);
console.log(
  `LIVE_CONTENT_COUNTRIES=${ready.length}`
);
console.log(
  `MISSING_CONTENT_COUNTRIES=${missing.length}`
);
console.log(
  `MISSING_CODES=${missing.map((item) => item.code).join(",") || "NONE"}`
);
console.log(
  `TOTAL_PUBLISHED_LESSONS=${report.publishedLessons}`
);
console.log(
  `TOTAL_QUESTIONS=${report.questions}`
);
console.log(
  `TOTAL_VOCABULARY=${report.vocabulary}`
);
console.log(
  `REPORT=${outputPath}`
);
console.log(
  "CURRICULUM_22_LIVE_AUDIT=PASS"
);

if (
  process.argv.includes(
    "--require-content-all"
  ) &&
  missing.length
) {
  console.error(
    "CURRICULUM_22_CONTENT_GATE=FAIL"
  );
  process.exit(22);
}
