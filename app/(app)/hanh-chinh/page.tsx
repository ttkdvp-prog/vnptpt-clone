'use client';

import { useMemo } from 'react';
import ModuleDashboardLayout from '@/components/dashboard/ModuleDashboardLayout';
import { useCanAccessModuleChecker } from '@/hooks/use-can-access-module-checker';
import { HANH_CHINH_MODULE_NAV_GROUPS } from '@/lib/hanh-chinh-nav-config';
import { useNavigate } from '@/lib/navigation';
import { getSidebarMenuItem } from '@/lib/sidebar-menu';
import { txt } from '@/lib/text';

export default function Page() {
  const menu = getSidebarMenuItem('/hanh-chinh');
  const navigate = useNavigate();
  const canAccess = useCanAccessModuleChecker();
  const groups = useMemo(
    () =>
      HANH_CHINH_MODULE_NAV_GROUPS.map((group) => ({
        groupTitle: txt(group.groupTitleKey),
        items: group.items
          .filter((item) => !item.resource || canAccess(item.resource))
          .map((item) => ({
            title: txt(item.titleKey),
            description: txt(item.descriptionKey),
            icon: item.icon,
            color: item.color,
            action: () => navigate(item.path),
          })),
      })).filter((group) => group.items.length > 0),
    [canAccess, navigate],
  );

  return (
    <ModuleDashboardLayout
      groups={groups}
      submenuTitle={txt('nav.adminOps')}
      submenuIcon={menu?.icon}
    />
  );
}
