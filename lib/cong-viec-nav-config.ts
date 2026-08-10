import type { LucideIcon } from 'lucide-react';
import { ListTodo, CheckSquare, BarChart3, Files, PieChart } from 'lucide-react';
import type { AppResource } from '@/lib/permissions';

/** Item module trong submenu Công việc. */
export interface WorkModuleNavItem {
  path: string;
  titleKey: string;
  descriptionKey: string;
  icon: LucideIcon;
  color: string;
  /** Khi set — lọc theo canAccessModule trên dashboard / route guard. */
  resource?: AppResource;
}

export interface WorkModuleNavGroup {
  groupTitleKey: string;
  items: WorkModuleNavItem[];
}

/** Submenu Công việc — placeholder, xây dựng nghiệp vụ sau. */
export const CONG_VIEC_MODULE_NAV_GROUPS: WorkModuleNavGroup[] = [
  {
    groupTitleKey: 'page.workDashboard.taskGroup',
    items: [
      {
        path: '/cong-viec/danh-sach-cong-viec',
        titleKey: 'page.workDashboard.task',
        descriptionKey: 'page.workDashboard.taskDesc',
        icon: ListTodo,
        color: 'bg-blue-500',
        resource: 'cong-viec',
      },
      {
        path: '/cong-viec/nhiem-vu',
        titleKey: 'page.workDashboard.assignment',
        descriptionKey: 'page.workDashboard.assignmentDesc',
        icon: CheckSquare,
        color: 'bg-emerald-500',
      },
      {
        path: '/cong-viec/thong-ke-cong-viec',
        titleKey: 'page.workDashboard.taskStats',
        descriptionKey: 'page.workDashboard.taskStatsDesc',
        icon: BarChart3,
        color: 'bg-amber-500',
      },
    ],
  },
  {
    groupTitleKey: 'page.workDashboard.docGroup',
    items: [
      {
        path: '/cong-viec/danh-sach-tai-lieu',
        titleKey: 'page.workDashboard.documentList',
        descriptionKey: 'page.workDashboard.documentListDesc',
        icon: Files,
        color: 'bg-violet-500',
        resource: 'tai-lieu',
      },
      {
        path: '/cong-viec/thong-ke-tai-lieu',
        titleKey: 'page.workDashboard.documentStats',
        descriptionKey: 'page.workDashboard.documentStatsDesc',
        icon: PieChart,
        color: 'bg-rose-500',
        resource: 'tai-lieu',
      },
    ],
  },
];
