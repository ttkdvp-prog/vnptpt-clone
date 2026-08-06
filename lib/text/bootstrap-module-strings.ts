/**
 * Register feature module UI strings before app render.
 * Import order: this file must load before any txt() usage from feature keys.
 */
import { registerModuleStrings } from '@/lib/text/register-module-strings';
import { employee } from '@/features/he-thong/nhan-vien/text';
import { department } from '@/features/he-thong/phong-ban/text';
import { position } from '@/features/he-thong/chuc-vu/text';
import { permission } from '@/features/he-thong/phan-quyen/text';
import { company } from '@/features/he-thong/thong-tin-cong-ty/text';
import { customerSettings } from '@/features/kinh-doanh/thiet-lap-khach-hang/text';
import { customer } from '@/features/kinh-doanh/khach-hang/text';
import { contact } from '@/features/kinh-doanh/nguoi-lien-he/text';
import { printMarket } from '@/features/san-xuat/danh-sach-market-in/text';
import { documentSettings } from '@/features/hanh-chinh/thiet-lap-tai-lieu/text';
import { payrollSettings } from '@/features/hanh-chinh/thiet-lap-cong-luong/text';
import { adminForm } from '@/features/hanh-chinh/phieu-hanh-chinh/text';
import { document } from '@/features/hanh-chinh/danh-sach-tai-lieu/text';
import { documentStats } from '@/features/hanh-chinh/thong-ke-tai-lieu/text';
import { adminFormStats } from '@/features/hanh-chinh/thong-ke-phieu-hanh-chinh/text';
import { contract } from '@/features/hanh-chinh/hop-dong/text';
import { announcement } from '@/features/hanh-chinh/thong-bao/text';
import { overview } from '@/features/tong-quan/text';

registerModuleStrings('employee', employee);
registerModuleStrings('department', department);
registerModuleStrings('position', position);
registerModuleStrings('permission', permission);
registerModuleStrings('company', company);
registerModuleStrings('customerSettings', customerSettings);
registerModuleStrings('customer', customer);
registerModuleStrings('contact', contact);
registerModuleStrings('printMarket', printMarket);
registerModuleStrings('documentSettings', documentSettings);
registerModuleStrings('payrollSettings', payrollSettings);
registerModuleStrings('adminForm', adminForm);
registerModuleStrings('document', document);
registerModuleStrings('documentStats', documentStats);
registerModuleStrings('adminFormStats', adminFormStats);
registerModuleStrings('contract', contract);
registerModuleStrings('announcement', announcement);
registerModuleStrings('overview', overview);

export {
  employee,
  department,
  position,
  permission,
  company,
  customerSettings,
  customer,
  contact,
  printMarket,
  documentSettings,
  payrollSettings,
  adminForm,
  document,
  documentStats,
  adminFormStats,
  contract,
  announcement,
  overview,
};
