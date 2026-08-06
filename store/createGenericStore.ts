import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CSSProperties } from 'react';
import { type TableDensity } from '@/lib/table-density';

/**
 * Cấu hình cột dùng cho list/table view.
 * Quy định generic: mỗi cột nên có defaultWidth + minWidth + maxWidth — xem
 * `lib/table-column-presets.ts` (preset theo loại dữ liệu).
 * Ô dữ liệu dài: `truncate` / ellipsis trong cell; badge dùng `EnumBadge truncate`.
 */
export interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  /**
   * Chiều rộng khi mở bảng, chưa resize tay (px) — đủ đọc nội dung điển hình.
   * KHÔNG dùng minWidth làm mặc định: minWidth là sàn kéo thu hẹp nên luôn chật.
   */
  defaultWidth?: number;
  /** Chiều rộng tối thiểu (px) — sàn khi user kéo thu hẹp. Nên luôn khai báo. */
  minWidth?: number;
  /** Chiều rộng tối đa (px). Nên khai báo cho cột text dài để tránh cột quá rộng. */
  maxWidth?: number;
  /** Chiều rộng hiện tại (do user resize). undefined = dùng defaultWidth */
  width?: number;
  order: number;
  /**
   * Độ ưu tiên hiển thị: 1 = cột định danh chính (luôn hiện), 2 = quan trọng vừa
   * (hiện ở tablet+desktop), 3 = phụ (chỉ hiện ở desktop). Không khai báo = 1 (luôn hiện).
   * Dùng để tự ẩn bớt cột ở breakpoint tablet (768–1024px) — xem GenericTable/HierarchyTable.
   */
  priority?: 1 | 2 | 3;
}

/** Giá trị maxWidth mặc định khi cột không khai báo (tránh cột trải quá rộng). */
export const DEFAULT_COLUMN_MAX_WIDTH = 400;

/** Bề rộng dùng khi cột không khai báo gì (defaultWidth/minWidth đều thiếu). */
export const DEFAULT_COLUMN_WIDTH = 150;

/**
 * Bề rộng hiệu lực của một cột (px) — nguồn duy nhất cho `<colgroup>`, offset sticky
 * và tổng minWidth của bảng. Thứ tự: user resize → defaultWidth (preset) → minWidth → fallback.
 */
export function resolveColumnWidth(
  col: Pick<ColumnConfig, 'width' | 'defaultWidth' | 'minWidth'>,
  fallback: number = DEFAULT_COLUMN_WIDTH,
): number {
  return col.width ?? col.defaultWidth ?? col.minWidth ?? fallback;
}

/** Input cho getColumnCellStyle: cột đầy đủ hoặc bảng con chỉ cần minWidth/maxWidth. */
export type ColumnStyleInput = Pick<ColumnConfig, 'minWidth' | 'maxWidth'>;

/**
 * Style áp dụng cho th/td theo ColumnConfig (minWidth + maxWidth).
 * Dùng thống nhất ở mọi list/table (kể cả bảng con) để cột có kích thước phù hợp.
 */
export function getColumnCellStyle(col: ColumnStyleInput): CSSProperties {
  const style: CSSProperties = {};
  if (col.minWidth != null) style.minWidth = col.minWidth;
  if (col.maxWidth != null) style.maxWidth = col.maxWidth;
  else style.maxWidth = DEFAULT_COLUMN_MAX_WIDTH;
  return style;
}

export interface PaginationState {
  page: number;
  pageSize: number;
}

export interface SortState {
  column: string | null;
  direction: 'asc' | 'desc' | null;
}

/** Select-all scope: page = header checkbox toggles current page only. `filtered` reserved for later. */
export type SelectionScope = 'page' | 'filtered';

export interface GenericState<TFilters> {
  // Data State
  searchTerm: string;
  filters: TFilters;
  pagination: PaginationState;
  sort: SortState;

  // UI State
  selectedIds: Set<string>;
  /** D2.4 — default page; foundation for select-all-filtered later. */
  selectionScope: SelectionScope;
  columns: ColumnConfig[];
  density: TableDensity;

  // Actions
  setSearchTerm: (term: string) => void;
  setFilter: (key: keyof TFilters, value: unknown) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  toggleSelection: (id: string) => void;
  toggleAllSelection: (ids: string[]) => void;
  clearSelection: () => void;
  setSelectionScope: (scope: SelectionScope) => void;
  toggleColumn: (id: string) => void;
  reorderColumns: (fromIndex: number, toIndex: number) => void;
  resizeColumn: (id: string, width: number) => void;
  resetColumns: () => void;
  setDensity: (density: TableDensity) => void;
  setSort: (column: string | null, direction: 'asc' | 'desc' | null) => void;
  resetState: () => void;
  /** Áp dụng 1 Saved View (filters+sort+columns+density+searchTerm) — xem `lib/saved-views.ts`. */
  applyView: (view: {
    filters: TFilters;
    sort: SortState;
    columns: Pick<ColumnConfig, 'id' | 'visible' | 'order' | 'width'>[];
    density: TableDensity;
    searchTerm: string;
  }) => void;
}

