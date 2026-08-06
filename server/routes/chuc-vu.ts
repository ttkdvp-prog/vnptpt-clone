import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth, type AuthVariables } from '@/server/auth';
import { assertChucVuPermission } from '@/server/permissions/chuc-vu';
import { BULK_IMPORT_MAX_ITEMS, bulkImportZodMessage, runBulkImport } from '@/server/bulk-import';
import { translateCreateError } from '@/server/prisma-errors';
import {
  createPosition,
  deletePosition,
  findPositionById,
  findPositionsPage,
  getPositionNguoiTao,
  updatePosition,
  updatePositionStatus,
} from '@/server/repositories/chuc-vu';

const chucVuRoutes = new Hono<{ Variables: AuthVariables }>();
chucVuRoutes.use('*', requireAuth);

const createBodySchema = z.object({
  ma_chuc_vu: z.string().min(1),
  ten_chuc_vu: z.string().min(1),
  phong_ban_id: z.union([z.string(), z.number(), z.null()]).optional(),
  cap_bac: z.union([z.number(), z.string(), z.null()]).optional(),
  mo_ta: z.union([z.string(), z.null()]).optional(),
  thu_tu: z.union([z.number(), z.string()]).optional(),
  trang_thai: z.string().optional(),
});

const updateBodySchema = createBodySchema.partial().extend({
  ids: z.array(z.union([z.string(), z.number()])).optional(),
});

function normalizePhongBanId(
  value: string | number | null | undefined,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
}

function parseCapBac(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function parseThuTu(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

async function createOne(
  body: z.infer<typeof createBodySchema>,
  employeeId: string,
): Promise<Awaited<ReturnType<typeof createPosition>>> {
  return createPosition({
    ma_chuc_vu: body.ma_chuc_vu.trim(),
    ten_chuc_vu: body.ten_chuc_vu.trim(),
    phong_ban_id: normalizePhongBanId(body.phong_ban_id) ?? null,
    cap_bac: parseCapBac(body.cap_bac) ?? 1,
    mo_ta: body.mo_ta ?? null,
    thu_tu: parseThuTu(body.thu_tu) ?? 0,
    trang_thai: body.trang_thai,
    nguoi_tao: employeeId,
  });
}

chucVuRoutes.get('/', async (c) => {
  const denied = await assertChucVuPermission(c, 'xem');
  if (denied) return denied;

  const limit = Number(c.req.query('limit') ?? 50);
  const offset = Number(c.req.query('offset') ?? 0);
  const orderBy = c.req.query('orderBy') ?? 'thu_tu';
  const ascending = c.req.query('ascending') !== 'false';
  const search = c.req.query('search') ?? undefined;
  const activeOnly = c.req.query('active') === 'true' || c.req.query('activeOnly') === 'true';

  const result = await findPositionsPage({
    limit: Number.isFinite(limit) ? limit : 50,
    offset: Number.isFinite(offset) ? offset : 0,
    orderBy,
    ascending,
    search,
    activeOnly,
  });
  return c.json(result);
});

/** Bulk status — must be registered before /:id */
chucVuRoutes.patch('/status/bulk', async (c) => {
  const denied = await assertChucVuPermission(c, 'sua');
  if (denied) return denied;

  const raw = await c.req.json().catch(() => ({}));
  const idsRaw = Array.isArray(raw.ids) ? raw.ids : [];
  const ids = idsRaw.map((v: unknown) => Number(v)).filter((n: number) => Number.isFinite(n));
  const trangThai = String(raw.trang_thai ?? '').trim();
  if (ids.length === 0 || !trangThai) {
    return c.json({ error: 'ids và trang_thai là bắt buộc' }, 400);
  }

  const items = await updatePositionStatus(ids, trangThai);
  return c.json({ items, total: items.length });
});

chucVuRoutes.get('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);

  const item = await findPositionById(id);
  if (!item) return c.json({ error: 'Not found' }, 404);

  const denied = await assertChucVuPermission(c, 'xem', {
    recordNguoiTao: item.nguoi_tao,
  });
  if (denied) return denied;

  return c.json(item);
});

chucVuRoutes.post('/', async (c) => {
  const denied = await assertChucVuPermission(c, 'them');
  if (denied) return denied;

  const raw = await c.req.json();
  const parsed = createBodySchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400);
  }
  const body = parsed.data;
  const session = c.get('session');
  try {
    const item = await createOne(body, session.employee_id);
    return c.json(item, 201);
  } catch (err) {
    return c.json({ error: translateCreateError(err) }, 400);
  }
});

chucVuRoutes.post('/import', async (c) => {
  const denied = await assertChucVuPermission(c, 'them');
  if (denied) return denied;

  const raw = await c.req.json();
  const items = Array.isArray((raw as { items?: unknown[] })?.items)
    ? (raw as { items: unknown[] }).items
    : null;
  if (!items) return c.json({ error: 'Invalid body' }, 400);
  if (items.length > BULK_IMPORT_MAX_ITEMS) {
    return c.json({ error: `Tối đa ${BULK_IMPORT_MAX_ITEMS} dòng mỗi lần import` }, 400);
  }
  const session = c.get('session');

  const result = await runBulkImport(
    items,
    async (item) => {
      const parsed = createBodySchema.safeParse(item);
      if (!parsed.success) {
        throw new Error(bulkImportZodMessage(parsed.error));
      }
      await createOne(parsed.data, session.employee_id);
    },
    (err) => translateCreateError(err),
  );
  return c.json(result);
});

chucVuRoutes.patch('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);

  const nguoiTao = await getPositionNguoiTao(id);
  const denied = await assertChucVuPermission(c, 'sua', {
    recordNguoiTao: nguoiTao,
  });
  if (denied) return denied;

  const raw = await c.req.json();
  const parsed = updateBodySchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400);
  }
  const body = parsed.data;

  try {
    const item = await updatePosition(id, {
      ma_chuc_vu: body.ma_chuc_vu != null ? body.ma_chuc_vu.trim() : undefined,
      ten_chuc_vu: body.ten_chuc_vu != null ? body.ten_chuc_vu.trim() : undefined,
      phong_ban_id: normalizePhongBanId(body.phong_ban_id),
      cap_bac: parseCapBac(body.cap_bac),
      mo_ta: body.mo_ta,
      thu_tu: parseThuTu(body.thu_tu),
      trang_thai: body.trang_thai,
    });
    if (!item) return c.json({ error: 'Not found' }, 404);
    return c.json(item);
  } catch (err) {
    return c.json({ error: translateCreateError(err) }, 400);
  }
});

chucVuRoutes.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);

  const denied = await assertChucVuPermission(c, 'xoa');
  if (denied) return denied;

  const ok = await deletePosition(id);
  if (!ok) return c.json({ error: 'Not found' }, 404);
  return c.json({ ok: true });
});

export { chucVuRoutes };
