/**
 * Bẫy hồi quy cho tài liệu hồ sơ render ở server.
 *
 * Hai lỗi từng làm hỏng tính năng và phải không bao giờ quay lại:
 * 1. màu `oklch()` / `color-mix(in oklab, …)` lọt vào vùng tài liệu (html2canvas throw, PDF chết)
 * 2. `txt()` chưa register string module ở server → in ra nguyên key thay vì nhãn tiếng Việt
 */
import { describe, expect, it } from 'vitest';
import {
  buildEmployeeProfileFullHTML,
  buildServerProfileModel,
  formatServerDateTime,
} from '@/features/he-thong/nhan-vien/utils/employee-profile-document';
import type { CompanyDocInfo } from '@/features/he-thong/nhan-vien/core/profile-document-model';
import type { Employee } from '@/features/he-thong/nhan-vien/core/types';

const COMPANY: CompanyDocInfo = {
  companyName: 'Công ty TNHH An Hưng Thịnh',
  address: 'Số 1 Đường Mẫu, Quận 1',
  email: 'contact@company.vn',
  phone: '028 1234 5678',
  logo: null,
};

const EMPLOYEE: Employee = {
  id: '123',
  ho_ten: 'Nguyễn Văn Ánh Dương',
  email: 'duong@company.vn',
  so_dien_thoai: '0901234567',
  phong_ban_id: '2',
  chuc_vu_id: '5',
  ten_phong_ban: 'Phòng Kinh doanh',
  ten_chuc_vu: 'Trưởng phòng',
  gioi_tinh: 'Nam',
  ngay_sinh: '1990-04-15',
  dia_chi_thuong_tru: '123 Nguyễn Thị Minh Khai, Quận 1',
  trang_thai: 'Đang làm việc',
};

async function buildHtml(): Promise<string> {
  const model = buildServerProfileModel(
    EMPLOYEE,
    COMPANY,
    formatServerDateTime('2026-08-05T07:20:00.000Z'),
  );
  return buildEmployeeProfileFullHTML(model);
}

describe('buildEmployeeProfileFullHTML', () => {
  it('không chứa màu oklch / oklab / color-mix', async () => {
    const html = await buildHtml();
    expect(html).not.toMatch(/oklch|oklab|color-mix/i);
  });

  it('không chứa class màu của Tailwind trong vùng tài liệu', async () => {
    const html = await buildHtml();
    expect(html).not.toMatch(/class="[^"]*(?:text-gray-|bg-gray-|border-gray-|bg-primary)/);
  });

  it('giải hết key txt() — không in ra key thô', async () => {
    const html = await buildHtml();
    expect(html).not.toMatch(/employee\.(pdf|detail|status)/);
    expect(html).toContain('HỒ SƠ NHÂN SỰ');
    expect(html).toContain('THÔNG TIN CÁ NHÂN');
  });

  it('khai @page A4 đúng lề 15/15/15/20mm và chỉ một lần', async () => {
    const html = await buildHtml();
    expect(html.match(/@page/g)).toHaveLength(1);
    expect(html).toContain('margin: 15mm 15mm 15mm 20mm');
  });

  it('dựng khối chữ ký bằng table, không dùng flexbox (Word không hỗ trợ)', async () => {
    const html = await buildHtml();
    expect(html).toContain('epdoc-sign-footer');
    expect(html).not.toMatch(/epdoc-sign-footer[^>]*style="[^"]*flex/);
    expect(html).not.toMatch(/\.epdoc-sign-footer\s*\{[^}]*display:\s*flex/);
  });

  it('vẽ ô dán ảnh 3×4 khi nhân viên chưa có ảnh', async () => {
    const html = await buildHtml();
    expect(html).toContain('epdoc-photo-placeholder');
  });

  it('không khai lại width 210mm trong @media print (gây cắt mép phải)', async () => {
    const html = await buildHtml();
    const printBlock = /@media print\s*\{[\s\S]*?\n\}/.exec(html)?.[0] ?? '';
    expect(printBlock).not.toContain('210mm');
  });
});
