/**
 * Deterministically read an entire owner-scoped grading collection.
 * PostgREST may cap each result below the requested page size; advancing by
 * the returned row count (not the requested limit) avoids silent gaps.
 *
 * The caller must provide a stable, strictly increasing id order, owner and
 * lesson filters, and { count: "exact" } on EVERY page. Reject partial or
 * changing snapshots rather than issuing a misleading mastery score.
 */
export async function readCompleteGradingPages<T extends { id: string }>({
  readPage,
  pageSize = 200,
  maxRows = 10000,
}: {
  readPage: (offset: number, limit: number) => Promise<{
    data: T[] | null;
    count: number | null;
    error: { message: string } | null;
  }>;
  pageSize?: number;
  maxRows?: number;
}): Promise<T[]> {
  if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 1000 ||
      !Number.isSafeInteger(maxRows) || maxRows < 1 || maxRows > 100000) {
    throw new Error("إعداد ترقيم بيانات التقويم غير صالح.");
  }

  const rows: T[] = [];
  let expectedCount: number | null = null;
  let lastId = "";
  const seen = new Set<string>();

  while (true) {
    const { data, count, error } = await readPage(rows.length, pageSize);
    if (error) throw new Error("تعذر تحميل بيانات التقويم كاملة.");
    if (typeof count !== "number" || !Number.isSafeInteger(count) || count < 0) {
      throw new Error("تعذر التحقق من عدد بيانات التقويم.");
    }
    if (expectedCount === null) {
      expectedCount = count;
      if (count > maxRows) throw new Error("تجاوز عدد بيانات التقويم الحد الآمن.");
    } else if (count !== expectedCount) {
      throw new Error("تغير عدد بيانات التقويم أثناء القراءة.");
    }
    if (!Array.isArray(data)) throw new Error("نتيجة بيانات التقويم غير صالحة.");
    if (data.length > pageSize || rows.length + data.length > expectedCount) {
      throw new Error("استجابة بيانات التقويم غير متسقة.");
    }
    if (!data.length && rows.length !== expectedCount) {
      throw new Error("فقدت صفحة من بيانات التقويم.");
    }

    for (const row of data) {
      if (!row || typeof row.id !== "string" || !row.id ||
          row.id <= lastId || seen.has(row.id)) {
        throw new Error("ترتيب بيانات التقويم مكرر أو غير متسق.");
      }
      seen.add(row.id);
      lastId = row.id;
      rows.push(row);
    }
    if (rows.length === expectedCount) return rows;
  }
}
