import React, { useCallback, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { txt } from '@/lib/text';
import {
  getStatsTableScrollMaxHeightCss,
  STATS_TABLE_DEFAULT_PAGE_SIZE,
  STATS_TABLE_MAX_BODY_ROWS,
  STATS_TABLE_PAGE_SIZE_OPTIONS,
  STATS_TABLE_VIRTUAL_THRESHOLD,
} from '@/lib/stats-table';
import { cn } from '@/lib/utils';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinnerWithText from '@/components/shared/LoadingSpinnerWithText';
import TablePaginationFooter from '@/components/shared/TablePaginationFooter';
import { useVirtualizedRows } from '@/lib/table-core/use-virtualized-rows';
import { computeStickyOffsets } from '@/lib/table-core/sticky-offsets';
import type {
  StatsDataGridColumn,
  StatsDataGridProps,
  StatsDataGridSortState,
} from './types';

const ALIGN_CLASS: Record<'left' | 'center' | 'right', string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

function getDefaultSortValue<T>(row: T, colId: string): string | number {
  const record = row as Record<string, unknown>;
  const val = record[colId];
  if (typeof val === 'number' || typeof val === 'string') return val;
  return String(val ?? '');
}

function sortRows<T>(
  rows: T[],
  columns: StatsDataGridColumn<T>[],
  sort: StatsDataGridSortState,
): T[] {
  if (!sort.column || !sort.direction) return rows;
  const col = columns.find((c) => c.id === sort.column);
  if (!col?.sortable) return rows;

  const getValue = (row: T): string | number =>
    col.getSortValue?.(row) ?? getDefaultSortValue(row, col.id);

  const dir = sort.direction === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = getValue(a);
    const bv = getValue(b);
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
    return String(av).localeCompare(String(bv), 'vi') * dir;
  });
}

function cycleSort(current: StatsDataGridSortState, colId: string): StatsDataGridSortState {
  if (current.column !== colId) return { column: colId, direction: 'asc' };
  if (current.direction === 'asc') return { column: colId, direction: 'desc' };
  return { column: null, direction: null };
}

