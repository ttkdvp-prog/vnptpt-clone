import type { LucideIcon } from 'lucide-react';
import {
  Award,
  BarChart3,
  Bell,
  CalendarCheck,
  FileSignature,
  FileText,
  Files,
  FolderCog,
  ScrollText,
  Settings2,
  Wallet,
} from 'lucide-react';
import type { AppResource } from '@/lib/permissions';

/** Item module trong submenu Hành chính. */
export interface AdminOpsModuleNavItem {
  path: string;
  titleKey: string;
  descriptionKey: string;
  icon: LucideIcon;
  color: string;
  /** Khi set — lọc theo canAccessModule trên dashboard / route guard. */
  resource?: AppResource;
}

export interface AdminOpsModuleNavGroup {
  groupTitleKey: string;
  items: AdminOpsModuleNavItem[];
}

/** Submenu Hành chính — dashboard cards placeholder. */
export const HANH_CHINH_MODULE_NAV_GROUPS: AdminOpsModuleNavGroup[] = [
  {
    groupTitleKey: 'page.adminOpsDashboard.payrollGroup',
    items: [
      {
        path: '/hanh-chinh/phieu-hanh-chinh',
        titleKey: 'page.adminOpsDashboard.adminForm',
        descriptionKey: 'page.adminOpsDashboard.adminFormDesc',
        icon: FileText,
        color: 'bg-amber-500',
        resource: 'adminForms',
      },
      {
        path: '/hanh-chinh/thong-ke-phieu-hanh-chinh',
        titleKey: 'page.adminOpsDashboard.adminFormStats',
        descriptionKey: 'page.adminOpsDashboard.adminFormStatsDesc',
        icon: BarChart3,
        color: 'bg-orange-500',
        resource: 'adminForms',
      },
      {
        path: '/hanh-chinh/cham-diem-kpi',
        titleKey: 'page.adminOpsDashboard.kpiScoring',
        descriptionKey: 'page.adminOpsDashboard.kpiScoringDesc',
        icon: Award,
        color: 'bg-violet-500',
      },
      {
        path: '/hanh-chinh/bang-cong',
        titleKey: 'page.adminOpsDashboard.timesheet',
        descriptionKey: 'page.adminOpsDashboard.timesheetDesc',
        icon: CalendarCheck,
        color: 'bg-sky-500',
      },
      {
        path: '/hanh-chinh/bang-luong',
        titleKey: 'page.adminOpsDashboard.payroll',
        descriptionKey: 'page.adminOpsDashboard.payrollDesc',
        icon: Wallet,
        color: 'bg-emerald-500',
      },
      {
        path: '/hanh-chinh/thiet-lap-cong-luong',
        titleKey: 'page.adminOpsDashboard.payrollSettings',
        descriptionKey: 'page.adminOpsDashboard.payrollSettingsDesc',
        icon: Settings2,
        color: 'bg-slate-500',
        resource: 'payrollSettings',
      },
    ],
  },
  {
    groupTitleKey: 'page.adminOpsDashboard.documentGroup',
    items: [
      {
        path: '/hanh-chinh/danh-sach-tai-lieu',
        titleKey: 'page.adminOpsDashboard.documentList',
        descriptionKey: 'page.adminOpsDashboard.documentListDesc',
        icon: Files,
        color: 'bg-blue-500',
        resource: 'documentList',
      },
      {
        path: '/hanh-chinh/thong-ke-tai-lieu',
        titleKey: 'page.adminOpsDashboard.documentStats',
        descriptionKey: 'page.adminOpsDashboard.documentStatsDesc',
        icon: BarChart3,
        color: 'bg-indigo-500',
        resource: 'documentList',
      },
      {
        path: '/hanh-chinh/thiet-lap-tai-lieu',
        titleKey: 'page.adminOpsDashboard.documentSettings',
        descriptionKey: 'page.adminOpsDashboard.documentSettingsDesc',
        icon: FolderCog,
        color: 'bg-slate-500',
        resource: 'documentSettings',
      },
    ],
  },
  {
    groupTitleKey: 'page.adminOpsDashboard.contractDecisionGroup',
    items: [
      {
        path: '/hanh-chinh/hop-dong',
        titleKey: 'page.adminOpsDashboard.contract',
        descriptionKey: 'page.adminOpsDashboard.contractDesc',
        icon: FileSignature,
        color: 'bg-teal-500',
        resource: 'contracts',
      },
      {
        path: '/hanh-chinh/quyet-dinh',
        titleKey: 'page.adminOpsDashboard.decision',
        descriptionKey: 'page.adminOpsDashboard.decisionDesc',
        icon: ScrollText,
        color: 'bg-rose-500',
      },
    ],
  },
  {
    groupTitleKey: 'page.adminOpsDashboard.otherGroup',
    items: [
      {
        path: '/hanh-chinh/thong-bao',
        titleKey: 'page.adminOpsDashboard.announcement',
        descriptionKey: 'page.adminOpsDashboard.announcementDesc',
        icon: Bell,
        color: 'bg-cyan-500',
        resource: 'announcements',
      },
    ],
  },
];
