import { describe, expect, it } from 'vitest';
import {
  GUIDE_SECTION_IDS,
  guidePathToModulePath,
  modulePathToGuideKey,
  getModuleGuide,
} from '@/lib/guide';

const MODULE_PATHS = [
  '/he-thong/nhan-vien',
  '/he-thong/thong-tin-cong-ty',
  '/he-thong/phan-quyen',
] as const;

const REQUIRED_SECTIONS = ['intro', ...GUIDE_SECTION_IDS] as const;

describe('guide helpers', () => {
  it('maps module path to guide key', () => {
    expect(modulePathToGuideKey('/he-thong/nhan-vien')).toBe('heThong_nhanVien');
    expect(modulePathToGuideKey('/he-thong/thong-tin-cong-ty')).toBe(
      'heThong_thongTinCongTy',
    );
  });

  it('strips huong-dan suffix', () => {
    expect(guidePathToModulePath('/he-thong/nhan-vien/huong-dan')).toBe('/he-thong/nhan-vien');
    expect(guidePathToModulePath('/he-thong/phan-quyen/huong-dan')).toBe(
      '/he-thong/phan-quyen',
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
    expect(getModuleGuide('/he-thong/khong-ton-tai')).toBeUndefined();
  });
});
