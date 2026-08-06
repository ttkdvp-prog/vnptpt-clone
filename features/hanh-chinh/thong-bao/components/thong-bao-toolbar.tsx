import { useCallback, useMemo } from 'react';
import { Briefcase, Download, Layers, UserRound } from 'lucide-react';
import { txt } from '@/lib/text';
import { cn, getLanguage } from '@/lib/utils';
import { matchesSearchTerm } from '@/lib/searchUtils';
import { isAllStatsDateRange } from '@/lib/stats-date-range';
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
import DateRangePicker from '@/components/ui/DateRangePicker';
import { useResourcePermissions } from '@/hooks/use-resource-permissions';
import { getDateRangeFromPreset } from '@/features/he-thong/nhan-vien/utils/stats-date-range';
import {
  DATE_RANGE_PRESETS,
  type DateRangePresetId,
} from '@/features/hanh-chinh/thong-ke-phieu-hanh-chinh/core/stats-constants';
import { useShallow } from 'zustand/react/shallow';
import { useSavedViewsController } from '@/hooks/use-saved-views-controller';
import { useActivePositions } from '@/features/he-thong/chuc-vu/hooks/use-chuc-vu';
import { ANNOUNCEMENT_AUDIENCE } from '../core/types';
import { useThongBaoStore } from '../store/useThongBaoStore';
import { useThongBao } from '../hooks/use-thong-bao';
import { THONG_BAO_SEARCHABLE_KEYS } from '../utils/search-keys';

interface Props {
  onAdd: () => void;
  onExport: () => void;
  onImport: () => void;
  onDeleteMany: (ids: string[]) => void;
}

const chipClass = (layout: 'inline' | 'menu', width?: string) =>
  layout === 'inline'
    ? cn('shrink-0', width ?? INLINE_CHIP_CLASS)
    : MENU_CHIP_CLASS;

const SEARCH_KEYS = [...THONG_BAO_SEARCHABLE_KEYS];

