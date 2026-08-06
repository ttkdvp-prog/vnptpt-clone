'use client';

import { BadgeCheck } from 'lucide-react';
import { SlideComingSoon } from './slide-coming-soon';

export function SlideChatLuong() {
  return (
    <SlideComingSoon
      icon={BadgeCheck}
      titleKey="overview.comingSoon.chatLuongTitle"
      descKey="overview.comingSoon.chatLuongDesc"
    />
  );
}
