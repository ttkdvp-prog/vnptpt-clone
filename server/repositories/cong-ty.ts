import { prisma } from '@/server/db';

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

/** Shell / PWA branding only — no tax/address/contact fields. */
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

/** Empty defaults — no side-effect create on GET. */
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
  return prisma.var_cong_ty.findUnique({ where: { id: COMPANY_ID } });
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
  const now = new Date();
  return prisma.var_cong_ty.upsert({
    where: { id: COMPANY_ID },
    create: {
      id: COMPANY_ID,
      ten_ung_dung: input.ten_ung_dung,
      mo_ta_ung_dung: input.mo_ta_ung_dung ?? null,
      logo: input.logo ?? null,
      ten_cong_ty: input.ten_cong_ty,
      ma_so_thue: input.ma_so_thue,
      dia_chi: input.dia_chi ?? null,
      so_dien_thoai: input.so_dien_thoai ?? null,
      email: input.email ?? null,
      website: input.website ?? null,
      nguoi_dai_dien: input.nguoi_dai_dien ?? null,
      chuc_vu_nguoi_dai_dien: input.chuc_vu_nguoi_dai_dien ?? null,
      dia_diem_ky: input.dia_diem_ky ?? null,
      tg_tao: now,
      tg_cap_nhat: now,
    },
    update: {
      ten_ung_dung: input.ten_ung_dung,
      ...(input.mo_ta_ung_dung !== undefined
        ? { mo_ta_ung_dung: input.mo_ta_ung_dung }
        : {}),
      ...(input.logo !== undefined ? { logo: input.logo } : {}),
      ten_cong_ty: input.ten_cong_ty,
      ma_so_thue: input.ma_so_thue,
      ...(input.dia_chi !== undefined ? { dia_chi: input.dia_chi } : {}),
      ...(input.so_dien_thoai !== undefined
        ? { so_dien_thoai: input.so_dien_thoai }
        : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.website !== undefined ? { website: input.website } : {}),
      ...(input.nguoi_dai_dien !== undefined
        ? { nguoi_dai_dien: input.nguoi_dai_dien }
        : {}),
      ...(input.chuc_vu_nguoi_dai_dien !== undefined
        ? { chuc_vu_nguoi_dai_dien: input.chuc_vu_nguoi_dai_dien }
        : {}),
      ...(input.dia_diem_ky !== undefined ? { dia_diem_ky: input.dia_diem_ky } : {}),
      tg_cap_nhat: now,
    },
  });
}
