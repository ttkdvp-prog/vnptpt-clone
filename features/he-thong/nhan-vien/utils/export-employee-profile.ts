/**
 * Xuất hồ sơ nhân viên ra Excel (export dữ liệu thô — ngoại lệ so với bố cục A4).
 * PDF và .docx sinh ở server: `/nhan-vien/:id/ho-so.pdf` · `/ho-so.docx`.
 */
import type { Employee } from '../core/types';
import { formatDate, getTodayISODate } from '@/lib/utils';
import { txt } from '@/lib/text';
import { safeFileName } from '@/lib/print-document/file-name';
import {
  buildEmployeeProfileDocModel,
  type CompanyDocInfo,
} from '../core/profile-document-model';

export type EmployeeProfileExportFormat = 'pdf' | 'excel' | 'docx';

interface CompanyInfoLike {
  companyName: string;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  appLogo?: string | null;
}

function toCompanyDocInfo(info: CompanyInfoLike): CompanyDocInfo {
  return {
    companyName: info.companyName,
    address: info.address,
    email: info.email,
    phone: info.phone,
    logo: info.appLogo,
  };
}

/**
 * Xuất hồ sơ ra Excel — giữ cả field trống (`includeEmpty: true`) để dùng đối chiếu dữ liệu,
 * khác chủ ý so với bản in (bản in ẩn field trống).
 */
export async function exportEmployeeProfileExcel(
  emp: Employee,
  companyInfo: CompanyInfoLike,
  printedAt: string,
): Promise<void> {
  const XLSX = await import('xlsx');
  const model = buildEmployeeProfileDocModel(
    emp,
    toCompanyDocInfo(companyInfo),
    printedAt,
    { date: formatDate },
    { includeEmpty: true },
  );

  const rows: string[][] = [
    [model.company.companyName],
    ...(model.company.address ? [[txt('company.address'), model.company.address]] : []),
    ...(model.company.email ? [[txt('company.email'), model.company.email]] : []),
    ...(model.company.phone ? [[txt('company.phone'), model.company.phone]] : []),
    [],
    [model.heading.title],
    [model.heading.codeLabel, model.heading.code],
    [txt('employee.detail.fullName'), model.heading.name],
    ...(model.heading.role ? [['', model.heading.role]] : []),
    [],
  ];

  /** Dòng tiêu đề section — gộp 2 ô để đọc rõ trong Excel */
  const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    { s: { r: 5, c: 0 }, e: { r: 5, c: 1 } },
  ];

  for (const section of model.sections) {
    merges.push({ s: { r: rows.length, c: 0 }, e: { r: rows.length, c: 1 } });
    rows.push([section.title]);
    for (const row of section.rows) {
      rows.push([row.label, row.value]);
    }
    rows.push([]);
  }

  rows.push([model.printedAtLabel, model.printedAt]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 28 }, { wch: 52 }];
  ws['!merges'] = merges;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Ho so');
  XLSX.writeFile(wb, `Ho_so_${safeFileName(emp.ho_ten)}_${emp.id}_${getTodayISODate()}.xlsx`);
}
