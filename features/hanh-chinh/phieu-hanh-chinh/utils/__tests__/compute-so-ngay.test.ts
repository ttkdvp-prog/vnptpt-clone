import { describe, expect, it } from 'vitest';
import { computeSoNgay } from '../compute-so-ngay';

describe('computeSoNgay', () => {
  it('same day = 1', () => {
    expect(computeSoNgay('2026-07-01', '2026-07-01')).toBe(1);
  });

  it('multi-day inclusive span', () => {
    expect(computeSoNgay('2026-07-01', '2026-07-03')).toBe(3);
  });

  it('returns 0 when den < tu', () => {
    expect(computeSoNgay('2026-07-05', '2026-07-01')).toBe(0);
  });

  it('returns 0 for missing or invalid dates', () => {
    expect(computeSoNgay(null, '2026-07-01')).toBe(0);
    expect(computeSoNgay('2026-07-01', undefined)).toBe(0);
    expect(computeSoNgay('bad', '2026-07-01')).toBe(0);
  });

  it('accepts Date objects', () => {
    expect(
      computeSoNgay(new Date('2026-07-01T00:00:00.000Z'), new Date('2026-07-02T00:00:00.000Z')),
    ).toBe(2);
  });
});
