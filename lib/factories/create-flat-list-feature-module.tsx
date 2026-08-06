/**
 * Factory CRUD phẳng với ListComponent tùy biến (chức vụ, …).
 */
import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  Suspense,
  startTransition,
} from 'react';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useListWithFilter } from '@/lib/list-filter-utils';
import { useExportData } from '@/hooks/use-export-data';
import { useConfirmStore } from '@/store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL, CONFIRM_YES } from '@/lib/button-labels';
import { DRAWER_Z_CONTENT_BASE } from '@/lib/dialog-sizes';
import type { FormMode, FormViewOrigin } from '@/lib/last-view-flow';
import ImportDialog from '@/components/shared/ImportDialog';
import type { ImportBatchRow, ImportLookupSheet, ImportMutationInput, ImportResult } from '@/lib/import';
import ExportDialog from '@/components/shared/ExportDialog';
import type { GenericState } from '@/store/createGenericStore';
import type { TrangThaiHoatDong } from '@/lib/constants/trang-thai';
import { cn } from '@/lib/utils';

const DrawerLazyFallback: React.FC = () => (
  <div
    className="fixed inset-0 flex items-center justify-center bg-black/30 pointer-events-none"
    style={{ zIndex: DRAWER_Z_CONTENT_BASE }}
  >
    <div
      className="h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent"
      aria-hidden
    />
  </div>
);

export interface FlatListImportColumn {
  key: string;
  label: string;
  required?: boolean;
}

export interface FlatListExportColumn {
  key: string;
  label: string;
}

export interface FlatListFeatureModuleConfig<
  T,
  TFilters,
  TListProps,
  TToolbarProps = Record<string, unknown>,
> {
  usePrimaryData: () => { data?: T[]; isLoading: boolean };
  useSecondaryData?: () => { data?: unknown[]; isLoading: boolean };
  prefetchOnMount?: (queryClient: ReturnType<typeof useQueryClient>) => void;
  useStore: () => GenericState<TFilters> & {
    selectedIds: Set<string>;
    clearSelection: () => void;
    pagination: { page: number; pageSize: number };
    columns: { id: string; visible: boolean }[];
    setFilter: (key: keyof TFilters & string, value: unknown) => void;
  };
  keyExtractor: (item: T) => string;
  filterFn: (item: T, searchTerm: string, filters: TFilters, ctx: unknown) => boolean;
  sortFn?: (a: T, b: T, sort: GenericState<TFilters>['sort']) => number;
  defaultSortFn?: (a: T, b: T) => number;
  exportMapFn: (item: T) => Record<string, unknown>;
  importColumns: FlatListImportColumn[];
  exportColumns: FlatListExportColumn[];
  exportFileName: string;
  importTemplateName: string;
  noExportDataMessage: string;
  importLookupSheets?:
    | ImportLookupSheet[]
    | ((ctx: { primary: T[]; secondary: unknown[] }) => ImportLookupSheet[]);
  useImportMutation: () => {
    mutateAsync: (input: ImportMutationInput) => Promise<ImportResult>;
  };
  useDeleteMutation: () => {
    mutate: (ids: string[], opts?: { onSuccess?: () => void }) => void;
  };
  /**
   * Optional — module không có `TrangThaiHoatDong` (vd FK lookup như Khách hàng,
   * hoặc không có khái niệm trạng thái) thì bỏ trống. Trước đây MỌI module phải
   * khai một `useNoop*StatusMutation` chỉ để thoả kiểu bắt buộc; toolbar/list
   * nhận `onStatusChangeMany`/`onStatusChange` rồi tự `void` — code chết ở cả
   * hai đầu. Bỏ optional để không phải giả vờ có tính năng không tồn tại.
   */
  useStatusMutation?: () => {
    mutate: (
      vars: { ids: string[]; status: TrangThaiHoatDong },
      opts?: { onSuccess?: (updated?: T) => void },
    ) => void;
  };
  getDeleteTitle: () => string;
  getDeleteMessage: () => string;
  getStatusChangeTitle?: () => string;
  getBulkDeleteMessage: (count: number) => string;
  getBulkStatusMessage?: (count: number, status: string) => string;
  ToolbarComponent: React.ComponentType<TToolbarProps>;
  buildToolbarProps: (ctx: {
    filterCounts: Record<string, unknown>;
    distinctLevels?: number[];
    onAdd: () => void;
    onExport: () => void;
    onImport: () => void;
    onDeleteMany: (ids: string[]) => void;
    onStatusChangeMany?: (ids: string[], status: TrangThaiHoatDong) => void;
  }) => TToolbarProps;
  buildListProps: (ctx: {
    filtered: T[];
    sortFn: (a: T, b: T) => number;
    isLoading: boolean;
    secondaryData: unknown[];
    filterCounts: Record<string, unknown>;
    onEdit: (item: T) => void;
    onDelete: (id: string) => void;
    onStatusChange?: (item: T) => void;
    onView: (item: T) => void;
    onAddWithContext: (contextId: string) => void;
    onDuplicate: (item: T) => void;
  }) => TListProps;
  ListComponent: React.ComponentType<TListProps>;
  FormComponent: React.ComponentType<{
    initialData: T | null;
    /** `duplicate`: tạo mới điền sẵn từ `initialData` (form tự reset mã/trạng thái/file). */
    mode?: FormMode;
    onClose: () => void;
  }>;
  DetailComponent: React.ComponentType<{
    data: T;
    onClose: () => void;
    onEdit: (item: T) => void;
    onDelete: (id: string) => void;
    onStatusChange?: (item: T) => void;
    onDuplicate?: (item: T) => void;
  }>;
  useFilterCounts?: () => Record<string, unknown>;
  pruneFilters?: (
    filters: TFilters,
    secondary: unknown[],
    setFilter: (key: keyof TFilters & string, value: unknown) => void,
  ) => void;
  syncViewingItem?: (viewing: T | null, primary: T[]) => T | null;
  /** Extra props for create form when opened from list context (e.g. department row). */
  getFormExtraProps?: (createContext: string | null) => Record<string, unknown>;
  /**
   * Khi true — dùng trong shell TabGroup (không `h-page` / `mt-1.5`).
   * Shell cha chịu `h-page`; tab → toolbar sát nhau.
   */
  embedded?: boolean;
}

