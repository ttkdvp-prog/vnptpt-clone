import { useEffect, useRef, useState } from 'react';
import { LayoutTemplate } from 'lucide-react';
import Tooltip from '@/components/ui/Tooltip';
import { txt } from '@/lib/text';
import { DEFAULT_KPI_IDS } from '../core/stats-constants';

const KPI_LABEL_KEYS: Record<string, string> = {
  total: 'adminFormStats.kpiTotal',
  da_duyet: 'adminFormStats.kpiApproved',
  cho_duyet: 'adminFormStats.kpiPending',
  tu_choi: 'adminFormStats.kpiRejected',
  tong_ngay: 'adminFormStats.kpiDays',
  typeCount: 'adminFormStats.kpiTypes',
};

interface Props {
  visibleKpiIds: string[];
  onToggle: (id: string) => void;
}

const StatsKpiConfigPopover: React.FC<Props> = ({ visibleKpiIds, onToggle }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Tooltip content={txt('adminFormStats.configureKpis')} placement="bottom">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
        >
          <LayoutTemplate size={14} />
        </button>
      </Tooltip>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-52 rounded-xl border border-border bg-card p-2 shadow-xl">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">
            {txt('adminFormStats.configureKpis')}
          </p>
          {DEFAULT_KPI_IDS.map((id) => (
            <label
              key={id}
              className="flex cursor-pointer items-center gap-2 py-1.5 text-xs"
            >
              <input
                type="checkbox"
                checked={visibleKpiIds.includes(id)}
                onChange={() => onToggle(id)}
                className="rounded border-border accent-primary"
              />
              {txt(KPI_LABEL_KEYS[id] ?? id)}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default StatsKpiConfigPopover;
