/**
 * Calendar-day span for an administrative form.
 * Each calendar day in [tu_ngay, den_ngay] counts as 1 day (buổi ignored).
 */
export function computeSoNgay(
  tuNgay: string | Date | null | undefined,
  denNgay: string | Date | null | undefined,
): number {
  const start = toUtcDateOnly(tuNgay);
  const end = toUtcDateOnly(denNgay);
  if (!start || !end) return 0;
  const diffMs = end.getTime() - start.getTime();
  if (diffMs < 0) return 0;
  return Math.floor(diffMs / 86_400_000) + 1;
}

function toUtcDateOnly(value: string | Date | null | undefined): Date | null {
  if (value == null) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(
      Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
    );
  }
  const s = String(value).trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}
