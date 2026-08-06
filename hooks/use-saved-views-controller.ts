import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { txt } from '@/lib/text';
import type { ColumnConfig, SortState } from '@/store/createGenericStore';
import type { TableDensity } from '@/lib/table-density';
import { createViewId, loadViews, saveViews, type SavedView } from '@/lib/saved-views';

interface UseSavedViewsControllerOptions<TFilters> {
  /** Phải trùng `storageKey` truyền cho `createGenericStore` của module này. */
  storageKey: string;
  filters: TFilters;
  sort: SortState;
  columns: ColumnConfig[];
  density: TableDensity;
  searchTerm: string;
  applyView: (view: {
    filters: TFilters;
    sort: SortState;
    columns: Pick<ColumnConfig, 'id' | 'visible' | 'order' | 'width'>[];
    density: TableDensity;
    searchTerm: string;
  }) => void;
}

/**
 * Quản lý danh sách Saved View (lưu localStorage) dùng chung cho mọi module —
 * tránh lặp lại logic load/save/apply/delete ở từng `*-toolbar.tsx`.
 */
export function useSavedViewsController<TFilters>({
  storageKey, filters, sort, columns, density, searchTerm, applyView,
}: UseSavedViewsControllerOptions<TFilters>) {
  const [views, setViews] = useState<SavedView<TFilters>[]>(() => loadViews<TFilters>(storageKey));
  const [activeViewId, setActiveViewId] = useState<string | null>(null);

  const onSaveView = useCallback((name: string) => {
    const view: SavedView<TFilters> = {
      id: createViewId(),
      name,
      filters,
      searchTerm,
      sort,
      density,
      columns: columns.map((c) => ({ id: c.id, visible: c.visible, order: c.order, width: c.width })),
    };
    setViews((prev) => {
      const next = [...prev, view];
      saveViews(storageKey, next);
      return next;
    });
    setActiveViewId(view.id);
    toast.success(txt('common.viewSaved'));
  }, [storageKey, filters, searchTerm, sort, density, columns]);

  const onApplyView = useCallback((view: SavedView<TFilters>) => {
    applyView(view);
    setActiveViewId(view.id);
    toast.success(txt('common.viewApplied'));
  }, [applyView]);

  const onDeleteView = useCallback((id: string) => {
    setViews((prev) => {
      const next = prev.filter((v) => v.id !== id);
      saveViews(storageKey, next);
      return next;
    });
    setActiveViewId((prev) => (prev === id ? null : prev));
    toast.success(txt('common.viewDeleted'));
  }, [storageKey]);

  return { views, activeViewId, onApplyView, onSaveView, onDeleteView };
}
