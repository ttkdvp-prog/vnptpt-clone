import type { ColumnConfig, SortState } from '@/store/createGenericStore';
import type { TableDensity } from '@/lib/table-density';

export interface SavedView<TFilters> {
  id: string;
  name: string;
  filters: TFilters;
  searchTerm: string;
  sort: SortState;
  columns: Pick<ColumnConfig, 'id' | 'visible' | 'order' | 'width'>[];
  density: TableDensity;
}

function storageKeyFor(baseKey: string): string {
  return `${baseKey}:views`;
}

/** Đọc danh sách view đã lưu cho 1 module (theo `storageKey` của store module đó). */
export function loadViews<TFilters>(baseKey: string): SavedView<TFilters>[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(storageKeyFor(baseKey));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedView<TFilters>[]) : [];
  } catch {
    return [];
  }
}

/**
 * Ghi danh sách view đã lưu cho 1 module. Nuốt lỗi ghi (vd `QuotaExceededError`
 * khi localStorage đầy) giống `loadViews` — mất 1 lần lưu view không nên làm
 * crash cả trang danh sách.
 */
export function saveViews<TFilters>(baseKey: string, views: SavedView<TFilters>[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(storageKeyFor(baseKey), JSON.stringify(views));
  } catch {
    // đầy quota hoặc bị chặn (chế độ riêng tư) — bỏ qua, view chỉ không lưu được.
  }
}

/** Tạo 1 id ổn định không cần `crypto.randomUUID` (một số môi trường cũ không có). */
export function createViewId(): string {
  return `view-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
