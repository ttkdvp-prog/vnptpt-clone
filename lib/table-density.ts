/**
 * List-table density tokens — Design System (Phase D2).
 * Source of truth for GenericTable row/cell padding.
 * Stats / detail-sub tables keep their own viewport math; they reference
 * `default` row height in docs (see lib/stats-table.ts, lib/detail-sub-table.ts).
 */

export const TABLE_DENSITY_LEVELS = ['compact', 'default', 'comfortable'] as const;

export type TableDensity = (typeof TABLE_DENSITY_LEVELS)[number];

export const TABLE_DENSITY = {
  compact: {
    rowPx: 32,
    cellPy: 'py-1',
    headerPy: 'py-1',
  },
  default: {
    rowPx: 38,
    cellPy: 'py-1.5',
    headerPy: 'py-1.5',
  },
  comfortable: {
    rowPx: 48,
    cellPy: 'py-3',
    headerPy: 'py-2',
  },
} as const satisfies Record<
  TableDensity,
  { rowPx: number; cellPy: string; headerPy: string }
>;

export function getTableDensity(density: TableDensity = 'default'): (typeof TABLE_DENSITY)[TableDensity] {
  return TABLE_DENSITY[density];
}
