import { useCallback, useMemo } from 'react';
import { Download, Upload, UserRound, Building2 } from 'lucide-react';
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
import type { NguoiLienHe } from '../core/types';
import { useNguoiLienHeStore } from '../store/useNguoiLienHeStore';
import { useNguoiLienHe } from '../hooks/use-nguoi-lien-he';
import { NGUOI_LIEN_HE_SEARCHABLE_KEYS } from '../utils/search-keys';

interface Props {
  onAdd: () => void;
  onExport: () => void;
  onImport: () => void;
  onDeleteMany: (ids: string[]) => void;
}

const chipClass = (layout: 'inline' | 'menu', width?: string) =>
  layout === 'inline' ? (width ?? INLINE_CHIP_CLASS) : MENU_CHIP_CLASS;

interface ChipOption {
  value: string;
  label: string;
  count: number;
}

const NguoiLienHeToolbar: React.FC<Props> = ({
  onAdd,
  onExport,
  onImport,
  onDeleteMany,
}) => {
  const { canCreate, canImport, canExport, canDelete } = useResourcePermissions('contacts');
  const { data: items = [] } = useNguoiLienHe();

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
  } = useNguoiLienHeStore(
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
    storageKey: 'table-nguoi-lien-he',
    filters, sort, columns, density, searchTerm, applyView,
  });

  const selectedCount = selectedIds.size;

  const buildOptions = useCallback(
    (
      getValue: (item: NguoiLienHe) => string | null | undefined,
      getLabel: (item: NguoiLienHe) => string | null | undefined,
    ): ChipOption[] => {
      const counts = new Map<string, number>();
      const labels = new Map<string, string>();
      for (const item of items) {
        if (
          !matchesSearchTerm(
            item as unknown as Record<string, unknown>,
            searchTerm,
            [...NGUOI_LIEN_HE_SEARCHABLE_KEYS],
          )
        ) {
          continue;
        }
        const value = getValue(item);
        if (!value) continue;
        counts.set(value, (counts.get(value) ?? 0) + 1);
        if (!labels.has(value)) {
          labels.set(value, getLabel(item)?.trim() || value);
        }
      }
      return [...counts.entries()]
        .map(([value, count]) => ({ value, label: labels.get(value) ?? value, count }))
        .sort((a, b) => a.label.localeCompare(b.label, getLanguage()));
    },
    [items, searchTerm],
  );

  const customerOptions = useMemo(
    () => buildOptions((i) => i.id_khach_hang, (i) => i.ten_khach_hang),
    [buildOptions],
  );
  const creatorOptions = useMemo(
    () => buildOptions((i) => i.nguoi_tao, (i) => i.ten_nguoi_tao),
    [buildOptions],
  );

  const activeFilterCount = useMemo(
    () =>
      (searchTerm.trim() ? 1 : 0) +
      (filters.id_khach_hang.length > 0 ? 1 : 0) +
      (filters.nguoi_tao.length > 0 ? 1 : 0),
    [searchTerm, filters.id_khach_hang.length, filters.nguoi_tao.length],
  );

  const filterGroups = useMemo(
    () => [
      {
        key: 'id_khach_hang',
        label: txt('contact.filterCustomer'),
        icon: Building2,
        options: customerOptions,
        value: filters.id_khach_hang,
        onChange: (val: string[]) => setFilter('id_khach_hang', val),
      },
      {
        key: 'nguoi_tao',
        label: txt('contact.filterCreator'),
        icon: UserRound,
        options: creatorOptions,
        value: filters.nguoi_tao,
        onChange: (val: string[]) => setFilter('nguoi_tao', val),
      },
    ],
    [customerOptions, creatorOptions, filters.id_khach_hang, filters.nguoi_tao, setFilter],
  );

  const filterChipItems = useMemo<ToolbarFilterChipItem[]>(
    () => [
      {
        id: 'id_khach_hang',
        active: filters.id_khach_hang.length > 0,
        renderChip: (layout) => (
          <FilterChipMultiSelect
            options={customerOptions}
            value={filters.id_khach_hang}
            onChange={(val) => setFilter('id_khach_hang', val)}
            placeholder={txt('contact.filterCustomer')}
            icon={Building2}
            className={chipClass(layout, 'w-[148px]')}
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
            placeholder={txt('contact.filterCreator')}
            icon={UserRound}
            className={chipClass(layout, 'w-[148px]')}
          />
        ),
      },
    ],
    [customerOptions, creatorOptions, filters.id_khach_hang, filters.nguoi_tao, setFilter],
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
        canDelete && selectedCount > 0 ? () => onDeleteMany([...selectedIds]) : undefined
      }
      showBack
      filters={renderFilters}
      filterGroups={filterGroups}
      mobileActions={mobileActions}
      onAdd={canCreate ? onAdd : undefined}
      actions={
        <>
          {canImport && (
            <ListToolbarIconButton icon={Upload} tooltip={txt('common.import')} onClick={onImport} />
          )}
          {canExport && (
            <ListToolbarIconButton icon={Download} tooltip={txt('common.export')} onClick={onExport} />
          )}
          {canCreate && <ListToolbarAddButton onClick={onAdd} />}
        </>
      }
    />
  );
};

export default NguoiLienHeToolbar;
