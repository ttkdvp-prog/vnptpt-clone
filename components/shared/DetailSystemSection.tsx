import React from 'react';
import { Calendar, Clock, User } from 'lucide-react';
import DetailSection from './DetailSection';
import DetailField from './DetailField';
import DetailFieldGrid from './DetailFieldGrid';
import { ICON_SIZE } from '@/lib/icon-sizes';
import { formatDate, formatDateTimeShort } from '@/lib/utils';

export interface DetailSystemSectionLabels {
  createdAt?: string;
  updated?: string;
  createdBy?: string;
}

export interface DetailSystemSectionProps {
  title: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  createdBy?: string | null;
  labels?: DetailSystemSectionLabels;
  className?: string;
}

/** Section hệ thống — luôn đặt cuối detail drawer (tg_tạo, tg cập nhật, người tạo nếu có). */
const DetailSystemSection: React.FC<DetailSystemSectionProps> = ({
  title,
  createdAt,
  updatedAt,
  createdBy,
  labels,
  className,
}) => {
  const createdAtLabel = labels?.createdAt ?? 'Được tạo lúc';
  const updatedLabel = labels?.updated ?? 'Cập nhật';
  const createdByLabel = labels?.createdBy ?? 'Người tạo';

  return (
    <DetailSection
      title={title}
      icon={<Clock size={ICON_SIZE.compact} />}
      variant="primary"
      className={className}
    >
      <DetailFieldGrid>
        {createdBy ? (
          <DetailField
            label={createdByLabel}
            value={createdBy}
            icon={<User size={ICON_SIZE.micro} />}
          />
        ) : null}
        {createdAt ? (
          <DetailField
            label={createdAtLabel}
            value={formatDateTimeShort(createdAt)}
            icon={<Calendar size={ICON_SIZE.micro} />}
          />
        ) : null}
        {updatedAt ? (
          <DetailField
            label={updatedLabel}
            value={formatDate(updatedAt)}
            icon={<Calendar size={ICON_SIZE.micro} />}
          />
        ) : null}
      </DetailFieldGrid>
    </DetailSection>
  );
};

export default DetailSystemSection;