/**
 * Gộp cấu hình cột đã lưu (width/order/visible) với danh sách cột hiện tại trong code.
 * Cột mới thêm sau này hoặc không có trong bản lưu → dùng mặc định; cấu trúc (label,
 * minWidth, maxWidth...) luôn lấy từ `defaultColumns` để tránh vỡ khi dev đổi cột.
 */
function mergeColumns(
  defaultColumns: ColumnConfig[],
  persistedColumns?: Pick<ColumnConfig, 'id' | 'visible' | 'order' | 'width'>[]
): ColumnConfig[] {
  if (!persistedColumns?.length) {
    return defaultColumns.map((col, i) => ({ ...col, order: col.order ?? i }));
  }
  const persistedById = new Map(persistedColumns.map(col => [col.id, col]));
  return defaultColumns.map((col, i) => {
    const persisted = persistedById.get(col.id);
    if (!persisted) return { ...col, order: col.order ?? i };
    const min = col.minWidth ?? 50;
    const max = col.maxWidth ?? DEFAULT_COLUMN_MAX_WIDTH;
    return {
      ...col,
      visible: persisted.visible,
      order: persisted.order,
      width: persisted.width != null ? Math.min(Math.max(persisted.width, min), max) : persisted.width,
    };
  }).sort((a, b) => a.order - b.order);
}

export const createGenericStore = <TFilters>(
  initialFilters: TFilters,
  defaultColumns: ColumnConfig[],
  storageKey: string
) => create<GenericState<TFilters>>()(
  persist(
    (set) => ({
  searchTerm: '',
  filters: initialFilters,
  pagination: {
    page: 1,
    pageSize: 20,
  },
  sort: {
    column: null,
    direction: null,
  },
  selectedIds: new Set(),
  selectionScope: 'page',
  columns: defaultColumns.map((col, i) => ({ ...col, order: col.order ?? i })),
  density: 'default',

  setSearchTerm: (term) => set((state) => ({ searchTerm: term, pagination: { page: 1, pageSize: state.pagination.pageSize } })),
  
  setFilter: (key, value) => set((state) => ({
    filters: { ...state.filters, [key]: value },
    pagination: { ...state.pagination, page: 1 }
  })),

  resetFilters: () => set((state) => ({ 
    filters: initialFilters,
    pagination: { ...state.pagination, page: 1 }
  })),

  setPage: (page) => set((state) => ({ pagination: { ...state.pagination, page } })),
  
  setPageSize: (pageSize) => set((state) => ({ pagination: { ...state.pagination, pageSize, page: 1 } })),

  toggleSelection: (id) => set((state) => {
    const newSelected = new Set(state.selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    return { selectedIds: newSelected };
  }),

  toggleAllSelection: (ids) => set((state) => {
    const allSelected = ids.every(id => state.selectedIds.has(id));
    const newSelected = new Set(state.selectedIds);
    
    if (allSelected) {
      ids.forEach(id => newSelected.delete(id));
    } else {
      ids.forEach(id => newSelected.add(id));
    }
    return { selectedIds: newSelected };
  }),

  clearSelection: () => set({ selectedIds: new Set() }),

  setSelectionScope: (scope) => set({ selectionScope: scope }),

  toggleColumn: (id) => set((state) => ({
    columns: state.columns.map(col => 
      col.id === id ? { ...col, visible: !col.visible } : col
    )
  })),

  reorderColumns: (fromIndex, toIndex) => set((state) => {
    const sorted = [...state.columns].sort((a, b) => a.order - b.order);
    const [moved] = sorted.splice(fromIndex, 1);
    sorted.splice(toIndex, 0, moved);
    return {
      columns: sorted.map((col, i) => ({ ...col, order: i }))
    };
  }),

  resizeColumn: (id, width) => set((state) => ({
    columns: state.columns.map(col => {
      if (col.id !== id) return col;
      const min = col.minWidth ?? 50;
      const max = col.maxWidth ?? DEFAULT_COLUMN_MAX_WIDTH;
      return { ...col, width: Math.min(Math.max(width, min), max) };
    })
  })),

  resetColumns: () => set({
    columns: defaultColumns.map((col, i) => ({ ...col, order: col.order ?? i }))
  }),

  setDensity: (density) => set({ density }),

  setSort: (column, direction) => set({ sort: { column, direction } }),

  resetState: () => set({
    searchTerm: '',
    filters: initialFilters,
    pagination: { page: 1, pageSize: 20 },
    sort: { column: null, direction: null },
    selectedIds: new Set(),
    selectionScope: 'page',
    columns: defaultColumns.map((col, i) => ({ ...col, order: col.order ?? i }))
  }),

  applyView: (view) => set((state) => ({
    filters: view.filters,
    searchTerm: view.searchTerm,
    sort: view.sort,
    density: view.density,
    columns: mergeColumns(defaultColumns, view.columns),
    pagination: { ...state.pagination, page: 1 },
  })),
    }),
    {
      name: storageKey,
      version: 1,
      partialize: (state) => ({ columns: state.columns, density: state.density }),
      merge: (persisted, currentState) => {
        const persistedState = persisted as Partial<Pick<GenericState<TFilters>, 'columns' | 'density'>> | undefined;
        return {
          ...currentState,
          columns: mergeColumns(defaultColumns, persistedState?.columns),
          density: persistedState?.density ?? currentState.density,
        };
      },
    }
  )
);
