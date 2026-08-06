import { insertRow, readTable, updateRowById } from '@/lib/sheets/generic-repository';
import { SHEET_TABS } from '@/lib/sheets/config';

const TAB = SHEET_TABS.var_cong_ty;
const COMPANY_ID = 1;

export type CompanyRow = {
  id: number;
  ten_ung_dung: string;
  mo_ta_ung_dung: string | null;
  logo: string | null;
  ten_cong_ty: string;
  ma_so_thue: string;
  dia_chi: string | null;
  so_dien_thoai: string | null;
  email: string | null;
  website: string | null;
  nguoi_dai_dien: string | null;
  chuc_vu_nguoi_dai_dien: string | null;
  dia_diem_ky: string | null;
  tg_tao: Date;
  tg_cap_nhat: Date;
};

function fromSheetRow(row: Record<string, string>): CompanyRow {
  return {
    id: Number(row.id),
    ten_ung_dung: row.ten_ung_dung ?? '',
    mo_ta_ung_dung: row.mo_ta_ung_dung || null,
    logo: row.logo || null,
    ten_cong_ty: row.ten_cong_ty ?? '',
    ma_so_thue: row.ma_so_thue ?? '',
    dia_chi: row.dia_chi || null,
    so_dien_thoai: row.so_dien_thoai || null,
    email: row.email || null,
    website: row.website || null,
    nguoi_dai_dien: row.nguoi_dai_dien || null,
    chuc_vu_nguoi_dai_dien: row.chuc_vu_nguoi_dai_dien || null,
    dia_diem_ky: row.dia_diem_ky || null,
    tg_tao: row.tg_tao ? new Date(row.tg_tao) : new Date(0),
    tg_cap_nhat: row.tg_cap_nhat ? new Date(row.tg_cap_nhat) : new Date(0),
  };
}

export function mapCompanyRow(row: CompanyRow) {
  return {
    id: row.id,
    ten_ung_dung: row.ten_ung_dung,
    mo_ta_ung_dung: row.mo_ta_ung_dung,
    logo: row.logo,
    ten_cong_ty: row.ten_cong_ty,
    ma_so_thue: row.ma_so_thue,
    dia_chi: row.dia_chi,
    so_dien_thoai: row.so_dien_thoai,
    email: row.email,
    website: row.website,
    nguoi_dai_dien: row.nguoi_dai_dien,
    chuc_vu_nguoi_dai_dien: row.chuc_vu_nguoi_dai_dien,
    dia_diem_ky: row.dia_diem_ky,
    tg_tao: row.tg_tao.toISOString(),
    tg_cap_nhat: row.tg_cap_nhat.toISOString(),
  };
}

export function mapCompanyBranding(row: CompanyRow | null): {
  appName: string;
  appDescription: string;
  appLogo: string | null;
} {
  return {
    appName: row?.ten_ung_dung ?? '',
    appDescription: row?.mo_ta_ung_dung ?? '',
    appLogo: row?.logo ?? null,
  };
}

export function emptyCompanyDefaults() {
  const now = new Date().toISOString();
  return {
    id: COMPANY_ID,
    ten_ung_dung: '',
    mo_ta_ung_dung: null as string | null,
    logo: null as string | null,
    ten_cong_ty: '',
    ma_so_thue: '',
    dia_chi: null as string | null,
    so_dien_thoai: null as string | null,
    email: null as string | null,
    website: null as string | null,
    nguoi_dai_dien: null as string | null,
    chuc_vu_nguoi_dai_dien: null as string | null,
    dia_diem_ky: null as string | null,
    tg_tao: now,
    tg_cap_nhat: now,
  };
}

export async function findCompany(): Promise<CompanyRow | null> {
  const { rows } = await readTable(TAB);
  const row = rows.find((r) => Number(r.id) === COMPANY_ID);
  return row ? fromSheetRow(row) : null;
}

export interface CompanyUpsertInput {
  ten_ung_dung: string;
  mo_ta_ung_dung?: string | null;
  logo?: string | null;
  ten_cong_ty: string;
  ma_so_thue: string;
  dia_chi?: string | null;
  so_dien_thoai?: string | null;
  email?: string | null;
  website?: string | null;
  nguoi_dai_dien?: string | null;
  chuc_vu_nguoi_dai_dien?: string | null;
  dia_diem_ky?: string | null;
}

export async function upsertCompany(input: CompanyUpsertInput): Promise<CompanyRow> {
  const now = new Date().toISOString();
  const existing = await findCompany();
  const values: Record<string, string> = {
    id: String(COMPANY_ID),
    ten_ung_dung: input.ten_ung_dung,
    ten_cong_ty: input.ten_cong_ty,
    ma_so_thue: input.ma_so_thue,
    tg_cap_nhat: now,
  };
  if (input.mo_ta_ung_dung !== undefined) values.mo_ta_ung_dung = input.mo_ta_ung_dung ?? '';
  if (input.logo !== undefined) values.logo = input.logo ?? '';
  if (input.dia_chi !== undefined) values.dia_chi = input.dia_chi ?? '';
  if (input.so_dien_thoai !== undefined) values.so_dien_thoai = input.so_dien_thoai ?? '';
  if (input.email !== undefined) values.email = input.email ?? '';
  if (input.website !== undefined) values.website = input.website ?? '';
  if (input.nguoi_dai_dien !== undefined) values.nguoi_dai_dien = input.nguoi_dai_dien ?? '';
  if (input.chuc_vu_nguoi_dai_dien !== undefined)
    values.chuc_vu_nguoi_dai_dien = input.chuc_vu_nguoi_dai_dien ?? '';
  if (input.dia_diem_ky !== undefined) values.dia_diem_ky = input.dia_diem_ky ?? '';

  if (existing) {
    await updateRowById(TAB, COMPANY_ID, values);
  } else {
    await insertRow(TAB, { ...values, tg_tao: now });
  }
  const row = await findCompany();
  if (!row) throw new Error('Failed to upsert company row');
  return row;
}