export function createFlatListFeatureModule<
  T,
  TFilters,
  TListProps,
  TToolbarProps = Record<string, unknown>,
>(
  config: FlatListFeatureModuleConfig<T, TFilters, TListProps, TToolbarProps>,
): React.FC {
  const {
    usePrimaryData,
    useSecondaryData,
    prefetchOnMount,
    useStore,
    keyExtractor,
    filterFn,
    sortFn,
    defaultSortFn,
    exportMapFn,
    importColumns,
    exportColumns,
    exportFileName,
    importTemplateName,
    noExportDataMessage,
    importLookupSheets,
    useImportMutation,
    useDeleteMutation,
    useStatusMutation,
    getDeleteTitle,
    getDeleteMessage,
    getStatusChangeTitle,
    getBulkDeleteMessage,
    getBulkStatusMessage,
    ToolbarComponent,
    buildToolbarProps,
    buildListProps,
    ListComponent,
    FormComponent,
    DetailComponent,
    useFilterCounts,
    pruneFilters,
    syncViewingItem,
    getFormExtraProps,
    embedded = false,
  } = config;

  const FlatListPage: React.FC = () => {
    const confirm = useConfirmStore((s) => s.confirm);
    const queryClient = useQueryClient();
    const store = useStore();
    const {
      searchTerm,
      filters,
      sort,
      resetState,
      clearSelection,
      selectedIds,
      pagination,
      columns,
      setFilter,
    } = store;

    const [showForm, setShowForm] = useState(false);
    const [formMode, setFormMode] = useState<FormMode>('create');
    const [editingItem, setEditingItem] = useState<T | null>(null);
    const [viewingItem, setViewingItem] = useState<T | null>(null);
    const [formOrigin, setFormOrigin] = useState<FormViewOrigin>('list');
    const [showExport, setShowExport] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [createContext, setCreateContext] = useState<string | null>(null);

    const { data: primary = [], isLoading: primaryLoading } = usePrimaryData();
    const secondaryHook = useSecondaryData?.() ?? { data: undefined, isLoading: false };
    const secondary = useMemo(() => secondaryHook.data ?? [], [secondaryHook.data]);
    const isLoading = primaryLoading || secondaryHook.isLoading;

    const deleteMutation = useDeleteMutation();
    const statusMutation = useStatusMutation?.();
    const importMutation = useImportMutation();

    const prefetchOnMountFactory = prefetchOnMount;
    useEffect(() => {
      prefetchOnMountFactory?.(queryClient);
      return () => resetState();
    }, [queryClient, resetState, prefetchOnMountFactory]);

    useEffect(() => {
      if (!viewingItem || !syncViewingItem) return;
      const fresh = syncViewingItem(viewingItem, primary);
      if (fresh && fresh !== viewingItem) queueMicrotask(() => setViewingItem(fresh));
    }, [primary, viewingItem]);

    useEffect(() => {
      pruneFilters?.(filters, secondary, setFilter);
    }, [filters, secondary, setFilter]);

    const filterCounts = useFilterCounts?.() ?? {};

    const stableFilterFn = useCallback(
      (item: T, term: string, f: TFilters) => filterFn(item, term, f, secondary),
      [secondary],
    );

    const filtered = useListWithFilter(primary, searchTerm, filters, stableFilterFn);

    const sortPositions = useCallback(
      (a: T, b: T) => {
        if (sort.column && sort.direction && sortFn) {
          const cmp = sortFn(a, b, sort);
          return sort.direction === 'desc' ? -cmp : cmp;
        }
        if (defaultSortFn) return defaultSortFn(a, b);
        return 0;
      },
      [sort],
    );

    const stableExportMapFn = useCallback((item: T) => exportMapFn(item), []);
    const { exportData, paginatedData, selectedData } = useExportData({
      data: filtered,
      isOpen: showExport,
      mapFn: stableExportMapFn,
      pagination,
      selectedIds,
      keyExtractor,
    });

    const visibleColumnKeys = useMemo(
      () => columns.filter((c) => c.visible).map((c) => c.id),
      [columns],
    );

    const handleEdit = (item: T, origin: FormViewOrigin) => {
      startTransition(() => {
        setFormOrigin(origin);
        if (origin === 'list') setViewingItem(null);
        setCreateContext(null);
        setFormMode('edit');
        setEditingItem(item);
        setShowForm(true);
      });
    };

    const handleDuplicate = (item: T, origin: FormViewOrigin) => {
      startTransition(() => {
        setFormOrigin(origin);
        if (origin === 'list') setViewingItem(null);
        setCreateContext(null);
        setFormMode('duplicate');
        setEditingItem(item);
        setShowForm(true);
      });
    };

    const handleDelete = (id: string) => {
      confirm({
        title: getDeleteTitle(),
        message: getDeleteMessage(),
        variant: 'danger',
        confirmText: CONFIRM_DELETE(),
        onConfirm: async () => {
          deleteMutation.mutate([id], {
            onSuccess: () => {
              if (viewingItem && keyExtractor(viewingItem) === id) setViewingItem(null);
            },
          });
        },
      });
    };

    const handleStatusChange = !statusMutation
      ? undefined
      : (item: T) => {
          const newStatus: TrangThaiHoatDong =
            (item as { trang_thai: TrangThaiHoatDong }).trang_thai === 'Đang hoạt động'
              ? 'Ngừng hoạt động'
              : 'Đang hoạt động';
          confirm({
            title: getStatusChangeTitle?.() ?? '',
            message: getBulkStatusMessage?.(1, newStatus) ?? '',
            variant: 'warning',
            confirmText: CONFIRM_YES(),
            onConfirm: async () => {
              statusMutation.mutate(
                { ids: [keyExtractor(item)], status: newStatus },
                {
                  onSuccess: (updated) => {
                    if (
                      updated &&
                      viewingItem &&
                      keyExtractor(viewingItem) === keyExtractor(updated)
                    ) {
                      setViewingItem(updated);
                    }
                  },
                },
              );
            },
          });
        };

    const handleDeleteMany = (ids: string[]) => {
      confirm({
        title: getDeleteTitle(),
        message: getBulkDeleteMessage(ids.length),
        variant: 'danger',
        confirmText: CONFIRM_DELETE_ALL(),
        onConfirm: async () => {
          deleteMutation.mutate(ids, {
            onSuccess: () => {
              clearSelection();
              if (viewingItem && ids.includes(keyExtractor(viewingItem))) setViewingItem(null);
            },
          });
        },
      });
    };

    const handleStatusChangeMany = !statusMutation
      ? undefined
      : (ids: string[], status: TrangThaiHoatDong) => {
          confirm({
            title: getStatusChangeTitle?.() ?? '',
            message: getBulkStatusMessage?.(ids.length, status) ?? '',
            variant: 'warning',
            confirmText: CONFIRM_YES(),
            onConfirm: async () => {
              statusMutation.mutate({ ids, status }, { onSuccess: () => clearSelection() });
            },
          });
        };

    const handleExport = () => {
      if (filtered.length === 0) {
        toast.warning(noExportDataMessage);
        return;
      }
      setShowExport(true);
    };

    const handleCloseForm = () => {
      const wasEditing = editingItem;
      const origin = formOrigin;
      setShowForm(false);
      setEditingItem(null);
      setFormMode('create');
      setCreateContext(null);

      if (origin === 'list') {
        setViewingItem(null);
      } else if (origin === 'detail' && viewingItem && wasEditing) {
        const fresh = primary.find((p) => keyExtractor(p) === keyExtractor(wasEditing));
        if (fresh) setViewingItem(fresh);
      }

      setFormOrigin('list');
    };

    const handleAddWithContext = useCallback((contextId: string) => {
      startTransition(() => {
        setFormOrigin('list');
        setEditingItem(null);
        setFormMode('create');
        setViewingItem(null);
        setCreateContext(contextId);
        setShowForm(true);
      });
    }, []);

    const formExtraProps = useMemo(
      () => getFormExtraProps?.(createContext) ?? {},
      [createContext],
    );

    const resolvedLookupSheets = useMemo((): ImportLookupSheet[] => {
      if (!importLookupSheets) return [];
      if (typeof importLookupSheets === 'function') {
        return importLookupSheets({ primary, secondary });
      }
      return importLookupSheets;
    }, [primary, secondary]);

    const handleImport = async (
      rows: ImportBatchRow[],
      ctx?: { onProgress?: (done: number, total: number) => void },
    ): Promise<ImportResult> => {
      return importMutation.mutateAsync({ rows, onProgress: ctx?.onProgress });
    };

    const toolbarProps = buildToolbarProps({
      filterCounts,
      onAdd: () => {
        startTransition(() => {
          setFormOrigin('list');
          setEditingItem(null);
          setFormMode('create');
          setCreateContext(null);
          setShowForm(true);
        });
      },
      onExport: handleExport,
      onImport: () => setShowImport(true),
      onDeleteMany: handleDeleteMany,
      onStatusChangeMany: handleStatusChangeMany,
    });

    const listProps = buildListProps({
      filtered,
      sortFn: sortPositions,
      isLoading,
      secondaryData: secondary,
      filterCounts,
      onEdit: (item) => handleEdit(item, 'list'),
      onDelete: handleDelete,
      onStatusChange: handleStatusChange,
      onView: (item) => startTransition(() => setViewingItem(item)),
      onAddWithContext: handleAddWithContext,
      onDuplicate: (item) => handleDuplicate(item, 'list'),
    });

    const renderToolbarProps = toolbarProps as Record<string, unknown>;
    const renderListProps = listProps as Record<string, unknown>;
    const RenderToolbar = ToolbarComponent as React.ComponentType<Record<string, unknown>>;
    const RenderList = ListComponent as React.ComponentType<Record<string, unknown>>;

    return (
      <div
        className={cn(
          'flex flex-col relative',
          embedded ? 'flex-1 min-h-0' : 'h-page',
        )}
      >
        <div
          className={cn(
            'flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden relative z-0',
            !embedded && 'mt-1.5',
          )}
        >
          <RenderToolbar {...renderToolbarProps} />
          <div className="flex-1 min-h-0">
            <RenderList {...renderListProps} />
          </div>
        </div>

        <AnimatePresence>
          {showForm && (
            <Suspense fallback={<DrawerLazyFallback />}>
              <FormComponent
                initialData={editingItem}
                mode={formMode}
                onClose={handleCloseForm}
                {...formExtraProps}
              />
            </Suspense>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {viewingItem && !showForm && (
            <Suspense fallback={<DrawerLazyFallback />}>
              <DetailComponent
                data={viewingItem}
                onClose={() => setViewingItem(null)}
                onEdit={(item) => handleEdit(item, 'detail')}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                onDuplicate={(item) => handleDuplicate(item, 'detail')}
              />
            </Suspense>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showExport && (
            <ExportDialog
              open={showExport}
              onClose={() => setShowExport(false)}
              columns={exportColumns}
              data={exportData}
              paginatedData={paginatedData}
              selectedData={selectedData}
              fileName={exportFileName}
              visibleColumnKeys={visibleColumnKeys}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showImport && (
            <ImportDialog
              open={showImport}
              onClose={() => setShowImport(false)}
              columns={importColumns}
              onImport={handleImport}
              templateFileName={importTemplateName}
              lookupSheets={resolvedLookupSheets}
            />
          )}
        </AnimatePresence>
      </div>
    );
  };

  return FlatListPage;
}
