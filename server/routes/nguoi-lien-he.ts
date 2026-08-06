import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth, type AuthVariables } from '@/server/auth';
import { assertNguoiLienHePermission } from '@/server/permissions/nguoi-lien-he';
import { BULK_IMPORT_MAX_ITEMS, bulkImportZodMessage, runBulkImport } from '@/server/bulk-import';
import { translateCreateError } from '@/server/prisma-errors';
import {
  createNguoiLienHe,
  deleteNguoiLienHe,
  findNguoiLienHeById,
  findNguoiLienHePage,
  getNguoiLienHeNguoiTao,
  updateNguoiLienHe,
} from '@/server/repositories/nguoi-lien-he';

const nguoiLienHeRoutes = new Hono<{ Variables: AuthVariables }>();
nguoiLienHeRoutes.use('*', requireAuth);

const ngaySinhSchema = z
  .union([z.string(), z.null()])
  .optional()
  .refine(
    (v) => v == null || v === '' || /^\d{4}$/.test(v) || /^\d{4}-\d{2}-\d{2}$/.test(v),
    { message: 'ngay_sinh phải là YYYY hoặc YYYY-MM-DD' },
  );

const createBodySchema = z.object({
  id_khach_hang: z.string().min(1),
  ho_ten: z.string().min(1),
  ngay_sinh: ngaySinhSchema,
  chuc_vu: z.union([z.string(), z.null()]).optional(),
  so_dien_thoai: z.union([z.string(), z.null()]).optional(),
  email: z.union([z.string(), z.null()]).optional(),
  dia_chi: z.union([z.string(), z.null()]).optional(),
  ghi_chu: z.union([z.string(), z.null()]).optional(),
});

const updateBodySchema = createBodySchema.partial();

function normalizeNgaySinh(v: string | null | undefined): string | null {
  if (v == null || v.trim() === '') return null;
  return v.trim();
}

async function createOne(
  body: z.infer<typeof createBodySchema>,
  employeeId: string,
): Promise<Awaited<ReturnType<typeof createNguoiLienHe>>> {
  return createNguoiLienHe({
    id_khach_hang: body.id_khach_hang,
    ho_ten: body.ho_ten.trim(),
    ngay_sinh: normalizeNgaySinh(body.ngay_sinh ?? null),
    chuc_vu: body.chuc_vu ?? null,
    so_dien_thoai: body.so_dien_thoai ?? null,
    email: body.email ?? null,
    dia_chi: body.dia_chi ?? null,
    ghi_chu: body.ghi_chu ?? null,
    nguoi_tao: employeeId,
  });
}

nguoiLienHeRoutes.get('/', async (c) => {
  const denied = await assertNguoiLienHePermission(c, 'xem');
  if (denied) return denied;

  const limit = Number(c.req.query('limit') ?? 50);
  const offset = Number(c.req.query('offset') ?? 0);
  const orderBy = c.req.query('orderBy') ?? 'ho_ten';
  const ascending = c.req.query('ascending') !== 'false';
  const search = c.req.query('search') ?? undefined;
  const id_khach_hang = c.req.query('id_khach_hang') ?? undefined;

  const result = await findNguoiLienHePage({
    limit: Number.isFinite(limit) ? limit : 50,
    offset: Number.isFinite(offset) ? offset : 0,
    orderBy,
    ascending,
    search,
    id_khach_hang,
  });
  return c.json(result);
});

nguoiLienHeRoutes.get('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);

  const item = await findNguoiLienHeById(id);
  if (!item) return c.json({ error: 'Not found' }, 404);

  const denied = await assertNguoiLienHePermission(c, 'xem', {
    recordNguoiTao: item.nguoi_tao,
  });
  if (denied) return denied;

  return c.json(item);
});

nguoiLienHeRoutes.post('/', async (c) => {
  const denied = await assertNguoiLienHePermission(c, 'them');
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

nguoiLienHeRoutes.post('/import', async (c) => {
  const denied = await assertNguoiLienHePermission(c, 'them');
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

nguoiLienHeRoutes.patch('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);

  const nguoiTao = await getNguoiLienHeNguoiTao(id);
  const denied = await assertNguoiLienHePermission(c, 'sua', {
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
    const item = await updateNguoiLienHe(id, {
      id_khach_hang: body.id_khach_hang,
      ho_ten: body.ho_ten != null ? body.ho_ten.trim() : undefined,
      ngay_sinh:
        body.ngay_sinh !== undefined ? normalizeNgaySinh(body.ngay_sinh) : undefined,
      chuc_vu: body.chuc_vu,
      so_dien_thoai: body.so_dien_thoai,
      email: body.email,
      dia_chi: body.dia_chi,
      ghi_chu: body.ghi_chu,
    });
    if (!item) return c.json({ error: 'Not found' }, 404);
    return c.json(item);
  } catch (err) {
    return c.json({ error: translateCreateError(err) }, 400);
  }
});

nguoiLienHeRoutes.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);

  const denied = await assertNguoiLienHePermission(c, 'xoa');
  if (denied) return denied;

  const ok = await deleteNguoiLienHe(id);
  if (!ok) return c.json({ error: 'Not found' }, 404);
  return c.json({ ok: true });
});

export { nguoiLienHeRoutes };
