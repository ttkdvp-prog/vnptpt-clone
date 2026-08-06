'use client';

import type { LucideIcon } from 'lucide-react';
import { txt } from '@/lib/text';
import { TV_SURFACE } from '@/features/tong-quan/components/tv-theme';
import { cn } from '@/lib/utils';

interface SlideComingSoonProps {
  icon: LucideIcon;
  titleKey: string;
  descKey: string;
}

export function SlideComingSoon({ icon: Icon, titleKey, descKey }: SlideComingSoonProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-8 relative">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, hsl(var(--primary) / 0.12), transparent 55%)',
        }}
      />
      <div
        className={cn(
          TV_SURFACE,
          'relative mb-8 h-24 w-24 flex items-center justify-center',
        )}
      >
        <Icon className="h-10 w-10 text-primary" strokeWidth={1.4} />
      </div>
      <span className="relative inline-flex items-center rounded-lg border border-warning/30 bg-warning/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-warning mb-4">
        {txt('overview.comingSoon.badge')}
      </span>
      <h2 className="relative text-3xl md:text-4xl font-semibold text-white tracking-tight mb-4">
        {txt(titleKey)}
      </h2>
      <p className="relative max-w-xl text-sm md:text-base text-white/45 leading-relaxed">
        {txt(descKey)}
      </p>
    </div>
  );
}
