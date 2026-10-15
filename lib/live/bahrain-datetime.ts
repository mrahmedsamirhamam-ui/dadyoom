/** Interpret datetime-local input as Bahrain wall time, never server time. */
export function parseBahrainDateTimeLocal(value: string): Date | null {
  const local = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/u.test(local)) return null;
  const date = new Date(local + ":00+03:00");
  if (!Number.isFinite(date.getTime())) return null;
  const roundTrip = new Date(date.getTime() + 10800000).toISOString().slice(0, 16);
  return roundTrip === local ? date : null;
}
