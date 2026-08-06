'use client';

import { Factory } from 'lucide-react';
import { SlideComingSoon } from './slide-coming-soon';

export function SlideSanXuat() {
  return (
    <SlideComingSoon
      icon={Factory}
      titleKey="overview.comingSoon.sanXuatTitle"
      descKey="overview.comingSoon.sanXuatDesc"
    />
  );
}
