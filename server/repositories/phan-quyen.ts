import { prisma } from '@/server/db';
import { formatQuyenCsv, parseQuyenCsv } from '@/lib/permission-db-keys';

export type PhanQuyenRow = {
  id: number;
  module_key: string;
  chuc_vu_id: number;
  quyen: string;
  tg_tao: Date;
  tg_cap_nhat: Date;
};

export function mapPhanQuyenRow(row: PhanQuyenRow) {
  return {
    id: String(row.id),
    module_key: row.module_key,
    chuc_vu_id: String(row.chuc_vu_id),
    quyen: row.quyen,
    tg_tao: row.tg_tao.toISOString(),
    tg_cap_nhat: row.tg_cap_nhat.toISOString(),
  };
}

export async function findPhanQuyenByModule(params: {
  moduleKey: string;
  chucVuIds?: number[];
}): Promise<PhanQuyenRow[]> {
  return prisma.var_phan_quyen.findMany({
    where: {
      module_key: params.moduleKey,
      ...(params.chucVuIds && params.chucVuIds.length > 0
        ? { chuc_vu_id: { in: params.chucVuIds } }
        : {}),
    },
    orderBy: [{ chuc_vu_id: 'asc' }, { module_key: 'asc' }],
  });
}

/** Sanitize CSV to known tokens; strip admin/tat_ca/all when not super writing phan_quyen. */
export function sanitizeQuyenCsv(raw: string, opts?: { stripAdmin?: boolean }): string {
  let tokens = parseQuyenCsv(raw);
  if (opts?.stripAdmin) {
    tokens = tokens.filter((t) => t !== 'admin' && t !== 'tat_ca' && t !== 'all');
  }
  return formatQuyenCsv(tokens);
}

export async function replacePhanQuyenForModule(params: {
  moduleKey: string;
  rows: Array<{ chuc_vu_id: number; quyen: string }>;
  stripAdminOnPhanQuyen?: boolean;
}): Promise<PhanQuyenRow[]> {
  const { moduleKey, rows } = params;
  const stripAdmin = params.stripAdminOnPhanQuyen === true && moduleKey === 'phan_quyen';
  const chucVuIds = [...new Set(rows.map((r) => r.chuc_vu_id))];
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    if (chucVuIds.length > 0) {
      await tx.var_phan_quyen.deleteMany({
        where: { module_key: moduleKey, chuc_vu_id: { in: chucVuIds } },
      });
    }

    const toCreate = rows
      .map((r) => ({
        chuc_vu_id: r.chuc_vu_id,
        quyen: sanitizeQuyenCsv(r.quyen, { stripAdmin }),
      }))
      .filter((r) => r.quyen.trim().length > 0);

    if (toCreate.length > 0) {
      await tx.var_phan_quyen.createMany({
        data: toCreate.map((r) => ({
          module_key: moduleKey,
          chuc_vu_id: r.chuc_vu_id,
          quyen: r.quyen,
          tg_tao: now,
          tg_cap_nhat: now,
        })),
      });
    }
  });

  return findPhanQuyenByModule({ moduleKey, chucVuIds });
}

export async function assertChucVuIdsExist(ids: number[]): Promise<number[]> {
  if (ids.length === 0) return [];
  const rows = await prisma.var_chuc_vu.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });
  const found = new Set(rows.map((r) => r.id));
  return ids.filter((id) => !found.has(id));
}

/** Raw `quyen` CSV for a position + module (empty string when no grant row). */
export async function findQuyenCsvByChucVuAndModule(
  chucVuId: number,
  moduleKey: string,
): Promise<string> {
  const grant = await prisma.var_phan_quyen.findUnique({
    where: {
      chuc_vu_id_module_key: { chuc_vu_id: chucVuId, module_key: moduleKey },
    },
    select: { quyen: true },
  });
  return grant?.quyen ?? '';
}
