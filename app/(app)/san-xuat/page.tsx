'use client';

import { useMemo } from 'react';
import ModuleDashboardLayout from '@/components/dashboard/ModuleDashboardLayout';
import { useCanAccessModuleChecker } from '@/hooks/use-can-access-module-checker';
import { getModuleGuide } from '@/lib/guide';
import { useNavigate } from '@/lib/navigation';
import { SAN_XUAT_MODULE_NAV_GROUPS } from '@/lib/san-xuat-nav-config';
import { getSidebarMenuItem } from '@/lib/sidebar-menu';
import { txt } from '@/lib/text';

export default function Page() {
  const menu = getSidebarMenuItem('/san-xuat');
  const navigate = useNavigate();
  const canAccess = useCanAccessModuleChecker();

  const groups = useMemo(
    () =>
      SAN_XUAT_MODULE_NAV_GROUPS.map((group) => ({
        groupTitle: txt(group.groupTitleKey),
        items: group.items
          .filter((item) => !item.resource || canAccess(item.resource))
          .map((item) => ({
            title: txt(item.titleKey),
            description: txt(item.descriptionKey),
            icon: item.icon,
            color: item.color,
            moduleId: getModuleGuide(item.path) ? item.path : undefined,
            action: () => navigate(item.path),
          })),
      })).filter((group) => group.items.length > 0),
    [canAccess, navigate],
  );

  return (
    <ModuleDashboardLayout
      groups={groups}
      submenuTitle={txt('nav.production')}
      submenuIcon={menu?.icon}
    />
  );
}
