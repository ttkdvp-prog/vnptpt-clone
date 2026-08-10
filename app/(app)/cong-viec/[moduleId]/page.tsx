'use client';

import ModulePlaceholder from '@/components/placeholder/ModulePlaceholder';
import { useParams } from '@/lib/navigation';
import { CONG_VIEC_MODULE_NAV_GROUPS } from '@/lib/cong-viec-nav-config';
import { getSidebarMenuItem } from '@/lib/sidebar-menu';
import { txt } from '@/lib/text';

export default function Page() {
  const params = useParams<{ moduleId?: string }>();
  const menu = getSidebarMenuItem('/cong-viec');
  const path = params.moduleId ? `/cong-viec/${params.moduleId}` : '';
  const item = CONG_VIEC_MODULE_NAV_GROUPS.flatMap((group) => group.items).find(
    (moduleItem) => moduleItem.path === path,
  );

  return (
    <ModulePlaceholder
      submenuPath="/cong-viec"
      submenuTitle={txt('nav.workItems')}
      moduleTitle={item ? txt(item.titleKey) : undefined}
      icon={item?.icon ?? menu?.icon}
    />
  );
}