const ThongBaoToolbar: React.FC<Props> = ({
  onAdd,
  onExport,
  onImport: _onImport,
  onDeleteMany,
}) => {
  void _onImport;
  const { canCreate, canExport, canDelete } = useResourcePermissions('announcements');
  const { data: items = [] } = useThongBao();
  const { data: positions = [] } = useActivePositions();

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
  } = useThongBaoStore(
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
    storageKey: 'table-thong-bao',
    filters, sort, columns, density, searchTerm, applyView,
  });

  const selectedCount = selectedIds.size;

  const dateRange = useMemo(
    () =>
      getDateRangeFromPreset(
        filters.date_preset as DateRangePresetId,
        filters.date_custom_start ? new Date(filters.date_custom_start) : undefined,
        filters.date_custom_end ? new Date(filters.date_custom_end) : undefined,
      ),
    [filters.date_preset, filters.date_custom_start, filters.date_custom_end],
  );

  const dateRangeValue = useMemo(
    () => ({
      preset: filters.date_preset,
      customStart: filters.date_custom_start,
      customEnd: filters.date_custom_end,
    }),
    [filters.date_preset, filters.date_custom_start, filters.date_custom_end],
  );

  const handleDateRangeChange = useCallback(
    (v: { preset: string; customStart: string; customEnd: string }) => {
      setFilter('date_preset', v.preset);
      setFilter('date_custom_start', v.customStart);
      setFilter('date_custom_end', v.customEnd);
    },
    [setFilter],
  );

  const dateRangePicker = useCallback(
    (className?: string) => (
      <DateRangePicker
        presets={DATE_RANGE_PRESETS.map((p) => ({ id: p.id, label: p.label }))}
        value={dateRangeValue}
        onChange={handleDateRangeChange}
        displayLabel={
          isAllStatsDateRange(filters.date_preset) ? undefined : dateRange.label
        }
        placeholder={txt('announcement.filterDateRange')}
        className={className}
      />
    ),
    [dateRange.label, dateRangeValue, filters.date_preset, handleDateRangeChange],
  );

  const audienceOptions = useMemo(() => {
    let allCount = 0;
    let byPosCount = 0;
    for (const item of items) {
      if (
        !matchesSearchTerm(item as unknown as Record<string, unknown>, searchTerm, SEARCH_KEYS)
      ) {
        continue;
      }
      if (item.id_chuc_vu.length === 0) allCount += 1;
      else byPosCount += 1;
    }
    return [
      {
        value: ANNOUNCEMENT_AUDIENCE.ALL,
        label: txt('announcement.audienceAll'),
        count: allCount,
      },
      {
        value: ANNOUNCEMENT_AUDIENCE.BY_POSITION,
        label: txt('announcement.audienceByPosition'),
        count: byPosCount,
      },
    ].filter((o) => o.count > 0 || filters.pham_vi.includes(o.value));
  }, [items, searchTerm, filters]);

  const positionOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      if (
        !matchesSearchTerm(item as unknown as Record<string, unknown>, searchTerm, SEARCH_KEYS)
      ) {
        continue;
      }
      if (!item.id_chuc_vu.length) continue;
      for (const id of item.id_chuc_vu) {
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
    }
    return positions
      .map((p) => ({
        value: p.id,
        label: p.ten_chuc_vu,
        count: counts.get(p.id) ?? 0,
      }))
      .filter((o) => o.count > 0 || filters.id_chuc_vu.includes(o.value))
      .sort((a, b) => a.label.localeCompare(b.label, getLanguage()));
  }, [items, positions, searchTerm, filters]);

  const creatorOptions = useMemo(() => {
    const counts = new Map<string, number>();
    const labels = new Map<string, string>();
    for (const item of items) {
      if (
        !matchesSearchTerm(item as unknown as Record<string, unknown>, searchTerm, SEARCH_KEYS)
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
      (isAllStatsDateRange(filters.date_preset) ? 0 : 1) +
      (filters.pham_vi.length > 0 ? 1 : 0) +
      (filters.id_chuc_vu.length > 0 ? 1 : 0) +
      (filters.nguoi_tao.length > 0 ? 1 : 0),
    [searchTerm, filters],
  );

  const filterGroups = useMemo(
    () => [
      {
        key: 'pham_vi',
        label: txt('announcement.filterAudience'),
        icon: Layers,
        options: audienceOptions,
        value: filters.pham_vi,
        onChange: (val: string[]) => setFilter('pham_vi', val),
      },
      {
        key: 'id_chuc_vu',
        label: txt('announcement.filterPosition'),
        icon: Briefcase,
        options: positionOptions,
        value: filters.id_chuc_vu,
        onChange: (val: string[]) => setFilter('id_chuc_vu', val),
      },
      {
        key: 'nguoi_tao',
        label: txt('announcement.filterCreator'),
        icon: UserRound,
        options: creatorOptions,
        value: filters.nguoi_tao,
        onChange: (val: string[]) => setFilter('nguoi_tao', val),
      },
    ],
    [audienceOptions, positionOptions, creatorOptions, filters, setFilter],
  );

  const filterChipItems = useMemo<ToolbarFilterChipItem[]>(
    () => [
      {
        id: 'date_range',
        active: !isAllStatsDateRange(filters.date_preset),
        renderChip: (layout) => dateRangePicker(chipClass(layout, 'w-[148px]')),
      },
      {
        id: 'pham_vi',
        active: filters.pham_vi.length > 0,
        renderChip: (layout) => (
          <FilterChipMultiSelect
            options={audienceOptions}
            value={filters.pham_vi}
            onChange={(val) => setFilter('pham_vi', val)}
            placeholder={txt('announcement.filterAudience')}
            icon={Layers}
            className={chipClass(layout)}
          />
        ),
      },
      {
        id: 'id_chuc_vu',
        active: filters.id_chuc_vu.length > 0,
        renderChip: (layout) => (
          <FilterChipMultiSelect
            options={positionOptions}
            value={filters.id_chuc_vu}
            onChange={(val) => setFilter('id_chuc_vu', val)}
            placeholder={txt('announcement.filterPosition')}
            icon={Briefcase}
            className={chipClass(layout)}
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
            placeholder={txt('announcement.filterCreator')}
            icon={UserRound}
            className={chipClass(layout)}
          />
        ),
      },
    ],
    [
      audienceOptions,
      positionOptions,
      creatorOptions,
      filters,
      setFilter,
      dateRangePicker,
    ],
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
      searchTrailing={
        <div className="sm:hidden shrink-0">{dateRangePicker('shrink-0 w-[148px]')}</div>
      }
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

export default ThongBaoToolbar;
