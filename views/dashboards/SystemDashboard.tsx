import React, { useMemo } from 'react';
import { txt } from '@/lib/text';
import { useNavigate } from '@/lib/navigation';
import ModuleDashboardLayout from '@/components/dashboard/ModuleDashboardLayout';
import { getModuleGuide } from '@/lib/guide';
import { SYSTEM_MODULE_NAV_GROUPS } from '@/lib/module-nav-config';
import { useCanAccessModuleChecker } from '@/hooks/use-can-access-module-checker';

const SystemDashboard: React.FC = () => {
  const navigate = useNavigate();
  const canAccess = useCanAccessModuleChecker();

  const groups = useMemo(
    () =>
      SYSTEM_MODULE_NAV_GROUPS.map((group) => ({
        groupTitle: txt(group.groupTitleKey),
        items: group.items
          .filter((item) => canAccess(item.resource))
          .map((item) => ({
            title: txt(item.titleKey),
            description: txt(item.descriptionKey),
            icon: item.icon,
            color: item.color,
            moduleId: getModuleGuide(item.path) ? item.path : undefined,
            action: () => navigate(item.path),
          })),
      })).filter((group) => group.items.length > 0),
    [canAccess, navigate]
  );

  return <ModuleDashboardLayout groups={groups} />;
};

export default SystemDashboard;
