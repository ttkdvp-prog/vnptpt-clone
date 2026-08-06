import { pickCoercedIds } from '@/lib/db/map-entity-row';
import type { Position } from './types';

export function mapPositionFromDb(row: Record<string, unknown>): Position {
  const phongBan = row.var_phong_ban as { ten_phong_ban?: string } | null | undefined;
  const creator = row.creator as { ho_ten?: string } | null | undefined;
  const rest = pickCoercedIds(row, { nullable: ['phong_ban_id', 'nguoi_tao'] });
  delete rest.var_phong_ban;
  delete rest.creator;
  return {
    ...rest,
    ten_phong_ban:
      rest.phong_ban_id == null
        ? 'Chưa phân bổ'
        : (phongBan?.ten_phong_ban ?? undefined),
    ten_nguoi_tao: creator?.ho_ten ?? null,
  } as Position;
}
