import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth, type AuthVariables } from '@/server/auth';
import { getSessionIsSuper } from '@/server/permissions/assert-module';
import { assertPhanQuyenPermission } from '@/server/permissions/phan-quyen';
import {
  assertChucVuIdsExist,
  findPhanQuyenByModule,
  mapPhanQuyenRow,
  replacePhanQuyenForModule,
} from '@/server/repositories/phan-quyen';

const phanQuyenRoutes = new Hono<{ Variables: AuthVariables }>();
phanQuyenRoutes.use('*', requireAuth);

const putBodySchema = z.object({
  module_key: z.string().min(1),
  rows: z.array(
    z.object({
      chuc_vu_id: z.union([z.string(), z.number()]),
      quyen: z.string().optional().default(''),
    }),
  ),
});

/** GET /phan-quyen?module_key=…&chuc_vu_ids=1,2,3 — module_key bắt buộc */
phanQuyenRoutes.get('/', async (c) => {
  const denied = await assertPhanQuyenPermission(c, 'xem');
  if (denied) return denied;

  const moduleKey = c.req.query('module_key')?.trim();
  if (!moduleKey) {
    return c.json({ error: 'module_key là bắt buộc' }, 400);
  }

  const chucVuIdsRaw = c.req.query('chuc_vu_ids')?.trim();
  const chucVuIds = chucVuIdsRaw
    ? chucVuIdsRaw
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isFinite(n))
    : undefined;

  const rows = await findPhanQuyenByModule({ moduleKey, chucVuIds });
  return c.json({ items: rows.map(mapPhanQuyenRow), total: rows.length });
});

/**
 * PUT /phan-quyen
 * Body: { module_key, rows: { chuc_vu_id, quyen }[] }
 */
phanQuyenRoutes.put('/', async (c) => {
  const denied = await assertPhanQuyenPermission(c, 'sua');
  if (denied) return denied;

  const raw = await c.req.json().catch(() => ({}));
  const parsed = putBodySchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400);
  }

  const moduleKey = parsed.data.module_key.trim();
  const normalized = parsed.data.rows
    .map((r) => ({
      chuc_vu_id: Number(r.chuc_vu_id),
      quyen: String(r.quyen ?? ''),
    }))
    .filter((r) => Number.isFinite(r.chuc_vu_id));

  const missing = await assertChucVuIdsExist([...new Set(normalized.map((r) => r.chuc_vu_id))]);
  if (missing.length > 0) {
    return c.json({ error: `chuc_vu_id không tồn tại: ${missing.join(', ')}` }, 400);
  }

  const isSuper = await getSessionIsSuper(c);
  const rows = await replacePhanQuyenForModule({
    moduleKey,
    rows: normalized,
    stripAdminOnPhanQuyen: !isSuper,
  });

  return c.json({ items: rows.map(mapPhanQuyenRow), total: rows.length });
});

export { phanQuyenRoutes };
