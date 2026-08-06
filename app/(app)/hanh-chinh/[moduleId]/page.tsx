'use client';

import ModulePlaceholder from '@/components/placeholder/ModulePlaceholder';
import { HANH_CHINH_MODULE_NAV_GROUPS } from '@/lib/hanh-chinh-nav-config';
import { useParams } from '@/lib/navigation';
import { getSidebarMenuItem } from '@/lib/sidebar-menu';
import { txt } from '@/lib/text';

export default function Page() {
  const params = useParams<{ moduleId?: string }>();
  const menu = getSidebarMenuItem('/hanh-chinh');
  const path = params.moduleId ? `/hanh-chinh/${params.moduleId}` : '';
  const item = HANH_CHINH_MODULE_NAV_GROUPS.flatMap((group) => group.items).find(
    (moduleItem) => moduleItem.path === path,
  );

  return (
    <ModulePlaceholder
      submenuPath="/hanh-chinh"
      submenuTitle={txt('nav.adminOps')}
      moduleTitle={item ? txt(item.titleKey) : undefined}
      icon={item?.icon ?? menu?.icon}
    />
  );
}