function StatsDataGrid<T>({
  title,
  icon: Icon,
  rows,
  columns,
  getRowKey,
  renderCell,
  onRowClick,
  isLoading = false,
  emptyTitle,
  emptyDescription,
  page: controlledPage,
  pageSize: controlledPageSize,
  onPageChange,
  onPageSizeChange,
  maxVisibleBodyRows = STATS_TABLE_MAX_BODY_ROWS,
  renderSummaryRow,
  recordsLabel,
  tableMinWidth = 'min-w-[36rem]',
  sort: controlledSort,
  onSort,
  className,
  embedded = false,
  hideFooter = false,
  fillHeight = false,
}: StatsDataGridProps<T>) {
  const [internalPage, setInternalPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(STATS_TABLE_DEFAULT_PAGE_SIZE);
  const [internalSort, setInternalSort] = useState<StatsDataGridSortState>({
    column: null,
    direction: null,
  });

  const page = controlledPage ?? internalPage;
  const pageSize = controlledPageSize ?? internalPageSize;
  const sort = controlledSort ?? internalSort;

  const setPage = useCallback(
    (p: number) => {
      if (onPageChange) onPageChange(p);
      else setInternalPage(p);
    },
    [onPageChange],
  );

  const setPageSize = useCallback(
    (s: number) => {
      if (onPageSizeChange) onPageSizeChange(s);
      else setInternalPageSize(s);
      setPage(1);
    },
    [onPageSizeChange, setPage],
  );

  const handleSort = useCallback(
    (colId: string) => {
      const next = cycleSort(sort, colId);
      if (onSort) onSort(next.column, next.direction);
      else setInternalSort(next);
    },
    [sort, onSort],
  );

  const sortedRows = useMemo(() => sortRows(rows, columns, sort), [rows, columns, sort]);

  const totalRecords = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const effectivePage = Math.min(page, totalPages);

  const paginatedRows = useMemo(() => {
    if (hideFooter) return sortedRows;
    const start = (effectivePage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, effectivePage, pageSize, hideFooter]);

  const scrollMaxHeight = useMemo(
    () => getStatsTableScrollMaxHeightCss(maxVisibleBodyRows),
    [maxVisibleBodyRows],
  );

  /**
   * `stickyLeftCount` = số cột ghim liên tiếp TỪ ĐẦU (giống mô hình GenericTable) —
   * thay cho cách làm cũ (gắn `left-0` thô cho mọi `col.sticky`, chỉ đúng khi ≤1 cột).
   */
  const stickyLeftCount = useMemo(() => {
    const hasExplicit = columns.some((c) => c.sticky);
    if (!hasExplicit) return columns.length > 0 ? 1 : 0;
    let count = 0;
    for (const c of columns) {
      if (!c.sticky) break;
      count++;
    }
    return count;
  }, [columns]);

  const stickyOffsets = useMemo(
    () => computeStickyOffsets(columns, stickyLeftCount, 0, 80),
    [columns, stickyLeftCount],
  );

  const { scrollElRef: parentRef, useVirtual, items: virtualItems, totalSize } = useVirtualizedRows({
    count: paginatedRows.length,
    estimateSize: 38,
    threshold: STATS_TABLE_VIRTUAL_THRESHOLD,
    overscan: 8,
  });
  const paddingTop = useVirtual && virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom =
    useVirtual && virtualItems.length > 0
      ? totalSize - (virtualItems[virtualItems.length - 1].start + virtualItems[virtualItems.length - 1].size)
      : 0;

  const renderBodyRows = () => {
    if (isLoading) {
      return (
        <tr>
          <td colSpan={columns.length} className="py-12 text-center bg-card">
            <LoadingSpinnerWithText text={txt('common.loadingData')} centered />
          </td>
        </tr>
      );
    }

    if (paginatedRows.length === 0) {
      return (
        <tr>
          <td colSpan={columns.length} className="py-12 text-center bg-card">
            <EmptyState
              title={emptyTitle ?? txt('stats.noData')}
              description={emptyDescription}
            />
          </td>
        </tr>
      );
    }

    const renderRow = (row: T, style?: React.CSSProperties) => {
      const rowKey = getRowKey(row);
      const clickable = Boolean(onRowClick);

      return (
        <tr
          key={rowKey}
          style={style}
          className={cn(
            'group transition-colors duration-150 [&>td]:border-b [&>td]:border-border',
            'even:bg-muted/15 hover:bg-accent',
            clickable && 'cursor-pointer',
          )}
          onClick={() => onRowClick?.(row)}
        >
          {columns.map((col, index) => {
            const isSticky = index < stickyLeftCount;
            const style: React.CSSProperties = col.minWidth != null ? { minWidth: col.minWidth } : {};
            if (isSticky) style.left = stickyOffsets[index];
            return (
              <td
                key={col.id}
                className={cn(
                  'px-3 py-2 text-body-sm text-foreground group-hover:bg-accent transition-colors duration-150',
                  ALIGN_CLASS[col.align ?? 'left'],
                  isSticky &&
                    'sticky z-[1] bg-card border-r border-border/50 group-hover:bg-accent',
                )}
                style={style}
              >
                {renderCell(col.id, row)}
              </td>
            );
          })}
        </tr>
      );
    };

    if (!useVirtual) {
      return paginatedRows.map((row) => renderRow(row));
    }

    return (
      <>
        {paddingTop > 0 && (
          <tr aria-hidden style={{ height: paddingTop }}>
            <td colSpan={columns.length} className="p-0 border-0" />
          </tr>
        )}
        {virtualItems.map((vi) => {
          const row = paginatedRows[vi.index];
          if (!row) return null;
          return renderRow(row, { height: vi.size });
        })}
        {paddingBottom > 0 && (
          <tr aria-hidden style={{ height: paddingBottom }}>
            <td colSpan={columns.length} className="p-0 border-0" />
          </tr>
        )}
      </>
    );
  };

  return (
    <div
      className={cn(
        'flex min-w-0 max-w-full flex-col overflow-hidden',
        !embedded && 'rounded-xl border border-border bg-card',
        fillHeight && 'h-full min-h-0',
        className,
      )}
    >
      {!embedded && (
        <div className="shrink-0 border-b border-border px-4 py-2.5">
          <div className="flex items-center gap-2">
            {Icon && <Icon size={14} className="shrink-0 text-primary" aria-hidden />}
            <h3 className="text-xs font-semibold text-foreground">{title}</h3>
          </div>
        </div>
      )}

      <div
        ref={parentRef}
        className={cn(
          'max-w-full min-w-0 w-full overflow-x-auto overflow-y-auto overscroll-x-contain overscroll-y-contain [-webkit-overflow-scrolling:touch] touch-pan-x touch-pan-y custom-scrollbar',
          fillHeight && 'min-h-0 flex-1 bg-muted/10',
        )}
        style={fillHeight ? undefined : { maxHeight: scrollMaxHeight }}
        role="region"
        aria-label={title}
      >
        <table
          className={cn(
            'w-full text-body-sm border-collapse',
            tableMinWidth,
          )}
        >
          <thead>
            <tr>
              {columns.map((col, index) => {
                const isSticky = index < stickyLeftCount;
                const isSorted = sort.column === col.id;
                const align = col.align ?? (col.id === columns[0]?.id ? 'left' : 'center');
                const style: React.CSSProperties = col.minWidth != null ? { minWidth: col.minWidth } : {};
                if (isSticky) style.left = stickyOffsets[index];

                return (
                  <th
                    key={col.id}
                    scope="col"
                    aria-sort={col.sortable ? (isSorted ? (sort.direction === 'desc' ? 'descending' : 'ascending') : 'none') : undefined}
                    className={cn(
                      'sticky top-0 z-[4] bg-muted border-b border-border px-3 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap',
                      ALIGN_CLASS[align],
                      isSticky && 'z-[5] border-r border-border',
                    )}
                    style={style}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        className={cn(
                          'inline-flex items-center gap-1 font-semibold text-inherit bg-transparent border-0 p-0',
                          'cursor-pointer hover:text-foreground group',
                          align === 'center' && 'justify-center w-full',
                          align === 'right' && 'justify-end w-full',
                        )}
                        onClick={() => handleSort(col.id)}
                      >
                        <span>{col.label}</span>
                        <span
                          className={cn(
                            'shrink-0 transition-opacity',
                            isSorted ? 'opacity-100' : 'opacity-0 group-hover:opacity-40',
                          )}
                        >
                          {isSorted && sort.direction === 'desc' ? (
                            <ArrowDown size={12} className="text-primary" />
                          ) : (
                            <ArrowUp size={12} className={isSorted ? 'text-primary' : ''} />
                          )}
                        </span>
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>{renderBodyRows()}</tbody>
          {renderSummaryRow && totalRecords > 0 && !isLoading && (
            <tfoot>
              <tr className="border-t border-border bg-muted/30 font-semibold text-xs">
                {columns.map((col, index) => {
                  const isSticky = index < stickyLeftCount;
                  const style: React.CSSProperties = {};
                  if (isSticky) style.left = stickyOffsets[index];
                  return (
                  <td
                    key={col.id}
                    style={style}
                    className={cn(
                      'px-3 py-2 tabular-nums',
                      ALIGN_CLASS[col.align ?? 'left'],
                      isSticky &&
                        'sticky z-[1] bg-muted/30 border-r border-border',
                    )}
                  >
                    {renderSummaryRow(col.id, sortedRows)}
                  </td>
                  );
                })}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {totalRecords > 0 && !isLoading && !hideFooter && (
        <TablePaginationFooter
          totalRecords={totalRecords}
          page={effectivePage}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          recordsLabel={recordsLabel ?? txt('stats.footerRecords')}
          pageSizeOptions={[...STATS_TABLE_PAGE_SIZE_OPTIONS]}
          className="w-full shrink-0 rounded-b-xl"
        />
      )}
    </div>
  );
}

export default StatsDataGrid;
