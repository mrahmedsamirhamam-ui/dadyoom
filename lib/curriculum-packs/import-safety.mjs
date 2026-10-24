/**
 * Read-only backup preflight for curriculum pack imports.
 *
 * PostgREST often caps range responses at 1,000 rows regardless of the
 * requested range; an unpaged select("*") is NOT a recoverable backup.
 * We fail BEFORE writing curriculum data if any page/count is incomplete.
 *
 * Multiple requests cannot provide a transactional database snapshot:
 * this only verifies completeness at the beginning/end of the export.
 * Keep real point-in-time database recovery in the release procedure.
 */
export const BACKUP_TABLES = Object.freeze([
  "countries",
  "curricula",
  "grades",
  "units",
  "lessons",
  "questions",
  "lesson_vocabulary",
]);

export const BACKUP_PAGE_SIZE = 500;
export const BACKUP_MAX_ROWS_PER_TABLE = 200_000;

export function curriculumLessonSlug(packKey, unitNumber, lessonNumber) {
  const prefix = String(packKey ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!prefix || !Number.isInteger(unitNumber) || unitNumber < 1 ||
      !Number.isInteger(lessonNumber) || lessonNumber < 1) {
    throw new Error("INVALID_CURRICULUM_LESSON_SLUG_INPUT");
  }
  // Lesson numbers are unit-local in many official curricula.
  return `${prefix}-u${String(unitNumber).padStart(2, "0")}-l${String(lessonNumber).padStart(2, "0")}`;
}

export async function readVerifiedTableBackup(db, table, {
  pageSize = BACKUP_PAGE_SIZE,
  maxRows = BACKUP_MAX_ROWS_PER_TABLE,
} = {}) {
  if (!BACKUP_TABLES.includes(table) || !Number.isInteger(pageSize) ||
      pageSize < 1 || !Number.isInteger(maxRows) || maxRows < 0) {
    throw new Error("CURRICULUM_BACKUP_INVALID_PARAMETERS");
  }

  async function exactCount() {
    const result = await db.from(table).select("id", { count: "exact", head: true });
    if (result.error || !Number.isSafeInteger(result.count) || result.count < 0) {
      throw new Error(`CURRICULUM_BACKUP_COUNT_UNAVAILABLE:${table}`);
    }
    return result.count;
  }

  const expectedCount = await exactCount();
  if (expectedCount > maxRows) {
    throw new Error(`CURRICULUM_BACKUP_MAX_ROWS_EXCEEDED:${table}`);
  }

  const rows = [];
  const seenIds = new Set();
  while (rows.length < expectedCount) {
    const offset = rows.length;
    const { data, error } = await db.from(table)
      .select("*")
      .order("id", { ascending: true })
      .range(offset, offset + Math.min(pageSize, expectedCount - offset) - 1);

    if (error || !Array.isArray(data) || data.length < 1 ||
        data.length > Math.min(pageSize, expectedCount - offset)) {
      throw new Error(`CURRICULUM_BACKUP_PAGE_FAILED:${table}`);
    }

    for (const row of data) {
      if (!row || row.id === undefined || row.id === null || seenIds.has(String(row.id))) {
        throw new Error(`CURRICULUM_BACKUP_DUPLICATE_OR_MISSING_ID:${table}`);
      }
      seenIds.add(String(row.id));
      rows.push(row);
    }
  }

  if (await exactCount() !== expectedCount || rows.length !== expectedCount) {
    throw new Error(`CURRICULUM_BACKUP_CHANGED_DURING_EXPORT:${table}`);
  }
  return rows;
}

export async function readVerifiedCurriculumBackup(db, options) {
  const snapshot = {};
  for (const table of BACKUP_TABLES) {
    snapshot[table] = await readVerifiedTableBackup(db, table, options);
  }
  return snapshot;
}
