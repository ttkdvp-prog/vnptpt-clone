import { useMemo } from 'react';
import { Building2, Download, FileSignature, Tag } from 'lucide-react';
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
import { useDepartments } from '@/features/he-thong/phong-ban/hooks/use-phong-ban';
import { useHopDongStore } from '../store/useHopDongStore';
import { useHopDong } from '../hooks/use-hop-dong';
import { HOP_DONG_SEARCHABLE_KEYS } from '../utils/search-keys';
import { CONTRACT_STATUS_OPTIONS, CONTRACT_TYPE_OPTIONS } from '../core/types';

interface Props {
  onAdd: () => void;
  onExport: () => void;
  onImport: () => void;
  onDeleteMany: (ids: string[]) => void;
}

const chipClass = (layout: 'inline' | 'menu', width?: string) =>
  layout === 'inline' ? (width ?? INLINE_CHIP_CLASS) : MENU_CHIP_CLASS;

const SEARCH_KEYS = [...HOP_DONG_SEARCHABLE_KEYS];

const HopDongToolbar: React.FC<Props> = ({
  onAdd,
  onExport,
  onImport: _onImport,
  onDeleteMany,
}) => {
  void _onImport;
  const { canCreate, canExport, canDelete } = useResourcePermissions('contracts');
  const { data: items = [] } = useHopDong();
  const { data: departments = [] } = useDepartments();

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
  } = useHopDongStore(
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
    storageKey: 'table-hop-dong',
    filters, sort, columns, density, searchTerm, applyView,
  });

  const selectedCount = selectedIds.size;

  const typeOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      if (
        !matchesSearchTerm(item as unknown as Record<string, unknown>, searchTerm, SEARCH_KEYS)
      ) {
        continue;
      }
      counts.set(item.loai_hop_dong, (counts.get(item.loai_hop_dong) ?? 0) + 1);
    }
    return CONTRACT_TYPE_OPTIONS.map((o) => ({
      ...o,
      count: counts.get(o.value) ?? 0,
    })).filter((o) => o.count > 0 || filters.loai_hop_dong.includes(o.value));
  }, [items, searchTerm, filters]);

  const statusOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      if (
        !matchesSearchTerm(item as unknown as Record<string, unknown>, searchTerm, SEARCH_KEYS)
      ) {
        continue;
      }
      counts.set(item.trang_thai, (counts.get(item.trang_thai) ?? 0) + 1);
    }
    return CONTRACT_STATUS_OPTIONS.map((o) => ({
      ...o,
      count: counts.get(o.value) ?? 0,
    })).filter((o) => o.count > 0 || filters.trang_thai.includes(o.value));
  }, [items, searchTerm, filters]);

  const departmentOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      if (
        !matchesSearchTerm(item as unknown as Record<string, unknown>, searchTerm, SEARCH_KEYS)
      ) {
        continue;
      }
      if (!item.id_phong_ban) continue;
      counts.set(item.id_phong_ban, (counts.get(item.id_phong_ban) ?? 0) + 1);
    }
    return departments
      .map((d) => ({
        value: d.id,
        label: d.ten_phong_ban,
        count: counts.get(d.id) ?? 0,
      }))
      .filter((o) => o.count > 0 || filters.id_phong_ban.includes(o.value))
      .sort((a, b) => a.label.localeCompare(b.label, getLanguage()));
  }, [items, departments, searchTerm, filters]);

  const activeFilterCount = useMemo(
    () =>
      (searchTerm.trim() ? 1 : 0) +
      (filters.loai_hop_dong.length > 0 ? 1 : 0) +
      (filters.trang_thai.length > 0 ? 1 : 0) +
      (filters.id_phong_ban.length > 0 ? 1 : 0),
    [searchTerm, filters],
  );

  const filterGroups = useMemo(
    () => [
      {
        key: 'loai_hop_dong',
        label: txt('contract.filterType'),
        icon: FileSignature,
        options: typeOptions,
        value: filters.loai_hop_dong,
        onChange: (val: string[]) => setFilter('loai_hop_dong', val),
      },
      {
        key: 'trang_thai',
        label: txt('contract.filterStatus'),
        icon: Tag,
        options: statusOptions,
        value: filters.trang_thai,
        onChange: (val: string[]) => setFilter('trang_thai', val),
      },
      {
        key: 'id_phong_ban',
        label: txt('contract.filterDepartment'),
        icon: Building2,
        options: departmentOptions,
        value: filters.id_phong_ban,
        onChange: (val: string[]) => setFilter('id_phong_ban', val),
      },
    ],
    [typeOptions, statusOptions, departmentOptions, filters, setFilter],
  );

  const filterChipItems = useMemo<ToolbarFilterChipItem[]>(
    () => [
      {
        id: 'loai_hop_dong',
        active: filters.loai_hop_dong.length > 0,
        renderChip: (layout) => (
          <FilterChipMultiSelect
            options={typeOptions}
            value={filters.loai_hop_dong}
            onChange={(val) => setFilter('loai_hop_dong', val)}
            placeholder={txt('contract.filterType')}
            icon={FileSignature}
            className={chipClass(layout, 'w-[150px]')}
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
            placeholder={txt('contract.filterStatus')}
            icon={Tag}
            className={chipClass(layout, 'w-[140px]')}
          />
        ),
      },
      {
        id: 'id_phong_ban',
        active: filters.id_phong_ban.length > 0,
        renderChip: (layout) => (
          <FilterChipMultiSelect
            options={departmentOptions}
            value={filters.id_phong_ban}
            onChange={(val) => setFilter('id_phong_ban', val)}
            placeholder={txt('contract.filterDepartment')}
            icon={Building2}
            className={chipClass(layout, 'w-[160px]')}
          />
        ),
      },
    ],
    [typeOptions, statusOptions, departmentOptions, filters, setFilter],
  );

  const renderFilters = useMemo(
    () => <ToolbarFilterChipGroup items={filterChipItems} maxVisible={3} />,
    [filterChipItems],
  );

  const mobileActions = useMemo(
    () =>
      canExport
        ? [
            {
              key: 'export',
              label: txt('common.export'),
              icon: Download,
              onClick: onExport,
              description: '',
            },
          ]
        : [],
    [onExport, canExport],
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
        canDelete && selectedCount > 0 ? () => onDeleteMany([...selectedIds]) : undefined
      }
      showBack
      filters={renderFilters}
      filterGroups={filterGroups}
      mobileActions={mobileActions}
      onAdd={canCreate ? onAdd : undefined}
      actions={
        <>
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

export default HopDongToolbar;
