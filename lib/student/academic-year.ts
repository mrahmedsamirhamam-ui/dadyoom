export function currentAcademicYear(
  date = new Date(),
): string {
  const year =
    date.getUTCMonth() >= 8
      ? date.getUTCFullYear()
      : date.getUTCFullYear() - 1;

  return `${year}-${year + 1}`;
}

function academicStartYear(
  value: string | null | undefined,
): number | null {
  const match =
    String(value ?? "")
      .trim()
      .match(/^(\d{4})-(\d{4})$/u);

  if (!match) {
    return null;
  }

  const start = Number(match[1]);
  const end = Number(match[2]);

  if (
    !Number.isInteger(start) ||
    end !== start + 1
  ) {
    return null;
  }

  return start;
}

export function advanceGradeForAcademicYear(
  gradeNumber: number | null | undefined,
  storedAcademicYear: string | null | undefined,
  now = new Date(),
): number | null {
  const grade = Number(gradeNumber);

  if (
    !Number.isInteger(grade) ||
    grade < 1 ||
    grade > 12
  ) {
    return null;
  }

  const storedStart =
    academicStartYear(storedAcademicYear);

  const currentStart =
    academicStartYear(
      currentAcademicYear(now),
    );

  if (
    storedStart === null ||
    currentStart === null ||
    currentStart <= storedStart
  ) {
    return grade;
  }

  return Math.min(
    12,
    grade +
      (currentStart - storedStart),
  );
}
