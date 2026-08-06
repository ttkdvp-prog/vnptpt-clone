import { z } from 'zod';
import { txt } from '@/lib/text';

/** Hardcoded administrative voucher types (no DB master table). */
export const LOAI_PHIEU = [
  { ma_phieu: 'XN', nhom_phieu: 'Nghỉ phép', ten_phieu: 'Xin nghỉ' },
  { ma_phieu: 'NL', nhom_phieu: 'Nghỉ phép', ten_phieu: 'Nghỉ lễ' },
  { ma_phieu: 'CT', nhom_phieu: 'Công tác', ten_phieu: 'Công tác' },
  { ma_phieu: 'NB', nhom_phieu: 'Nghỉ phép', ten_phieu: 'Nghỉ bệnh' },
  { ma_phieu: 'DC', nhom_phieu: 'Điều chỉnh', ten_phieu: 'Điều chỉnh công' },
] as const;

export type MaLoaiPhieu = (typeof LOAI_PHIEU)[number]['ma_phieu'];

export type LoaiPhieuDef = (typeof LOAI_PHIEU)[number];

const MA_LOAI_PHIEU_VALUES = LOAI_PHIEU.map((t) => t.ma_phieu) as [
  MaLoaiPhieu,
  ...MaLoaiPhieu[],
];

export const maLoaiPhieuSchema = z.enum(MA_LOAI_PHIEU_VALUES, {
  message: txt('adminForm.validation.typeRequired'),
});

const BY_MA = new Map(LOAI_PHIEU.map((t) => [t.ma_phieu, t]));

export function getLoaiPhieuByMa(ma: string | null | undefined): LoaiPhieuDef | undefined {
  if (ma == null || ma.trim() === '') return undefined;
  return BY_MA.get(ma.trim().toUpperCase() as MaLoaiPhieu);
}

export function getTenLoaiPhieu(ma: string | null | undefined): string | null {
  return getLoaiPhieuByMa(ma)?.ten_phieu ?? null;
}

/** Select / filter options: value = ma_phieu. */
export function loaiPhieuSelectOptions(): { value: MaLoaiPhieu; label: string }[] {
  return LOAI_PHIEU.map((t) => ({
    value: t.ma_phieu,
    label: `${t.ma_phieu} — ${t.ten_phieu}`,
  }));
}

export function loaiPhieuFilterOptions(): { value: MaLoaiPhieu; label: string }[] {
  return LOAI_PHIEU.map((t) => ({
    value: t.ma_phieu,
    label: t.ten_phieu,
  }));
}

/** Resolve ma_phieu from import cell (case-insensitive). */
export function resolveMaLoaiPhieu(raw: string): MaLoaiPhieu | null {
  const key = raw.trim().toUpperCase();
  return BY_MA.has(key as MaLoaiPhieu) ? (key as MaLoaiPhieu) : null;
}
