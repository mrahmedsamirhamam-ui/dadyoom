/**
 * Complete, bounded, deterministic snapshot of one content table.
 *
 * PostgREST may silently cap each requested range to fewer rows than
 * requested. Advance by the rows actually delivered, then require an
 * empty terminal page. An export is not a transactional PostgreSQL backup:
 * freeze curriculum writes or obtain a proper database snapshot for
 * rollback-sensitive migrations.
 */
export const CONTENT_BACKUP_BATCH_SIZE = 1000;
export const CONTENT_BACKUP_MAX_ROWS = 250_000;

export async function readCompleteContentTable(
  readRange,
  {
    batchSize = CONTENT_BACKUP_BATCH_SIZE,
    maxRows = CONTENT_BACKUP_MAX_ROWS,
  } = {},
) {
  if (!Number.isSafeInteger(batchSize) || batchSize < 1 ||
      !Number.isSafeInteger(maxRows) || maxRows < 1) {
    throw new Error("CURRICULUM_BACKUP_INVALID_BOUNDS");
  }

  const rows = [];
  const ids = new Set();
  let offset = 0;

  while (offset <= maxRows) {
    const response = await readRange(offset, offset + batchSize - 1);

    if (response?.error || !Array.isArray(response?.data)) {
      throw new Error("CURRICULUM_BACKUP_PAGE_READ_FAILED");
    }

    const batch = response.data;
    if (batch.length === 0) return rows;

    if (batch.length > batchSize) {
      throw new Error("CURRICULUM_BACKUP_UNEXPECTED_BATCH_SIZE");
    }
    if (offset + batch.length > maxRows) {
      throw new Error("CURRICULUM_BACKUP_REQUIRES_LARGER_LIMIT");
    }

    for (const row of batch) {
      if (!row || (typeof row.id !== "string" && typeof row.id !== "number")) {
        throw new Error("CURRICULUM_BACKUP_ROW_ID_MISSING");
      }
      const id = String(row.id);
      if (ids.has(id)) {
        throw new Error("CURRICULUM_BACKUP_DUPLICATE_ROW_ID");
      }
      ids.add(id);
    }

    rows.push(...batch);
    offset += batch.length;
  }

  throw new Error("CURRICULUM_BACKUP_REQUIRES_LARGER_LIMIT");
}
