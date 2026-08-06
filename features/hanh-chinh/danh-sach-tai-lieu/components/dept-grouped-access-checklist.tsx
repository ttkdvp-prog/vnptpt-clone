import { useMemo, useState } from 'react';
import { Building2, Search } from 'lucide-react';
import { txt } from '@/lib/text';
import { cn } from '@/lib/utils';
import { FORM_CONTROL_BASE } from '@/lib/constants/form-control';
import type { Department } from '@/features/he-thong/phong-ban/core/types';
import {
  buildDeptAccessGroups,
  getSubtreeItemIds,
  type DeptAccessItem,
} from '../utils/build-dept-access-groups';

interface Props {
  title: string;
  departments: Department[];
  items: DeptAccessItem[];
  value: string[];
  onChange: (next: string[]) => void;
  searchPlaceholder: string;
  selectedCountLabel: string;
  unassignedLabel: string;
}

export function DeptGroupedAccessChecklist({
  title,
  departments,
  items,
  value,
  onChange,
  searchPlaceholder,
  selectedCountLabel,
  unassignedLabel,
}: Props) {
  const [query, setQuery] = useState('');
  const selected = useMemo(() => new Set(value), [value]);

  const groups = useMemo(
    () => buildDeptAccessGroups(departments, items, unassignedLabel),
    [departments, items, unassignedLabel],
  );

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => {
        const deptMatch = g.label.toLowerCase().includes(q);
        const matchedItems = deptMatch
          ? g.items
          : g.items.filter((i) => i.label.toLowerCase().includes(q));
        if (!deptMatch && matchedItems.length === 0) return null;
        return { ...g, items: matchedItems };
      })
      .filter((g): g is NonNullable<typeof g> => g != null);
  }, [groups, query]);

  const toggleItem = (id: string) => {
    onChange(selected.has(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  const toggleDept = (deptId: string) => {
    const subtreeIds = getSubtreeItemIds(departments, items, deptId);
    if (subtreeIds.length === 0) return;
    const allSelected = subtreeIds.every((id) => selected.has(id));
    if (allSelected) {
      const remove = new Set(subtreeIds);
      onChange(value.filter((id) => !remove.has(id)));
    } else {
      const next = new Set(value);
      subtreeIds.forEach((id) => next.add(id));
      onChange([...next]);
    }
  };

  return (
    <div className="flex min-h-[300px] flex-col overflow-hidden rounded-xl border border-border bg-background">
      <div className="shrink-0 space-y-3 border-b border-border bg-muted/30 px-4 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <span className="text-xs font-medium tabular-nums text-primary">
            {selectedCountLabel}
          </span>
        </div>
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className={cn(FORM_CONTROL_BASE, 'pl-9 pr-3', 'placeholder:text-muted-foreground')}
          />
        </div>
      </div>

      <div className="max-h-[320px] min-h-0 flex-1 space-y-2 overflow-y-auto p-2">
        {filteredGroups.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">
            {txt('common.noResults')}
          </p>
        ) : (
          filteredGroups.map((group) => {
            const subtreeIds = getSubtreeItemIds(departments, items, group.deptId);
            const allSelected =
              subtreeIds.length > 0 && subtreeIds.every((id) => selected.has(id));
            const someSelected = subtreeIds.some((id) => selected.has(id));
            const selectedInSubtree = subtreeIds.filter((id) => selected.has(id)).length;
            const indentPx = Math.max(0, group.level - 1) * 12;

            return (
              <div
                key={group.deptId}
                className="overflow-hidden rounded-xl border border-border bg-card"
                style={{ marginLeft: indentPx }}
              >
                <button
                  type="button"
                  onClick={() => toggleDept(group.deptId)}
                  className="flex w-full items-center gap-3 bg-muted/40 px-3 py-2.5 text-left transition-colors hover:bg-muted/70"
                >
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected && !allSelected;
                    }}
                    onChange={() => toggleDept(group.deptId)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4 shrink-0 rounded border-border text-primary accent-primary"
                  />
                  <Building2 size={16} className="shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                    {group.label}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {selectedInSubtree}/{subtreeIds.length}
                  </span>
                </button>
                <ul className="divide-y divide-border">
                  {group.items.map((item) => {
                    const checked = selected.has(item.id);
                    return (
                      <li key={item.id}>
                        <label
                          className={cn(
                            'flex cursor-pointer items-center gap-3 px-3 py-2.5 pl-10 transition-colors',
                            checked ? 'bg-primary/8' : 'hover:bg-muted/50',
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleItem(item.id)}
                            className="h-4 w-4 shrink-0 rounded border-border text-primary accent-primary"
                          />
                          <span
                            className={cn(
                              'text-sm leading-snug',
                              checked ? 'font-medium text-foreground' : 'text-foreground/90',
                            )}
                          >
                            {item.label}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
