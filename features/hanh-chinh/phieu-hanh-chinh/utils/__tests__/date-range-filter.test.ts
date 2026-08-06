import { describe, expect, it } from 'vitest';
import {
  matchesPhieuDateFilter,
  phieuOverlapsDateRange,
} from '../date-range-filter';

describe('phieuOverlapsDateRange', () => {
  it('detects overlap when ranges intersect', () => {
    expect(phieuOverlapsDateRange('2026-07-10', '2026-07-12', '2026-07-01', '2026-07-31')).toBe(
      true,
    );
    expect(phieuOverlapsDateRange('2026-07-01', '2026-07-05', '2026-07-05', '2026-07-10')).toBe(
      true,
    );
  });

  it('rejects when phiếu is fully outside filter', () => {
    expect(phieuOverlapsDateRange('2026-06-01', '2026-06-05', '2026-07-01', '2026-07-31')).toBe(
      false,
    );
  });
});

describe('matchesPhieuDateFilter', () => {
  it('passes all records when preset is all', () => {
    expect(
      matchesPhieuDateFilter('2026-01-01', '2026-01-02', 'all', '', ''),
    ).toBe(true);
  });
});
