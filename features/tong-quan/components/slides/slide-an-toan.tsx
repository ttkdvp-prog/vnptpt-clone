'use client';

import { ShieldCheck } from 'lucide-react';
import { SlideComingSoon } from './slide-coming-soon';

export function SlideAnToan() {
  return (
    <SlideComingSoon
      icon={ShieldCheck}
      titleKey="overview.comingSoon.anToanTitle"
      descKey="overview.comingSoon.anToanDesc"
    />
  );
}
