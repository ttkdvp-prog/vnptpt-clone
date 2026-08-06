'use client';

import ModulePlaceholder from '@/components/placeholder/ModulePlaceholder';
import { useParams } from '@/lib/navigation';
import { SAN_XUAT_MODULE_NAV_GROUPS } from '@/lib/san-xuat-nav-config';
import { getSidebarMenuItem } from '@/lib/sidebar-menu';
import { txt } from '@/lib/text';

export default function Page() {
  const params = useParams<{ moduleId?: string }>();
  const menu = getSidebarMenuItem('/san-xuat');
  const path = params.moduleId ? `/san-xuat/${params.moduleId}` : '';
  const item = SAN_XUAT_MODULE_NAV_GROUPS.flatMap((group) => group.items).find(
    (moduleItem) => moduleItem.path === path,
  );

  return (
    <ModulePlaceholder
      submenuPath="/san-xuat"
      submenuTitle={txt('nav.production')}
      moduleTitle={item ? txt(item.titleKey) : undefined}
      icon={item?.icon ?? menu?.icon}
    />
  );
}
