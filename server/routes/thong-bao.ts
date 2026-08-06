import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth, type AuthVariables } from '@/server/auth';
import {
  assertThongBaoPermission,
  resolveThongBaoViewer,
} from '@/server/permissions/thong-bao';
import {
  canViewerAccessThongBao,
  createThongBao,
  deleteThongBao,
  findThongBaoById,
  findThongBaoPage,
  updateThongBao,
} from '@/server/repositories/thong-bao';

const thongBaoRoutes = new Hono<{ Variables: AuthVariables }>();
thongBaoRoutes.use('*', requireAuth);

const createBodySchema = z.object({
  tg_dang: z.string().min(1),
  tieu_de: z.string().min(1),
  noi_dung: z.string().min(1),
  id_chuc_vu: z.array(z.string()).optional(),
});

const updateBodySchema = createBodySchema.partial();

thongBaoRoutes.get('/', async (c) => {
  const denied = await assertThongBaoPermission(c, 'xem');
  if (denied) return denied;

  const viewer = await resolveThongBaoViewer(c);
  const limit = Number(c.req.query('limit') ?? 50);
  const offset = Number(c.req.query('offset') ?? 0);
  const orderBy = c.req.query('orderBy') ?? 'tg_dang';
  const ascending = c.req.query('ascending') === 'true';
  const search = c.req.query('search') ?? undefined;

  const result = await findThongBaoPage({
    limit: Number.isFinite(limit) ? limit : 50,
    offset: Number.isFinite(offset) ? offset : 0,
    orderBy,
    ascending,
    search,
    viewer,
  });
  return c.json(result);
});

thongBaoRoutes.get('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);

  const item = await findThongBaoById(id);
  if (!item) return c.json({ error: 'Not found' }, 404);

  const denied = await assertThongBaoPermission(c, 'xem', {
    recordNguoiTao: item.nguoi_tao,
  });
  if (denied) return denied;

  const viewer = await resolveThongBaoViewer(c);
  if (!canViewerAccessThongBao(item, viewer)) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  return c.json(item);
});

thongBaoRoutes.post('/', async (c) => {
  const denied = await assertThongBaoPermission(c, 'them');
  if (denied) return denied;

  const raw = await c.req.json();
  const parsed = createBodySchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400);
  }
  const session = c.get('session');

  try {
    const item = await createThongBao({
      ...parsed.data,
      id_chuc_vu: parsed.data.id_chuc_vu ?? [],
      nguoi_tao: session.employee_id,
    });
    return c.json(item, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Create failed';
    return c.json({ error: message }, 400);
  }
});

thongBaoRoutes.patch('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);

  const existing = await findThongBaoById(id);
  if (!existing) return c.json({ error: 'Not found' }, 404);

  const denied = await assertThongBaoPermission(c, 'sua', {
    recordNguoiTao: existing.nguoi_tao,
  });
  if (denied) return denied;

  const raw = await c.req.json();
  const parsed = updateBodySchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400);
  }

  try {
    const item = await updateThongBao(id, parsed.data);
    if (!item) return c.json({ error: 'Not found' }, 404);
    return c.json(item);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update failed';
    return c.json({ error: message }, 400);
  }
});

thongBaoRoutes.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);

  const item = await findThongBaoById(id);
  if (!item) return c.json({ error: 'Not found' }, 404);

  const denied = await assertThongBaoPermission(c, 'xoa');
  if (denied) return denied;

  const ok = await deleteThongBao(id);
  if (!ok) return c.json({ error: 'Not found' }, 404);
  return c.json({ ok: true });
});

export { thongBaoRoutes };
