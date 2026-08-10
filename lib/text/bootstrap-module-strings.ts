/**
 * Register feature module UI strings before app render.
 * Import order: this file must load before any txt() usage from feature keys.
 */
import { registerModuleStrings } from '@/lib/text/register-module-strings';
import { employee } from '@/features/he-thong/nhan-vien/text';
import { permission } from '@/features/he-thong/phan-quyen/text';
import { company } from '@/features/he-thong/thong-tin-cong-ty/text';
import { congViecTaiLieu } from '@/features/cong-viec/tai-lieu/text';
import { congViec } from '@/features/cong-viec/danh-sach-cong-viec/text';

registerModuleStrings('employee', employee);
registerModuleStrings('permission', permission);
registerModuleStrings('company', company);
registerModuleStrings('congViecTaiLieu', congViecTaiLieu);
registerModuleStrings('congViec', congViec);

export {
  employee,
  permission,
  company,
  congViecTaiLieu,
  congViec,
};
