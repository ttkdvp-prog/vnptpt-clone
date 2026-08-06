/**
 * Model của tài liệu "Hồ sơ nhân sự" — hàm thuần, KHÔNG đọc store, KHÔNG chạm DOM,
 * KHÔNG gọi `new Date()`. Đây là nguồn dữ liệu duy nhất cho cả 4 kênh:
 * preview (React) · in trình duyệt · PDF (render ở server) · .docx · Excel.
 */
import { txt } from '@/lib/text';
import { formatEmployeeCapBacLabel } from '../utils/build-employee-position-options';
import { GENDER_BADGE_CONFIG, STATUS_BADGE_CONFIG } from './constants';
import type { Employee } from './types';

/** Một dòng thông tin. `wide` = chiếm cả 2 cột của lưới (địa chỉ, lý do nghỉ, …) */
export interface ProfileDocRow {
  label: string;
  value: string;
  wide?: boolean;
}

export interface ProfileDocSection {
  key: string;
  title: string;
  rows: ProfileDocRow[];
}

/** Thông tin công ty cần cho letterhead — tách khỏi `CompanyInfo` của store để dùng được ở server */
export interface CompanyDocInfo {
  companyName: string;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  logo?: string | null;
}

export interface ProfileDocModel {
  company: CompanyDocInfo;
  /** Ảnh chân dung (URL tuyệt đối hoặc data URL). Thiếu ảnh → component vẽ ô dán ảnh 3×4 */
  photo?: string | null;
  heading: {
    title: string;
    name: string;
    codeLabel: string;
    code: string;
    role: string;
  };
  sections: ProfileDocSection[];
  signature: { key: string; title: string; hint: string }[];
  printedAtLabel: string;
  printedAt: string;
}

export interface ProfileDocFormatters {
  /** Format ngày ISO → chuỗi hiển thị. Client truyền `formatDate` của app, server truyền bản Asia/Ho_Chi_Minh */
  date: (iso: string) => string;
}

export interface BuildProfileDocOptions {
  /** `true` → giữ dòng trống và điền `—` (Excel dùng để đối chiếu dữ liệu). Default `false` */
  includeEmpty?: boolean;
}

const EMPTY_PLACEHOLDER = '—';

function badgeLabel(value: unknown, config: Record<string, { label: string }>): string {
  if (value == null || value === '') return '';
  return config[String(value)]?.label ?? String(value);
}

function text(value: unknown): string {
  if (value == null) return '';
  const s = String(value).trim();
  return s;
}

/** Dựng section, bỏ dòng rỗng (và bỏ luôn section nếu rỗng hết) khi `includeEmpty` là false */
function section(
  key: string,
  title: string,
  rows: ProfileDocRow[],
  includeEmpty: boolean,
): ProfileDocSection[] {
  if (includeEmpty) {
    return [
      {
        key,
        title,
        rows: rows.map((r) => ({ ...r, value: r.value || EMPTY_PLACEHOLDER })),
      },
    ];
  }
  const kept = rows.filter((r) => r.value !== '');
  return kept.length ? [{ key, title, rows: kept }] : [];
}

/**
 * Dựng model hồ sơ từ bản ghi nhân viên.
 * Giữ nguyên toàn bộ field map cũ của `buildEmployeeProfileSections`, chỉ tổ chức lại
 * thành 8 section và tách họ tên / mã NV lên khối định danh ở đầu tài liệu.
 */
