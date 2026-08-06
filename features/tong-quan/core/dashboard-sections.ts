import {
  BadgeCheck,
  Factory,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';

export const DASHBOARD_SECTION_IDS = [
  'nhan-su',
  'san-xuat',
  'chat-luong',
  'an-toan',
] as const;

export type DashboardSectionId = (typeof DASHBOARD_SECTION_IDS)[number];

export interface DashboardSectionDef {
  id: DashboardSectionId;
  titleKey: string;
  descKey: string;
  icon: LucideIcon;
  ready: boolean;
}

export const DASHBOARD_SECTIONS: DashboardSectionDef[] = [
  {
    id: 'nhan-su',
    titleKey: 'overview.slides.nhanSu',
    descKey: 'overview.dashboard.sectionNhanSuDesc',
    icon: Users,
    ready: true,
  },
  {
    id: 'san-xuat',
    titleKey: 'overview.comingSoon.sanXuatTitle',
    descKey: 'overview.comingSoon.sanXuatDesc',
    icon: Factory,
    ready: false,
  },
  {
    id: 'chat-luong',
    titleKey: 'overview.comingSoon.chatLuongTitle',
    descKey: 'overview.comingSoon.chatLuongDesc',
    icon: BadgeCheck,
    ready: false,
  },
  {
    id: 'an-toan',
    titleKey: 'overview.comingSoon.anToanTitle',
    descKey: 'overview.comingSoon.anToanDesc',
    icon: ShieldCheck,
    ready: false,
  },
];

export const ROSTER_STATUS_FILTER_VALUES = ['lam_viec', 'cong_tac', 'nghi'] as const;
export type RosterStatusFilter = (typeof ROSTER_STATUS_FILTER_VALUES)[number];
