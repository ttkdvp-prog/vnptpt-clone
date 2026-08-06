import { useMemo } from 'react';
import { Download, Upload, UserRound } from 'lucide-react';
import { txt } from '@/lib/text';
import { getLanguage } from '@/lib/utils';
import { matchesSearchTerm } from '@/lib/searchUtils';
import GenericToolbar from '@/components/shared/GenericToolbar';
import FilterChipMultiSelect from '@/components/shared/FilterChipMultiSelect';
import ToolbarFilterChipGroup, {
  INLINE_CHIP_CLASS,
  MENU_CHIP_CLASS,
  type ToolbarFilterChipItem,
} from '@/components/shared/ToolbarFilterChipGroup';
import {
  ListToolbarAddButton,
  ListToolbarIconButton,
} from '@/components/shared/ListToolbarActions';
import { useResourcePermissions } from '@/hooks/use-resource-permissions';
import { useShallow } from 'zustand/react/shallow';
import { useSavedViewsController } from '@/hooks/use-saved-views-controller';
import { useTrangThaiKhachHangStore } from '../store/useTrangThaiKhachHangStore';
import { useTrangThaiKhachHang } from '../hooks/use-trang-thai-khach-hang';
import { TRANG_THAI_KHACH_HANG_SEARCHABLE_KEYS } from '../utils/search-keys';

interface Props {
  onAdd: () => void;
  onExport: () => void;
  onImport: () => void;
  onDeleteMany: (ids: string[]) => void;
}

const chipClass = (layout: 'inline' | 'menu', width?: string) =>
  layout === 'inline' ? (width ?? INLINE_CHIP_CLASS) : MENU_CHIP_CLASS;

const TrangThaiKhachHangToolbar: React.FC<Props> = ({
  onAdd,
  onExport,
  onImport,
  onDeleteMany,
}) => {
  const { canCreate, canImport, canExport, canDelete } = useResourcePermissions('customerSettings');
  const { data: items = [] } = useTrangThaiKhachHang();

  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
    resetFilters,
    columns,
    toggleColumn,
    reorderColumns,
    resetColumns,
    density,
    setDensity,
    sort,
    applyView,
    selectedIds,
    clearSelection,
  } = useTrangThaiKhachHangStore(
    useShallow((s) => ({
      searchTerm: s.searchTerm,
      setSearchTerm: s.setSearchTerm,
      filters: s.filters,
      setFilter: s.setFilter,
      resetFilters: s.resetFilters,
      columns: s.columns,
      toggleColumn: s.toggleColumn,
      reorderColumns: s.reorderColumns,
      resetColumns: s.resetColumns,
      density: s.density,
      setDensity: s.setDensity,
      sort: s.sort,
      applyView: s.applyView,
      selectedIds: s.selectedIds,
      clearSelection: s.clearSelection,
    })),
  );

  const { views, activeViewId, onApplyView, onSaveView, onDeleteView } = useSavedViewsController({
    storageKey: 'table-trang-thai-khach-hang',
    filters, sort, columns, density, searchTerm, applyView,
  });

  const selectedCount = selectedIds.size;

  const creatorOptions = useMemo(() => {
    const counts = new Map<string, number>();
    const labels = new Map<string, string>();
    for (const item of items) {
      if (
        !matchesSearchTerm(
          item as unknown as Record<string, unknown>,
          searchTerm,
          [...TRANG_THAI_KHACH_HANG_SEARCHABLE_KEYS],
        )
      ) {
        continue;
      }
      if (!item.nguoi_tao) continue;
      counts.set(item.nguoi_tao, (counts.get(item.nguoi_tao) ?? 0) + 1);
      if (!labels.has(item.nguoi_tao)) {
        labels.set(item.nguoi_tao, item.ten_nguoi_tao?.trim() || item.nguoi_tao);
      }
    }
    return [...counts.entries()]
      .map(([value, count]) => ({
        value,
        label: labels.get(value) ?? value,
        count,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, getLanguage()));
  }, [items, searchTerm]);

  const activeFilterCount = useMemo(
    () => (searchTerm.trim() ? 1 : 0) + (filters.nguoi_tao.length > 0 ? 1 : 0),
    [searchTerm, filters.nguoi_tao.length],
  );

  const filterGroups = useMemo(
    () => [
      {
        key: 'nguoi_tao',
        label: txt('customerSettings.filterCreator'),
        icon: UserRound,
        options: creatorOptions,
        value: filters.nguoi_tao,
        onChange: (val: string[]) => setFilter('nguoi_tao', val),
      },
    ],
    [creatorOptions, filters.nguoi_tao, setFilter],
  );

  const filterChipItems = useMemo<ToolbarFilterChipItem[]>(
    () => [
      {
        id: 'nguoi_tao',
        active: filters.nguoi_tao.length > 0,
        renderChip: (layout) => (
          <FilterChipMultiSelect
            options={creatorOptions}
            value={filters.nguoi_tao}
            onChange={(val) => setFilter('nguoi_tao', val)}
            placeholder={txt('customerSettings.filterCreator')}
            icon={UserRound}
            className={chipClass(layout, 'w-[148px]')}
          />
        ),
      },
    ],
    [creatorOptions, filters.nguoi_tao, setFilter],
  );

  const renderFilters = useMemo(
    () => <ToolbarFilterChipGroup items={filterChipItems} maxVisible={3} />,
    [filterChipItems],
  );

  const mobileActions = useMemo(
    () => [
      ...(canImport
        ? [{ key: 'import', label: txt('common.import'), icon: Upload, onClick: onImport, description: '' }]
        : []),
      ...(canExport
        ? [{ key: 'export', label: txt('common.export'), icon: Download, onClick: onExport, description: '' }]
        : []),
    ],
    [onImport, onExport, canImport, canExport],
  );

  return (
    <GenericToolbar
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder={txt('common.searchPlaceholder')}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      density={density}
      onSetDensity={setDensity}
      savedViews={views}
      activeViewId={activeViewId}
      onApplyView={onApplyView}
      onSaveView={onSaveView}
      onDeleteView={onDeleteView}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={() => {
        setSearchTerm('');
        resetFilters();
      }}
      selectedCount={selectedCount}
      onClearSelection={clearSelection}
      onDeleteMany={
        canDelete && selectedCount > 0
          ? () => onDeleteMany([...selectedIds])
          : undefined
      }
      showBack
      filters={renderFilters}
      filterGroups={filterGroups}
      mobileActions={mobileActions}
      onAdd={canCreate ? onAdd : undefined}
      actions={
        <>
          {canImport && (
            <ListToolbarIconButton
              icon={Upload}
              tooltip={txt('common.import')}
              onClick={onImport}
            />
          )}
          {canExport && (
            <ListToolbarIconButton
              icon={Download}
              tooltip={txt('common.export')}
              onClick={onExport}
            />
          )}
          {canCreate && <ListToolbarAddButton onClick={onAdd} />}
        </>
      }
    />
  );
};

export default TrangThaiKhachHangToolbar;
