import type { BadgeConfig } from '@/components/ui/EnumBadge';
import { txt } from '@/lib/text';

/** Config EnumBadge trạng thái hoạt động chức vụ (list + detail). */
export function positionTrangThaiBadgeConfig(): BadgeConfig<string> {
  return {
    'Đang hoạt động': { label: txt('position.active'), color: 'primary' },
    'Ngừng hoạt động': { label: txt('position.inactive'), color: 'slate' },
  };
}
