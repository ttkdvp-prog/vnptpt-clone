/** Google Sheets backend config — one tab per Prisma model (`prisma/schema.prisma` kept as column reference). */

export const SHEETS_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID ?? '';
export const SHEETS_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? '';
export const SHEETS_PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n');

export const SHEET_TABS = {
  var_nhan_vien: 'var_nhan_vien',
  var_cong_ty: 'var_cong_ty',
  var_phan_quyen: 'var_phan_quyen',
} as const;

export type SheetTab = (typeof SHEET_TABS)[keyof typeof SHEET_TABS];
