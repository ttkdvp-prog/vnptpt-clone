import { describe, expect, it } from 'vitest';
import {
  GUIDE_SECTION_IDS,
  guidePathToModulePath,
  modulePathToGuideKey,
  getModuleGuide,
} from '@/lib/guide';

const MODULE_PATHS = [
  '/he-thong/nhan-vien',
  '/he-thong/phong-ban',
  '/he-thong/chuc-vu',
  '/he-thong/thong-tin-cong-ty',
  '/he-thong/phan-quyen',
  '/kinh-doanh/khach-hang',
  '/kinh-doanh/nguoi-lien-he',
  '/kinh-doanh/thiet-lap-khach-hang',
  '/san-xuat/danh-sach-market-in',
] as const;

const REQUIRED_SECTIONS = ['intro', ...GUIDE_SECTION_IDS] as const;

describe('guide helpers', () => {
  it('maps module path to guide key', () => {
    expect(modulePathToGuideKey('/he-thong/nhan-vien')).toBe('heThong_nhanVien');
    expect(modulePathToGuideKey('/kinh-doanh/thiet-lap-khach-hang')).toBe(
      'kinhDoanh_thietLapKhachHang',
    );
    expect(modulePathToGuideKey('/san-xuat/danh-sach-market-in')).toBe(
      'sanXuat_danhSachMarketIn',
    );
  });

  it('strips huong-dan suffix', () => {
    expect(guidePathToModulePath('/he-thong/nhan-vien/huong-dan')).toBe('/he-thong/nhan-vien');
    expect(guidePathToModulePath('/san-xuat/danh-sach-market-in/huong-dan')).toBe(
      '/san-xuat/danh-sach-market-in',
    );
  });

  it.each(MODULE_PATHS)('loads full guide content for %s', (path) => {
    const guide = getModuleGuide(path);
    expect(guide).toBeDefined();
    for (const section of REQUIRED_SECTIONS) {
      expect(guide?.[section]?.trim(), `${path} missing ${section}`).toBeTruthy();
    }
  });

  it('returns undefined for modules without guide', () => {
    expect(getModuleGuide('/san-xuat/thong-so-van-hanh-may-thoi')).toBeUndefined();
  });
});
