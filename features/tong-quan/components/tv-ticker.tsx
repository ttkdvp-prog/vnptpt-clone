'use client';

import { Megaphone } from 'lucide-react';
import { txt } from '@/lib/text';
import { useTvTicker } from '../hooks/use-tv-ticker';

/** Single-line announcement strip along the bottom edge */
export function TvTicker() {
  const { data, isError, dataUpdatedAt } = useTvTicker();
  const items = data ?? [];

  const line =
    items.length === 0
      ? txt('overview.noAnnouncements')
      : items
          .map((a) => `${a.timeLabel}  ${a.tieu_de}${a.noi_dung ? ` — ${a.noi_dung}` : ''}`)
          .join('     ·     ');

  const lostLabel =
    isError && dataUpdatedAt
      ? txt('overview.connectionLost', {
          time: new Date(dataUpdatedAt).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        })
      : null;

  return (
    <footer className="shrink-0 px-[3.5%] pb-[1.6%] pt-1">
      <div className="flex items-stretch h-11 rounded-xl border border-white/10 bg-white/[0.04] overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 px-4 shrink-0 bg-primary text-primary-foreground rounded-l-xl">
          <Megaphone className="h-3.5 w-3.5" strokeWidth={1.75} />
          <span className="text-xs font-semibold uppercase tracking-wide whitespace-nowrap">
            {txt('overview.announcements')}
          </span>
        </div>
        <div className="relative flex-1 min-w-0 overflow-hidden flex items-center">
          <div className="tv-ticker-marquee flex whitespace-nowrap text-sm text-white/80 font-medium">
            <span className="px-6">{line}</span>
            <span className="px-6" aria-hidden>
              {line}
            </span>
          </div>
          {lostLabel ? (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-warning bg-zinc-950/85 px-2 py-0.5 rounded-lg border border-warning/25">
              {lostLabel}
            </span>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
