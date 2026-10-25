/**
 * Retrieve a complete, consistently counted backup before curriculum writes.
 * PostgREST can cap every select below the requested page size. Always advance
 * by the number of actual rows, and abort if counts, ordering or IDs drift.
 */
export async function readCompleteCurriculumBackup(supabase, table, {
  pageSize = 500,
  maxRows = 150000,
} = {}) {
  if (!/^[a-z_]+$/.test(table) || !Number.isSafeInteger(pageSize) ||
      pageSize < 1 || pageSize > 1000 || !Number.isSafeInteger(maxRows) ||
      maxRows < 1) {
    throw new Error("CURRICULUM_BACKUP_PARAMETERS_INVALID");
  }

  const collected = [];
  const seen = new Set();
  let targetCount = null;
  let lastId = null;
  while (true) {
    const offset = collected.length;
    const { data, count, error } = await supabase
      .from(table)
      .select("*", { count: "exact" })
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) throw new Error(`CURRICULUM_BACKUP_QUERY_FAILED:${table}:${error.message || "unknown"}`);
    if (!Array.isArray(data) || !Number.isSafeInteger(count) || count < 0)
      throw new Error(`CURRICULUM_BACKUP_INVALID_COUNT:${table}`);
    if (targetCount === null) {
      targetCount = count;
      if (targetCount > maxRows) throw new Error(`CURRICULUM_BACKUP_TOO_LARGE:${table}`);
    } else if (count !== targetCount) {
      throw new Error(`CURRICULUM_BACKUP_COUNT_CHANGED:${table}`);
    }
    if (data.length > pageSize || offset + data.length > targetCount)
      throw new Error(`CURRICULUM_BACKUP_OVERFLOW:${table}`);
    if (!data.length && offset !== targetCount)
      throw new Error(`CURRICULUM_BACKUP_TRUNCATED:${table}`);

    for (const row of data) {
      if (!row || (typeof row.id !== "string" && typeof row.id !== "number") ||
          seen.has(row.id) || (lastId !== null && String(row.id) <= String(lastId))) {
        throw new Error(`CURRICULUM_BACKUP_IDS_NOT_ORDERED:${table}`);
      }
      seen.add(row.id);
      lastId = row.id;
      collected.push(row);
    }

    if (collected.length === targetCount) {
      if (collected.length !== seen.size)
        throw new Error(`CURRICULUM_BACKUP_DUPLICATE_ID:${table}`);
      return collected;
    }
  }
}
