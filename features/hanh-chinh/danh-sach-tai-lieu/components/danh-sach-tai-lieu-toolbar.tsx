import { useMemo } from 'react';
import { Download, FolderCog, Tag, Upload, UserRound } from 'lucide-react';
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
import { useLoaiTaiLieu } from '@/features/hanh-chinh/thiet-lap-tai-lieu/loai-tai-lieu/hooks/use-loai-tai-lieu';
import { useDanhSachTaiLieuStore } from '../store/useDanhSachTaiLieuStore';
import { useDanhSachTaiLieu } from '../hooks/use-danh-sach-tai-lieu';
import { DANH_SACH_TAI_LIEU_SEARCHABLE_KEYS } from '../utils/search-keys';
import { DOCUMENT_STATUS_OPTIONS } from '../core/types';

interface Props {
  onAdd: () => void;
  onExport: () => void;
  onImport: () => void;
  onDeleteMany: (ids: string[]) => void;
}

const chipClass = (layout: 'inline' | 'menu', width?: string) =>
  layout === 'inline' ? (width ?? INLINE_CHIP_CLASS) : MENU_CHIP_CLASS;

const DanhSachTaiLieuToolbar: React.FC<Props> = ({
  onAdd,
  onExport,
  onImport,
  onDeleteMany,
}) => {
  const { canCreate, canImport, canExport, canDelete } =
    useResourcePermissions('documentList');
  const { data: items = [] } = useDanhSachTaiLieu();
  const { data: types = [] } = useLoaiTaiLieu();

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
  } = useDanhSachTaiLieuStore(
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
    storageKey: 'table-danh-sach-tai-lieu',
    filters, sort, columns, density, searchTerm, applyView,
  });

  const selectedCount = selectedIds.size;

  const typeOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      if (
        !matchesSearchTerm(
          item as unknown as Record<string, unknown>,
          searchTerm,
          [...DANH_SACH_TAI_LIEU_SEARCHABLE_KEYS],
        )
      ) {
        continue;
      }
      counts.set(item.id_loai_tai_lieu, (counts.get(item.id_loai_tai_lieu) ?? 0) + 1);
    }
    return types
      .map((t) => ({
        value: t.id,
        label: t.ten_loai_tai_lieu,
        count: counts.get(t.id) ?? 0,
      }))
      .filter((o) => o.count > 0 || filters.id_loai_tai_lieu.includes(o.value))
      .sort((a, b) => a.label.localeCompare(b.label, getLanguage()));
  }, [items, types, searchTerm, filters]);

  const statusOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      if (
        !matchesSearchTerm(
          item as unknown as Record<string, unknown>,
          searchTerm,
          [...DANH_SACH_TAI_LIEU_SEARCHABLE_KEYS],
        )
      ) {
        continue;
      }
      counts.set(item.trang_thai, (counts.get(item.trang_thai) ?? 0) + 1);
    }
    return DOCUMENT_STATUS_OPTIONS.map((o) => ({
      ...o,
      count: counts.get(o.value) ?? 0,
    })).filter((o) => o.count > 0 || filters.trang_thai.includes(o.value));
  }, [items, searchTerm, filters]);

  const creatorOptions = useMemo(() => {
    const counts = new Map<string, number>();
    const labels = new Map<string, string>();
    for (const item of items) {
      if (
        !matchesSearchTerm(
          item as unknown as Record<string, unknown>,
          searchTerm,
          [...DANH_SACH_TAI_LIEU_SEARCHABLE_KEYS],
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
    () =>
      (searchTerm.trim() ? 1 : 0) +
      (filters.id_loai_tai_lieu.length > 0 ? 1 : 0) +
      (filters.trang_thai.length > 0 ? 1 : 0) +
      (filters.nguoi_tao.length > 0 ? 1 : 0),
    [searchTerm, filters],
  );

  const filterGroups = useMemo(
    () => [
      {
        key: 'id_loai_tai_lieu',
        label: txt('document.filterType'),
        icon: FolderCog,
        options: typeOptions,
        value: filters.id_loai_tai_lieu,
        onChange: (val: string[]) => setFilter('id_loai_tai_lieu', val),
      },
      {
        key: 'trang_thai',
        label: txt('document.filterStatus'),
        icon: Tag,
        options: statusOptions,
        value: filters.trang_thai,
        onChange: (val: string[]) => setFilter('trang_thai', val),
      },
      {
        key: 'nguoi_tao',
        label: txt('document.filterCreator'),
        icon: UserRound,
        options: creatorOptions,
        value: filters.nguoi_tao,
        onChange: (val: string[]) => setFilter('nguoi_tao', val),
      },
    ],
    [typeOptions, statusOptions, creatorOptions, filters, setFilter],
  );

  const filterChipItems = useMemo<ToolbarFilterChipItem[]>(
    () => [
      {
        id: 'id_loai_tai_lieu',
        active: filters.id_loai_tai_lieu.length > 0,
        renderChip: (layout) => (
          <FilterChipMultiSelect
            options={typeOptions}
            value={filters.id_loai_tai_lieu}
            onChange={(val) => setFilter('id_loai_tai_lieu', val)}
            placeholder={txt('document.filterType')}
            icon={FolderCog}
            className={chipClass(layout, 'w-[160px]')}
          />
        ),
      },
      {
        id: 'trang_thai',
        active: filters.trang_thai.length > 0,
        renderChip: (layout) => (
          <FilterChipMultiSelect
            options={statusOptions}
            value={filters.trang_thai}
            onChange={(val) => setFilter('trang_thai', val)}
            placeholder={txt('document.filterStatus')}
            icon={Tag}
            className={chipClass(layout, 'w-[140px]')}
          />
        ),
      },
      {
        id: 'nguoi_tao',
        active: filters.nguoi_tao.length > 0,
        renderChip: (layout) => (
          <FilterChipMultiSelect
            options={creatorOptions}
            value={filters.nguoi_tao}
            onChange={(val) => setFilter('nguoi_tao', val)}
            placeholder={txt('document.filterCreator')}
            icon={UserRound}
            className={chipClass(layout, 'w-[148px]')}
          />
        ),
      },
    ],
    [typeOptions, statusOptions, creatorOptions, filters, setFilter],
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

export default DanhSachTaiLieuToolbar;
