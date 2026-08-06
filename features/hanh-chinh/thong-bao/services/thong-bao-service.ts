import type { ThongBao } from '../core/types';
import type { ThongBaoFormValues } from '../core/schema';
import { createRepository } from '@/lib/data/create-repository';
import { isApi } from '@/lib/data/config';
import {
  apiCreateThongBao,
  apiDeleteThongBao,
  apiGetThongBao,
  apiGetThongBaoList,
  apiUpdateThongBao,
} from '@/lib/api/hanh-chinh-thong-bao';
import { getCurrentEmployeeId } from '@/lib/current-session-employee';
import { txt } from '@/lib/text';

const ts = () => new Date().toISOString();

const MOCK_ANNOUNCEMENTS: ThongBao[] = [
  {
    id: '1',
    tg_dang: ts(),
    tieu_de: 'Thông báo họp định kỳ tháng này',
    noi_dung:
      'Toàn thể nhân viên vui lòng tham dự họp định kỳ vào sáng thứ 2 tuần tới tại phòng họp lớn.',
    id_chuc_vu: [],
    ten_chuc_vu: [],
    ten_nguoi_tao: 'Admin',
    nguoi_tao: '1',
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  },
  {
    id: '2',
    tg_dang: ts(),
    tieu_de: 'Cập nhật quy định nội bộ',
    noi_dung: 'Phòng Hành chính đã cập nhật quy định giờ làm việc. Vui lòng xem chi tiết.',
    id_chuc_vu: ['1'],
    ten_chuc_vu: ['Nhân viên'],
    ten_nguoi_tao: 'Admin',
    nguoi_tao: '1',
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  },
];

const repo = createRepository<ThongBao>({
  tableName: 'hc_thong_bao',
  mockData: MOCK_ANNOUNCEMENTS,
  delay: 300,
});

export async function getThongBaoList(): Promise<ThongBao[]> {
  if (isApi()) return apiGetThongBaoList();
  return repo.getAll();
}

export async function getThongBaoById(id: string): Promise<ThongBao | null> {
  if (isApi()) return apiGetThongBao(id);
  return repo.getById(id);
}

export async function createThongBao(data: ThongBaoFormValues): Promise<ThongBao> {
  if (isApi()) return apiCreateThongBao(data);
  const now = ts();
  return repo.insert({
    tg_dang: data.tg_dang,
    tieu_de: data.tieu_de,
    noi_dung: data.noi_dung,
    id_chuc_vu: data.id_chuc_vu ?? [],
    ten_chuc_vu: [],
    nguoi_tao: getCurrentEmployeeId(),
    tg_tao: now,
    tg_cap_nhat: now,
  });
}

export async function updateThongBao(
  id: string,
  data: ThongBaoFormValues,
): Promise<ThongBao> {
  if (isApi()) return apiUpdateThongBao(id, data);
  const existing = await repo.getById(id);
  if (!existing) throw new Error(txt('announcement.title'));
  return repo.update(id, {
    tg_dang: data.tg_dang,
    tieu_de: data.tieu_de,
    noi_dung: data.noi_dung,
    id_chuc_vu: data.id_chuc_vu ?? [],
    tg_cap_nhat: ts(),
  });
}

export async function deleteThongBaoList(ids: string[]): Promise<void> {
  if (isApi()) {
    await Promise.all(ids.map((id) => apiDeleteThongBao(id)));
    return;
  }
  await repo.remove(ids);
}
