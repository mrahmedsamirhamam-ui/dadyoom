import fs from "node:fs";
import path from "node:path";

type CountryRegistryItem = {
  code: string;
  nameAr: string;
  nameEn?: string | null;
  contentStatus?: string | null;
};

type RegistryFile = {
  schemaVersion: number;
  subject?: {
    code?: string;
    nameAr?: string;
  };
  countries: CountryRegistryItem[];
};

export type CurriculumPackSummary = {
  fileName: string;
  packKey: string;
  countryCode: string;
  countryName: string;
  academicYear: string;
  stageName: string;
  gradeName: string;
  semester: number | null;
  curriculumName: string;
  unitCount: number;
  lessonCount: number;
  verified: boolean;
  sourceLabel: string;
  sourceUrl: string | null;
  shapeOk: boolean;
  shapeError: string | null;
};

export type CurriculumCountryCoverage = {
  code: string;
  nameAr: string;
  nameEn: string | null;
  registryStatus: string;
  packs: number;
  lessons: number;
  ready: boolean;
};

export type CurriculumControlCenter = {
  countries: CurriculumCountryCoverage[];
  packs: CurriculumPackSummary[];
  totalCountries: number;
  readyCountries: number;
  sourceRequiredCountries: number;
  totalPacks: number;
  totalLessons: number;
  invalidPacks: number;
};

function text(value: unknown): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function numberOrNull(
  value: unknown
): number | null {
  return Number.isFinite(
    Number(value)
  )
    ? Number(value)
    : null;
}

function readJson(
  filePath: string
): unknown {
  return JSON.parse(
    fs.readFileSync(
      filePath,
      "utf8"
    )
  );
}

function summarizePack(
  fileName: string,
  raw: unknown
): CurriculumPackSummary {
  const pack =
    raw &&
    typeof raw === "object"
      ? raw as Record<string, unknown>
      : {};

  const country =
    pack.country &&
    typeof pack.country === "object"
      ? pack.country as Record<string, unknown>
      : {};

  const stage =
    pack.stage &&
    typeof pack.stage === "object"
      ? pack.stage as Record<string, unknown>
      : {};

  const grade =
    pack.grade &&
    typeof pack.grade === "object"
      ? pack.grade as Record<string, unknown>
      : {};

  const curriculum =
    pack.curriculum &&
    typeof pack.curriculum === "object"
      ? pack.curriculum as Record<string, unknown>
      : {};

  const rights =
    pack.rights &&
    typeof pack.rights === "object"
      ? pack.rights as Record<string, unknown>
      : {};

  const units =
    Array.isArray(pack.units)
      ? pack.units
      : [];

  let lessonCount = 0;

  for (const unit of units) {
    if (
      unit &&
      typeof unit === "object" &&
      Array.isArray(
        (unit as Record<string, unknown>).lessons
      )
    ) {
      lessonCount += (
        (unit as Record<string, unknown>)
          .lessons as unknown[]
      ).length;
    }
  }

  const countryCode =
    text(country.code);

  const packKey =
    text(pack.packKey);

  const shapeErrors: string[] = [];

  if (pack.schemaVersion !== 1) {
    shapeErrors.push("schemaVersion");
  }

  if (!packKey) {
    shapeErrors.push("packKey");
  }

  if (!/^[A-Z]{2}$/.test(countryCode)) {
    shapeErrors.push("country.code");
  }

  if (!units.length) {
    shapeErrors.push("units");
  }

  if (!lessonCount) {
    shapeErrors.push("lessons");
  }

  return {
    fileName,
    packKey,
    countryCode,
    countryName:
      text(country.nameAr) ||
      countryCode ||
      "غير محددة",
    academicYear:
      text(pack.academicYear) ||
      "غير محددة",
    stageName:
      text(stage.nameAr) ||
      text(stage.code) ||
      "مرحلة غير محددة",
    gradeName:
      text(grade.nameAr) ||
      (
        numberOrNull(grade.number) !== null
          ? `الصف ${Number(grade.number)}`
          : "صف غير محدد"
      ),
    semester:
      numberOrNull(pack.semester),
    curriculumName:
      text(curriculum.nameAr) ||
      "اللغة العربية",
    unitCount:
      units.length,
    lessonCount,
    verified:
      rights.verified === true,
    sourceLabel:
      text(rights.sourceLabel),
    sourceUrl:
      text(rights.sourceUrl) ||
      null,
    shapeOk:
      shapeErrors.length === 0,
    shapeError:
      shapeErrors.length
        ? shapeErrors.join("، ")
        : null,
  };
}

export function getCurriculumControlCenter():
  CurriculumControlCenter {
  const dir =
    path.resolve(
      process.cwd(),
      "data/curriculum-packs"
    );

  const registryPath =
    path.join(
      dir,
      "arab-countries.json"
    );

  const registry =
    readJson(
      registryPath
    ) as RegistryFile;

  const registryCountries =
    Array.isArray(registry.countries)
      ? registry.countries
      : [];

  const packFiles =
    fs.readdirSync(dir)
      .filter(
        (name) =>
          name.endsWith(".json") &&
          name !== "arab-countries.json"
      )
      .sort(
        (a, b) =>
          a.localeCompare(b, "ar")
      );

  const packs =
    packFiles.map(
      (fileName) => {
        try {
          return summarizePack(
            fileName,
            readJson(
              path.join(
                dir,
                fileName
              )
            )
          );
        }
        catch (error) {
          return {
            fileName,
            packKey: "",
            countryCode: "",
            countryName:
              "حزمة غير صالحة",
            academicYear: "—",
            stageName: "—",
            gradeName: "—",
            semester: null,
            curriculumName: "—",
            unitCount: 0,
            lessonCount: 0,
            verified: false,
            sourceLabel: "",
            sourceUrl: null,
            shapeOk: false,
            shapeError:
              error instanceof Error
                ? error.message
                : "JSON غير صالح",
          };
        }
      }
    );

  const validReadyPacks =
    packs.filter(
      (pack) =>
        pack.shapeOk &&
        pack.verified
    );

  const countries =
    registryCountries.map(
      (country) => {
        const countryPacks =
          validReadyPacks.filter(
            (pack) =>
              pack.countryCode ===
              country.code
          );

        const lessons =
          countryPacks.reduce(
            (total, pack) =>
              total + pack.lessonCount,
            0
          );

        return {
          code: country.code,
          nameAr: country.nameAr,
          nameEn:
            country.nameEn ?? null,
          registryStatus:
            country.contentStatus ??
            "official-source-required",
          packs:
            countryPacks.length,
          lessons,
          ready:
            countryPacks.length > 0,
        };
      }
    );

  const readyCountries =
    countries.filter(
      (country) =>
        country.ready
    ).length;

  const totalLessons =
    validReadyPacks.reduce(
      (total, pack) =>
        total + pack.lessonCount,
      0
    );

  return {
    countries,
    packs,
    totalCountries:
      countries.length,
    readyCountries,
    sourceRequiredCountries:
      countries.length -
      readyCountries,
    totalPacks:
      validReadyPacks.length,
    totalLessons,
    invalidPacks:
      packs.filter(
        (pack) =>
          !pack.shapeOk ||
          !pack.verified
      ).length,
  };
}
