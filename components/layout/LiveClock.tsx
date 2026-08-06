'use client';

import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Clock } from 'lucide-react';
import { txt } from '@/lib/text';
import { cn } from '@/lib/utils';

const WEEKDAY_KEYS = [
  'clock.sunday',
  'clock.monday',
  'clock.tuesday',
  'clock.wednesday',
  'clock.thursday',
  'clock.friday',
  'clock.saturday',
] as const;

/**
 * Live date/time for the app top bar.
 * Isolated component so Layout does not re-render every second.
 * Hidden on mobile (`md+` only).
 */
export function LiveClock({ className }: { className?: string }) {
  const [now, setNow] = useState(() => dayjs());

  useEffect(() => {
    const id = window.setInterval(() => setNow(dayjs()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const weekday = txt(WEEKDAY_KEYS[now.day()]!);
  const dateLabel = `${weekday}, ${now.format('DD/MM/YYYY')}`;
  const hours = now.format('HH');
  const minutes = now.format('mm');
  const seconds = now.format('ss');
  const timeLabel = `${hours}:${minutes}:${seconds}`;

  return (
    <div
      className={cn(
        'hidden md:inline-flex items-center gap-2 h-8 pl-1.5 pr-1 rounded-lg',
        'bg-card border border-border/80 shadow-sm',
        'select-none',
        className,
      )}
      role="timer"
      aria-live="off"
      aria-label={`${dateLabel} ${timeLabel}`}
      title={`${dateLabel} · ${timeLabel}`}
    >
      <div className="flex items-center gap-1.5 pl-0.5">
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
          <Clock size={11} strokeWidth={2.25} aria-hidden />
        </span>
        <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">
          {dateLabel}
        </span>
      </div>

      <span
        className={cn(
          'inline-flex items-center h-6 px-2 rounded-md',
          'bg-primary/10 text-primary border border-primary/20',
          'text-[11px] font-semibold tabular-nums tracking-wider whitespace-nowrap',
        )}
      >
        <span>{hours}</span>
        <span className="opacity-50 mx-px">:</span>
        <span>{minutes}</span>
        <span className="opacity-50 mx-px">:</span>
        <span>{seconds}</span>
      </span>
    </div>
  );
}
