'use client';

import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { txt } from '@/lib/text';

const WEEKDAY_KEYS = [
  'clock.sunday',
  'clock.monday',
  'clock.tuesday',
  'clock.wednesday',
  'clock.thursday',
  'clock.friday',
  'clock.saturday',
] as const;

export function useTvClock(): { time: string; dateLabel: string } {
  const [now, setNow] = useState(() => dayjs());

  useEffect(() => {
    const id = window.setInterval(() => setNow(dayjs()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const weekday = txt(WEEKDAY_KEYS[now.day()]!);
  return {
    time: now.format('HH:mm:ss'),
    dateLabel: `${weekday}, ${now.format('DD/MM/YYYY')}`,
  };
}
