'use client';

import {
  BadgeCheck,
  Factory,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { txt } from '@/lib/text';
import { cn } from '@/lib/utils';
import { TV_SLIDE_IDS, TV_SLIDE_TITLE_KEYS, type TvSlideId } from '../core/slides';

const SLIDE_ICONS: Record<TvSlideId, LucideIcon> = {
  'nhan-su': Users,
  'san-xuat': Factory,
  'chat-luong': BadgeCheck,
  'an-toan': ShieldCheck,
};

export interface TvRailProps {
  slideIndex: number;
  onGoTo: (index: number) => void;
}

export function TvRail({ slideIndex, onGoTo }: TvRailProps) {
  return (
    <nav
      className="w-[11.5rem] shrink-0 flex flex-col gap-1 py-1 pr-2"
      aria-label={txt('overview.title')}
    >
      {TV_SLIDE_IDS.map((id, index) => {
        const Icon = SLIDE_ICONS[id];
        const active = index === slideIndex;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onGoTo(index)}
            className={cn(
              'relative flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              active
                ? 'bg-primary/15 text-primary'
                : 'text-white/45 hover:bg-white/[0.05] hover:text-white/80',
            )}
          >
            {active ? (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-sm bg-primary" />
            ) : null}
            <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            <span className="text-sm font-medium truncate">{txt(TV_SLIDE_TITLE_KEYS[id])}</span>
          </button>
        );
      })}
    </nav>
  );
}
