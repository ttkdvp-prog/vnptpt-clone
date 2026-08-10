import { User } from 'lucide-react';
import DetailSection from '@/components/shared/DetailSection';
import DetailField from '@/components/shared/DetailField';
import DetailFieldGrid from '@/components/shared/DetailFieldGrid';
import DetailToolbar, { type DetailToolbarAction } from '@/components/shared/DetailToolbar';
import EnumBadge from '@/components/ui/EnumBadge';
import { txt } from '@/lib/text';
import { ICON_SIZE } from '@/lib/icon-sizes';
import { fieldIcon } from '@/lib/field-icon';
import { STATUS_BADGE_CONFIG } from '../core/constants';
import { EMPLOYEE_FIELD_ICONS } from '../core/employee-field-icons';
import type { Employee } from '../core/types';

interface Props {
  data: Employee;
  toolbarActions: DetailToolbarAction[];
}

export function NhanVienDetailInfo({ data, toolbarActions }: Props) {
  return (
    <div className="space-y-5">
      <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />

      <DetailSection title={txt('employee.detail.personalInfo')} icon={<User size={ICON_SIZE.compact} />}>
        <DetailFieldGrid>
          <DetailField
            label={txt('employee.detail.fullName')}
            value={data.ho_ten}
            icon={fieldIcon(EMPLOYEE_FIELD_ICONS.ho_ten)}
          />
          <DetailField
            label={txt('employee.status')}
            value={<EnumBadge value={data.trang_thai} config={STATUS_BADGE_CONFIG} />}
            icon={fieldIcon(EMPLOYEE_FIELD_ICONS.trang_thai)}
          />
        </DetailFieldGrid>
      </DetailSection>
    </div>
  );
}
