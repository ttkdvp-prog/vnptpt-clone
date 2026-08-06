import { describe, expect, it } from 'vitest';
import {
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartments,
} from './phong-ban-service';

describe('phong-ban-service (mock mode)', () => {
  it('createDepartment tạo phòng ban gốc (không cha) đúng cấp độ 1', async () => {
    const created = await createDepartment({
      ma_phong_ban: 'TEST-DEPT-ROOT',
      ten_phong_ban: 'Phòng test gốc',
      mo_ta: '',
      cha_id: null,
      trang_thai: 'Đang hoạt động',
      thu_tu: 999,
    });

    expect(created.id).toBeTruthy();
    expect(created.cap_do).toBe(1);
    expect(created.duong_dan).toBe(`/${created.id}`);
  });

  it('createDepartment tạo phòng con kế thừa đường dẫn/cấp độ từ cha', async () => {
    const parent = await createDepartment({
      ma_phong_ban: 'TEST-DEPT-PARENT',
      ten_phong_ban: 'Phòng test cha',
      mo_ta: '',
      cha_id: null,
      trang_thai: 'Đang hoạt động',
      thu_tu: 998,
    });
    const child = await createDepartment({
      ma_phong_ban: 'TEST-DEPT-CHILD',
      ten_phong_ban: 'Phòng test con',
      mo_ta: '',
      cha_id: parent.id,
      trang_thai: 'Đang hoạt động',
      thu_tu: 997,
    });

    expect(child.cap_do).toBe(2);
    expect(child.duong_dan).toBe(`${parent.duong_dan}/${child.id}`);
  });

  it('updateDepartment sửa đúng bản ghi đã tạo', async () => {
    const created = await createDepartment({
      ma_phong_ban: 'TEST-DEPT-UPDATE',
      ten_phong_ban: 'Trước khi sửa',
      mo_ta: '',
      cha_id: null,
      trang_thai: 'Đang hoạt động',
      thu_tu: 996,
    });

    const updated = await updateDepartment(created.id, {
      ma_phong_ban: 'TEST-DEPT-UPDATE',
      ten_phong_ban: 'Sau khi sửa',
      mo_ta: '',
      cha_id: null,
      trang_thai: 'Đang hoạt động',
      thu_tu: 996,
    });

    expect(updated.ten_phong_ban).toBe('Sau khi sửa');
  });

  it('deleteDepartment báo lỗi khi phòng ban còn phòng con', async () => {
    const parent = await createDepartment({
      ma_phong_ban: 'TEST-DEPT-HASCHILD',
      ten_phong_ban: 'Phòng có con',
      mo_ta: '',
      cha_id: null,
      trang_thai: 'Đang hoạt động',
      thu_tu: 995,
    });
    await createDepartment({
      ma_phong_ban: 'TEST-DEPT-ISCHILD',
      ten_phong_ban: 'Phòng con',
      mo_ta: '',
      cha_id: parent.id,
      trang_thai: 'Đang hoạt động',
      thu_tu: 994,
    });

    await expect(deleteDepartment(parent.id)).rejects.toThrow();
  });

  it('deleteDepartment xóa được phòng ban không có con', async () => {
    const created = await createDepartment({
      ma_phong_ban: 'TEST-DEPT-DELETE',
      ten_phong_ban: 'Sẽ bị xóa',
      mo_ta: '',
      cha_id: null,
      trang_thai: 'Đang hoạt động',
      thu_tu: 993,
    });

    await deleteDepartment(created.id);

    const all = await getDepartments();
    expect(all.find((d) => d.id === created.id)).toBeUndefined();
  });
});