export function buildEmployeeProfileDocModel(
  emp: Employee,
  company: CompanyDocInfo,
  printedAt: string,
  formatters: ProfileDocFormatters,
  opts: BuildProfileDocOptions = {},
): ProfileDocModel {
  const includeEmpty = opts.includeEmpty ?? false;
  const date = (iso: string | null | undefined): string => (iso ? formatters.date(iso) : '');

  const roleParts = [emp.ten_chuc_vu, emp.ten_phong_ban].map(text).filter(Boolean);
  const status = badgeLabel(emp.trang_thai, STATUS_BADGE_CONFIG);
  const role = [roleParts.join(' — '), status].filter(Boolean).join(' · ');

  const sections: ProfileDocSection[] = [
    ...section(
      'personal',
      txt('employee.pdf.personalInfo'),
      [
        { label: txt('employee.detail.gender'), value: badgeLabel(emp.gioi_tinh, GENDER_BADGE_CONFIG) },
        { label: txt('employee.detail.birthDate'), value: date(emp.ngay_sinh) },
        { label: txt('employee.detail.nationality'), value: text(emp.quoc_tich) },
        { label: txt('employee.detail.hometown'), value: text(emp.que_quan) },
        { label: txt('employee.detail.idCard'), value: text(emp.so_cccd) },
        { label: txt('employee.detail.idIssueDate'), value: date(emp.ngay_cap_cccd) },
        { label: txt('employee.detail.idIssuePlace'), value: text(emp.noi_cap_cccd), wide: true },
      ],
      includeEmpty,
    ),
    ...section(
      'family',
      txt('employee.pdf.familyInfo'),
      [
        { label: txt('employee.detail.maritalStatus'), value: text(emp.tinh_trang_hon_nhan) },
        { label: txt('employee.detail.ethnicity'), value: text(emp.dan_toc) },
        { label: txt('employee.detail.religion'), value: text(emp.ton_giao) },
      ],
      includeEmpty,
    ),
    ...section(
      'address',
      txt('employee.pdf.address'),
      [
        { label: txt('employee.detail.permanentAddress'), value: text(emp.dia_chi_thuong_tru), wide: true },
        { label: txt('employee.detail.currentAddress'), value: text(emp.dia_chi_hien_tai), wide: true },
      ],
      includeEmpty,
    ),
    ...section(
      'work',
      txt('employee.pdf.workInfo'),
      [
        { label: txt('employee.detail.position'), value: text(emp.ten_chuc_vu) },
        { label: txt('employee.detail.department'), value: text(emp.ten_phong_ban) },
        { label: txt('employee.detail.division'), value: text(emp.ten_bo_phan) },
        { label: txt('employee.detail.level'), value: formatEmployeeCapBacLabel(emp.cap_bac) },
        { label: txt('employee.status'), value: status },
        { label: txt('employee.detail.hireDate'), value: date(emp.ngay_vao_lam) },
        { label: txt('employee.detail.officialDate'), value: date(emp.ngay_chinh_thuc) },
        { label: txt('employee.detail.resignationDate'), value: date(emp.ngay_nghi_viec) },
        { label: txt('employee.detail.resignationReason'), value: text(emp.ly_do_nghi), wide: true },
      ],
      includeEmpty,
    ),
    ...section(
      'contact',
      txt('employee.pdf.contactInfo'),
      [
        { label: txt('employee.detail.workEmail'), value: text(emp.email) },
        { label: txt('employee.detail.personalEmail'), value: text(emp.email_ca_nhan) },
        { label: txt('employee.detail.phone'), value: text(emp.so_dien_thoai) },
        { label: txt('employee.detail.loginName'), value: text(emp.ten_dang_nhap) },
        { label: txt('employee.detail.emergencyContact'), value: text(emp.nguoi_lien_he_khan) },
        { label: txt('employee.detail.emergencyPhone'), value: text(emp.sdt_khan) },
        { label: txt('employee.detail.relationship'), value: text(emp.moi_quan_he) },
      ],
      includeEmpty,
    ),
    ...section(
      'education',
      txt('employee.pdf.educationInfo'),
      [
        { label: txt('employee.detail.educationLevel'), value: text(emp.trinh_do) },
        { label: txt('employee.detail.major'), value: text(emp.chuyen_nganh) },
        { label: txt('employee.detail.school'), value: text(emp.truong), wide: true },
      ],
      includeEmpty,
    ),
    ...section(
      'financial',
      txt('employee.pdf.financialInfo'),
      [
        { label: txt('employee.detail.bankAccount'), value: text(emp.so_tai_khoan) },
        { label: txt('employee.detail.bankAccountHolder'), value: text(emp.ten_chu_tai_khoan) },
        { label: txt('employee.detail.bankName'), value: text(emp.ngan_hang) },
        { label: txt('employee.detail.bankBranch'), value: text(emp.chi_nhanh) },
      ],
      includeEmpty,
    ),
    ...section(
      'insurance',
      txt('employee.pdf.insuranceInfo'),
      [
        { label: txt('employee.detail.socialInsurance'), value: text(emp.so_so_bhxh) },
        { label: txt('employee.detail.healthInsurance'), value: text(emp.so_bhyt) },
        { label: txt('employee.detail.taxId'), value: text(emp.ma_so_thue_ca_nhan) },
      ],
      includeEmpty,
    ),
  ];

  return {
    company,
    photo: emp.anh_dai_dien ?? null,
    heading: {
      title: txt('employee.pdf.title'),
      name: emp.ho_ten,
      codeLabel: txt('employee.pdf.code'),
      code: emp.id,
      role,
    },
    sections,
    signature: [
      { key: 'preparer', title: txt('employee.pdf.signPreparer'), hint: txt('employee.pdf.signHint') },
      { key: 'reviewer', title: txt('employee.pdf.signReviewer'), hint: txt('employee.pdf.signHint') },
      { key: 'related', title: txt('employee.pdf.signRelated'), hint: txt('employee.pdf.signHint') },
      { key: 'approver', title: txt('employee.pdf.signApprover'), hint: txt('employee.pdf.signHint') },
    ],
    printedAtLabel: txt('employee.pdf.printedAt'),
    printedAt,
  };
}

/** Ghép các dòng thành cặp cho lưới 2 cột; dòng `wide` luôn đứng riêng một hàng. */
export function pairProfileRows(rows: ProfileDocRow[]): ProfileDocRow[][] {
  const out: ProfileDocRow[][] = [];
  let pending: ProfileDocRow | null = null;

  for (const row of rows) {
    if (row.wide) {
      if (pending) {
        out.push([pending]);
        pending = null;
      }
      out.push([row]);
      continue;
    }
    if (pending) {
      out.push([pending, row]);
      pending = null;
    } else {
      pending = row;
    }
  }
  if (pending) out.push([pending]);
  return out;
}
