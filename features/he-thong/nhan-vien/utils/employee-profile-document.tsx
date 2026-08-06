/**
 * Dựng tài liệu "Hồ sơ nhân sự" ở phía server (cho PDF Puppeteer và .docx).
 *
 * Không dựng chuỗi HTML thủ công nữa: render chính `EmployeeProfileDocument` bằng
 * `renderToStaticMarkup` → preview trên web và tệp tải về dùng đúng MỘT component,
 * không thể lệch bố cục. `react-dom/server` chỉ nằm ở nhánh server nên không vào bundle client.
 */
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { txt } from '@/lib/text';
import { registerModuleStrings } from '@/lib/text/register-module-strings';
import {
  buildPrintDocumentCSS,
  PRINT_DEFAULT_FONT_STACK,
} from '@/lib/print-document/print-styles';
import { buildEmbeddedInterFontFaceCSS } from '@/lib/print-document/server-fonts';
import EmployeeProfileDocument from '../components/EmployeeProfileDocument';
import {
  buildEmployeeProfileDocModel,
  type CompanyDocInfo,
  type ProfileDocModel,
} from '../core/profile-document-model';
import type { Employee } from '../core/types';
import { employee as employeeStrings } from '../text';

dayjs.extend(utc);
dayjs.extend(timezone);

const SERVER_TZ = process.env.APP_TIMEZONE?.trim() || 'Asia/Ho_Chi_Minh';

let stringsRegistered = false;

/**
 * `txt()` chỉ tra được key module sau khi register (client làm việc này ở app bootstrap).
 * Thiếu bước này server sẽ trả về nguyên key thay vì nhãn tiếng Việt.
 */
export function ensureEmployeeStrings(): void {
  if (stringsRegistered) return;
  registerModuleStrings('employee', employeeStrings);
  stringsRegistered = true;
}

function formatServerDate(iso: string): string {
  return dayjs(iso).tz(SERVER_TZ).format('DD/MM/YYYY');
}

export function formatServerDateTime(value: Date | string): string {
  return dayjs(value).tz(SERVER_TZ).format('DD/MM/YYYY HH:mm');
}

/** Model hồ sơ dựng ở server (đã register string + formatter theo giờ VN). */
export function buildServerProfileModel(
  emp: Employee,
  company: CompanyDocInfo,
  printedAt: string,
): ProfileDocModel {
  ensureEmployeeStrings();
  return buildEmployeeProfileDocModel(emp, company, printedAt, { date: formatServerDate });
}

/**
 * HTML A4 hoàn chỉnh để Chromium render ra PDF.
 *
 * `react-dom/server` phải nạp động: Next chặn import tĩnh của nó trong graph của
 * Route Handler ("You're importing a component that imports react-dom/server").
 */
export async function buildEmployeeProfileFullHTML(model: ProfileDocModel): Promise<string> {
  ensureEmployeeStrings();
  const [{ renderToStaticMarkup }, fontFaceCss] = await Promise.all([
    import('react-dom/server'),
    buildEmbeddedInterFontFaceCSS(),
  ]);
  const body = renderToStaticMarkup(
    <EmployeeProfileDocument model={model} photoPlaceholder={txt('employee.pdf.photoPlaceholder')} />,
  );
  const css = buildPrintDocumentCSS({
    fontStack: PRINT_DEFAULT_FONT_STACK,
    includePage: true,
  });

  return `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><title>${escapeTitle(
    `${model.heading.title} - ${model.heading.name}`,
  )}</title><style>${fontFaceCss}
${css}</style></head><body>${body}</body></html>`;
}

function escapeTitle(value: string): string {
  return value.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
