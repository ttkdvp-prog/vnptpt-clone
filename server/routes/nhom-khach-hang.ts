import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth, type AuthVariables } from '@/server/auth';
import { assertThietLapKhachHangPermission } from '@/server/permissions/thiet-lap-khach-hang';
import { BULK_IMPORT_MAX_ITEMS, bulkImportZodMessage, runBulkImport } from '@/server/bulk-import';
import { translateCreateError } from '@/server/prisma-errors';
import {
  createNhomKhachHang,
  deleteNhomKhachHang,
  findNhomKhachHangById,
  findNhomKhachHangPage,
  getNhomKhachHangNguoiTao,
  updateNhomKhachHang,
} from '@/server/repositories/nhom-khach-hang';

const nhomKhachHangRoutes = new Hono<{ Variables: AuthVariables }>();
nhomKhachHangRoutes.use('*', requireAuth);

const createBodySchema = z.object({
  ten_nhom: z.string().min(1),
  mo_ta: z.union([z.string(), z.null()]).optional(),
});

const updateBodySchema = createBodySchema.partial();

const UNIQUE_MESSAGE = 'Tên nhóm đã tồn tại';

async function createOne(
  body: z.infer<typeof createBodySchema>,
  employeeId: string,
): Promise<Awaited<ReturnType<typeof createNhomKhachHang>>> {
  return createNhomKhachHang({
    ten_nhom: body.ten_nhom.trim(),
    mo_ta: body.mo_ta ?? null,
    nguoi_tao: employeeId,
  });
}

nhomKhachHangRoutes.get('/', async (c) => {
  const denied = await assertThietLapKhachHangPermission(c, 'xem');
  if (denied) return denied;

  const limit = Number(c.req.query('limit') ?? 50);
  const offset = Number(c.req.query('offset') ?? 0);
  const orderBy = c.req.query('orderBy') ?? 'ten_nhom';
  const ascending = c.req.query('ascending') !== 'false';
  const search = c.req.query('search') ?? undefined;

  const result = await findNhomKhachHangPage({
    limit: Number.isFinite(limit) ? limit : 50,
    offset: Number.isFinite(offset) ? offset : 0,
    orderBy,
    ascending,
    search,
  });
  return c.json(result);
});

nhomKhachHangRoutes.get('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);

  const item = await findNhomKhachHangById(id);
  if (!item) return c.json({ error: 'Not found' }, 404);

  const denied = await assertThietLapKhachHangPermission(c, 'xem', {
    recordNguoiTao: item.nguoi_tao,
  });
  if (denied) return denied;

  return c.json(item);
});

nhomKhachHangRoutes.post('/', async (c) => {
  const denied = await assertThietLapKhachHangPermission(c, 'them');
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

nhomKhachHangRoutes.post('/import', async (c) => {
  const denied = await assertThietLapKhachHangPermission(c, 'them');
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

nhomKhachHangRoutes.patch('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);

  const nguoiTao = await getNhomKhachHangNguoiTao(id);
  const denied = await assertThietLapKhachHangPermission(c, 'sua', {
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
    const item = await updateNhomKhachHang(id, {
      ten_nhom: body.ten_nhom != null ? body.ten_nhom.trim() : undefined,
      mo_ta: body.mo_ta,
    });
    if (!item) return c.json({ error: 'Not found' }, 404);
    return c.json(item);
  } catch (err) {
    return c.json({ error: translateCreateError(err, UNIQUE_MESSAGE) }, 400);
  }
});

nhomKhachHangRoutes.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);

  const denied = await assertThietLapKhachHangPermission(c, 'xoa');
  if (denied) return denied;

  const ok = await deleteNhomKhachHang(id);
  if (!ok) return c.json({ error: 'Not found' }, 404);
  return c.json({ ok: true });
});

export { nhomKhachHangRoutes };
