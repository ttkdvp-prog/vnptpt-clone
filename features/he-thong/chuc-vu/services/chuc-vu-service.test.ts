import { describe, expect, it } from 'vitest';
import {
  createPosition,
  updatePosition,
  updatePositionStatus,
  deletePositions,
  getPositions,
} from './chuc-vu-service';

describe('chuc-vu-service (mock mode)', () => {
  it('createPosition tạo mới và enrich ten_phong_ban', async () => {
    const created = await createPosition({
      ma_chuc_vu: 'TEST-CREATE',
      ten_chuc_vu: 'Chức vụ test tạo mới',
      cap_bac: 4,
      phong_ban_id: 'dep-1',
      mo_ta: null,
      thu_tu: 999,
      trang_thai: 'Đang hoạt động',
    });

    expect(created.id).toBeTruthy();
    expect(created.ma_chuc_vu).toBe('TEST-CREATE');
    expect(created.ten_phong_ban).toBe('Phòng Kỹ thuật');
  });

  it('updatePosition sửa đúng bản ghi đã tạo', async () => {
    const created = await createPosition({
      ma_chuc_vu: 'TEST-UPDATE',
      ten_chuc_vu: 'Trước khi sửa',
      cap_bac: 4,
      phong_ban_id: null,
      mo_ta: null,
      thu_tu: 998,
      trang_thai: 'Đang hoạt động',
    });

    const updated = await updatePosition(created.id, {
      ma_chuc_vu: 'TEST-UPDATE',
      ten_chuc_vu: 'Sau khi sửa',
      cap_bac: 3,
      phong_ban_id: null,
      mo_ta: null,
      thu_tu: 998,
      trang_thai: 'Đang hoạt động',
    });

    expect(updated.ten_chuc_vu).toBe('Sau khi sửa');
    expect(updated.cap_bac).toBe(3);
  });

  it('updatePosition báo lỗi khi id không tồn tại', async () => {
    await expect(
      updatePosition('khong-ton-tai', {
        ma_chuc_vu: 'X',
        ten_chuc_vu: 'X',
        cap_bac: null,
        phong_ban_id: null,
        mo_ta: null,
        thu_tu: 0,
        trang_thai: 'Đang hoạt động',
      }),
    ).rejects.toThrow();
  });

  it('updatePositionStatus đổi trạng thái nhiều bản ghi cùng lúc', async () => {
    const a = await createPosition({
      ma_chuc_vu: 'TEST-BULK-A',
      ten_chuc_vu: 'Bulk A',
      cap_bac: 4,
      phong_ban_id: null,
      mo_ta: null,
      thu_tu: 997,
      trang_thai: 'Đang hoạt động',
    });
    const b = await createPosition({
      ma_chuc_vu: 'TEST-BULK-B',
      ten_chuc_vu: 'Bulk B',
      cap_bac: 4,
      phong_ban_id: null,
      mo_ta: null,
      thu_tu: 996,
      trang_thai: 'Đang hoạt động',
    });

    await updatePositionStatus([a.id, b.id], 'Ngừng hoạt động');

    const all = await getPositions();
    const updatedA = all.find((p) => p.id === a.id);
    const updatedB = all.find((p) => p.id === b.id);
    expect(updatedA?.trang_thai).toBe('Ngừng hoạt động');
    expect(updatedB?.trang_thai).toBe('Ngừng hoạt động');
  });

  it('deletePositions xóa được nhiều bản ghi', async () => {
    const created = await createPosition({
      ma_chuc_vu: 'TEST-DELETE',
      ten_chuc_vu: 'Sẽ bị xóa',
      cap_bac: 4,
      phong_ban_id: null,
      mo_ta: null,
      thu_tu: 995,
      trang_thai: 'Đang hoạt động',
    });

    await deletePositions([created.id]);

    const all = await getPositions();
    expect(all.find((p) => p.id === created.id)).toBeUndefined();
  });
});
