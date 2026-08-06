import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth, type AuthVariables } from '@/server/auth';
import { assertMarketInPermission } from '@/server/permissions/market-in';
import { BULK_IMPORT_MAX_ITEMS, bulkImportZodMessage, runBulkImport } from '@/server/bulk-import';
import { translateCreateError } from '@/server/prisma-errors';
import {
  approveMarketIn,
  createMarketIn,
  deleteMarketIn,
  findMarketInById,
  findMarketInPage,
  getMarketInNguoiTao,
  getNextMaMarket,
  suspendMarketIn,
  updateMarketIn,
} from '@/server/repositories/market-in';

const marketInRoutes = new Hono<{ Variables: AuthVariables }>();
marketInRoutes.use('*', requireAuth);

const createBodySchema = z.object({
  thu_tu: z.number().int().min(0).optional(),
  id_khach_hang: z.string().min(1),
  ma_san_pham: z.string().min(1),
  ma_market: z.string().min(1),
  mo_ta: z.union([z.string(), z.null()]).optional(),
  link_file: z.union([z.string(), z.null()]).optional(),
  id_nguoi_ve: z.union([z.string(), z.null()]).optional(),
  ngay_hieu_luc: z.union([z.string(), z.null()]).optional(),
});

const updateBodySchema = createBodySchema.partial();

const UNIQUE_MESSAGE = 'Mã market đã tồn tại';

async function createOne(
  body: z.infer<typeof createBodySchema>,
  employeeId: string,
): Promise<Awaited<ReturnType<typeof createMarketIn>>> {
  return createMarketIn({
    thu_tu: body.thu_tu,
    id_khach_hang: body.id_khach_hang,
    ma_san_pham: body.ma_san_pham.trim(),
    ma_market: body.ma_market.trim(),
    mo_ta: body.mo_ta ?? null,
    link_file: body.link_file ?? null,
    id_nguoi_ve: body.id_nguoi_ve ?? null,
    ngay_hieu_luc: body.ngay_hieu_luc ?? null,
    nguoi_tao: employeeId,
  });
}

marketInRoutes.get('/', async (c) => {
  const denied = await assertMarketInPermission(c, 'xem');
  if (denied) return denied;

  const limit = Number(c.req.query('limit') ?? 50);
  const offset = Number(c.req.query('offset') ?? 0);
  const orderBy = c.req.query('orderBy') ?? 'thu_tu';
  const ascending = c.req.query('ascending') !== 'false';
  const search = c.req.query('search') ?? undefined;

  const result = await findMarketInPage({
    limit: Number.isFinite(limit) ? limit : 50,
    offset: Number.isFinite(offset) ? offset : 0,
    orderBy,
    ascending,
    search,
  });
  return c.json(result);
});

marketInRoutes.get('/next-ma', async (c) => {
  const denied = await assertMarketInPermission(c, 'them');
  if (denied) return denied;
  const ma = await getNextMaMarket();
  return c.json({ ma_market: ma });
});

marketInRoutes.get('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);

  const item = await findMarketInById(id);
  if (!item) return c.json({ error: 'Not found' }, 404);

  const denied = await assertMarketInPermission(c, 'xem', {
    recordNguoiTao: item.nguoi_tao,
  });
  if (denied) return denied;

  return c.json(item);
});

marketInRoutes.post('/', async (c) => {
  const denied = await assertMarketInPermission(c, 'them');
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
    return c.json({ error: translateCreateError(err, UNIQUE_MESSAGE) }, 400);
  }
});

marketInRoutes.post('/import', async (c) => {
  const denied = await assertMarketInPermission(c, 'them');
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
    (err) => translateCreateError(err, UNIQUE_MESSAGE),
  );
  return c.json(result);
});

marketInRoutes.patch('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);

  const nguoiTao = await getMarketInNguoiTao(id);
  const denied = await assertMarketInPermission(c, 'sua', {
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
    const item = await updateMarketIn(id, {
      thu_tu: body.thu_tu,
      id_khach_hang: body.id_khach_hang,
      ma_san_pham: body.ma_san_pham != null ? body.ma_san_pham.trim() : undefined,
      ma_market: body.ma_market != null ? body.ma_market.trim() : undefined,
      mo_ta: body.mo_ta,
      link_file: body.link_file,
      id_nguoi_ve: body.id_nguoi_ve,
      ngay_hieu_luc: body.ngay_hieu_luc,
    });
    if (!item) return c.json({ error: 'Not found' }, 404);
    return c.json(item);
  } catch (err) {
    return c.json({ error: translateCreateError(err, UNIQUE_MESSAGE) }, 400);
  }
});

marketInRoutes.post('/:id/duyet', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);

  const denied = await assertMarketInPermission(c, 'sua');
  if (denied) return denied;

  const session = c.get('session');
  try {
    const item = await approveMarketIn(id, session.employee_id);
    if (!item) return c.json({ error: 'Not found' }, 404);
    return c.json(item);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Approve failed';
    return c.json({ error: message }, 400);
  }
});

marketInRoutes.post('/:id/ngung', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);

  const denied = await assertMarketInPermission(c, 'sua');
  if (denied) return denied;

  try {
    const item = await suspendMarketIn(id);
    if (!item) return c.json({ error: 'Not found' }, 404);
    return c.json(item);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Suspend failed';
    return c.json({ error: message }, 400);
  }
});

marketInRoutes.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);

  const denied = await assertMarketInPermission(c, 'xoa');
  if (denied) return denied;

  const ok = await deleteMarketIn(id);
  if (!ok) return c.json({ error: 'Not found' }, 404);
  return c.json({ ok: true });
});

export { marketInRoutes };
