import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth, type AuthVariables } from '@/server/auth';
import {
  assertPhieuHanhChinhPermission,
  canManageLockedPhieuHanhChinh,
} from '@/server/permissions/phieu-hanh-chinh';
import { BULK_IMPORT_MAX_ITEMS, bulkImportZodMessage, runBulkImport } from '@/server/bulk-import';
import { translateCreateError } from '@/server/prisma-errors';
import {
  approvePhieuHcns,
  approvePhieuQl,
  cancelPhieuHanhChinh,
  createPhieuHanhChinh,
  deletePhieuHanhChinh,
  findPhieuHanhChinhById,
  findPhieuHanhChinhPage,
  getPhieuHanhChinhStatsAggregates,
  rejectPhieuHanhChinh,
  updatePhieuHanhChinh,
} from '@/server/repositories/phieu-hanh-chinh';

function parseCsvQuery(raw: string | undefined): string[] | undefined {
  if (!raw?.trim()) return undefined;
  const parts = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length ? parts : undefined;
}

const phieuHanhChinhRoutes = new Hono<{ Variables: AuthVariables }>();
phieuHanhChinhRoutes.use('*', requireAuth);

const buoiSchema = z.enum(['sang', 'chieu', 'dem']);

const createBodySchema = z.object({
  ma_phieu: z.string().min(1),
  id_nhan_vien: z.string().min(1),
  tu_ngay: z.string().min(1),
  buoi_bat_dau: buoiSchema,
  den_ngay: z.string().min(1),
  buoi_ket_thuc: buoiSchema,
  gio_bat_dau: z.union([z.string(), z.null()]).optional(),
  gio_ket_thuc: z.union([z.string(), z.null()]).optional(),
  ly_do: z.union([z.string(), z.null()]).optional(),
  hinh_anh: z.array(z.string()).optional(),
});

const updateBodySchema = createBodySchema.partial();

const noteBodySchema = z.object({
  ghi_chu: z.union([z.string(), z.null()]).optional(),
});

const rejectBodySchema = z.object({
  ly_do_tu_choi: z.string().trim().min(1),
});

async function createOne(
  body: z.infer<typeof createBodySchema>,
  employeeId: string,
): Promise<Awaited<ReturnType<typeof createPhieuHanhChinh>>> {
  return createPhieuHanhChinh({
    ...body,
    gio_bat_dau: body.gio_bat_dau ?? null,
    gio_ket_thuc: body.gio_ket_thuc ?? null,
    ly_do: body.ly_do ?? null,
    hinh_anh: body.hinh_anh ?? [],
    nguoi_tao: employeeId,
  });
}

phieuHanhChinhRoutes.get('/', async (c) => {
  const denied = await assertPhieuHanhChinhPermission(c, 'xem');
  if (denied) return denied;

  const limit = Number(c.req.query('limit') ?? 50);
  const offset = Number(c.req.query('offset') ?? 0);
  const orderBy = c.req.query('orderBy') ?? 'tg_tao';
  const ascending = c.req.query('ascending') === 'true';
  const search = c.req.query('search') ?? undefined;

  const result = await findPhieuHanhChinhPage({
    limit: Number.isFinite(limit) ? limit : 50,
    offset: Number.isFinite(offset) ? offset : 0,
    orderBy,
    ascending,
    search,
    ma_phieu: parseCsvQuery(c.req.query('ma_phieu') ?? undefined),
    trang_thai: parseCsvQuery(c.req.query('trang_thai') ?? undefined),
    id_phong_ban: parseCsvQuery(c.req.query('id_phong_ban') ?? undefined),
    id_nhan_vien: parseCsvQuery(c.req.query('id_nhan_vien') ?? undefined),
    from: c.req.query('from') ?? undefined,
    to: c.req.query('to') ?? undefined,
  });
  return c.json(result);
});

phieuHanhChinhRoutes.get('/stats/aggregates', async (c) => {
  const denied = await assertPhieuHanhChinhPermission(c, 'xem');
  if (denied) return denied;

  const aggregates = await getPhieuHanhChinhStatsAggregates({
    ma_phieu: parseCsvQuery(c.req.query('ma_phieu') ?? undefined),
    trang_thai: parseCsvQuery(c.req.query('trang_thai') ?? undefined),
    id_phong_ban: parseCsvQuery(c.req.query('id_phong_ban') ?? undefined),
    id_nhan_vien: parseCsvQuery(c.req.query('id_nhan_vien') ?? undefined),
    from: c.req.query('from') ?? undefined,
    to: c.req.query('to') ?? undefined,
  });
  return c.json(aggregates);
});

phieuHanhChinhRoutes.get('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);

  const item = await findPhieuHanhChinhById(id);
  if (!item) return c.json({ error: 'Not found' }, 404);

  const denied = await assertPhieuHanhChinhPermission(c, 'xem', {
    recordNguoiTao: item.nguoi_tao,
  });
  if (denied) return denied;

  return c.json(item);
});

phieuHanhChinhRoutes.post('/', async (c) => {
  const denied = await assertPhieuHanhChinhPermission(c, 'them');
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

phieuHanhChinhRoutes.post('/import', async (c) => {
  const denied = await assertPhieuHanhChinhPermission(c, 'them');
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

phieuHanhChinhRoutes.patch('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);

  const existing = await findPhieuHanhChinhById(id);
  if (!existing) return c.json({ error: 'Not found' }, 404);

  const denied = await assertPhieuHanhChinhPermission(c, 'sua', {
    recordNguoiTao: existing.nguoi_tao,
  });
  if (denied) return denied;

  const allowLocked = await canManageLockedPhieuHanhChinh(c);
  if (
    (existing.trang_thai === 'cho_hcns_duyet' ||
      existing.trang_thai === 'da_duyet') &&
    !allowLocked
  ) {
    return c.json(
      {
        error:
          'Chỉ cấp bậc 1 hoặc quản trị module được sửa phiếu chờ HCNS/đã duyệt',
      },
      403,
    );
  }

  const raw = await c.req.json();
  const parsed = updateBodySchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400);
  }

  try {
    const item = await updatePhieuHanhChinh(id, parsed.data, { allowLocked });
    if (!item) return c.json({ error: 'Not found' }, 404);
    return c.json(item);
  } catch (err) {
    return c.json({ error: translateCreateError(err) }, 400);
  }
});

phieuHanhChinhRoutes.post('/:id/duyet-ql', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);

  const denied = await assertPhieuHanhChinhPermission(c, 'sua');
  if (denied) return denied;

  const raw = await c.req.json().catch(() => ({}));
  const parsed = noteBodySchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400);
  }

  const session = c.get('session');
  try {
    const item = await approvePhieuQl(id, session.employee_id, parsed.data.ghi_chu);
    if (!item) return c.json({ error: 'Not found' }, 404);
    return c.json(item);
  } catch (err) {
    return c.json({ error: translateCreateError(err) }, 400);
  }
});

phieuHanhChinhRoutes.post('/:id/duyet-hcns', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);

  const denied = await assertPhieuHanhChinhPermission(c, 'sua');
  if (denied) return denied;

  const raw = await c.req.json().catch(() => ({}));
  const parsed = noteBodySchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400);
  }

  const session = c.get('session');
  try {
    const item = await approvePhieuHcns(id, session.employee_id, parsed.data.ghi_chu);
    if (!item) return c.json({ error: 'Not found' }, 404);
    return c.json(item);
  } catch (err) {
    return c.json({ error: translateCreateError(err) }, 400);
  }
});

phieuHanhChinhRoutes.post('/:id/tu-choi', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);

  const denied = await assertPhieuHanhChinhPermission(c, 'sua');
  if (denied) return denied;

  const raw = await c.req.json();
  const parsed = rejectBodySchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400);
  }

  const session = c.get('session');
  try {
    const item = await rejectPhieuHanhChinh(
      id,
      session.employee_id,
      parsed.data.ly_do_tu_choi,
    );
    if (!item) return c.json({ error: 'Not found' }, 404);
    return c.json(item);
  } catch (err) {
    return c.json({ error: translateCreateError(err) }, 400);
  }
});

phieuHanhChinhRoutes.post('/:id/huy', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);

  const existing = await findPhieuHanhChinhById(id);
  if (!existing) return c.json({ error: 'Not found' }, 404);

  const denied = await assertPhieuHanhChinhPermission(c, 'xem', {
    recordNguoiTao: existing.nguoi_tao,
  });
  if (denied) return denied;

  const session = c.get('session');
  try {
    const item = await cancelPhieuHanhChinh(id, session.employee_id);
    if (!item) return c.json({ error: 'Not found' }, 404);
    return c.json(item);
  } catch (err) {
    return c.json({ error: translateCreateError(err) }, 400);
  }
});

phieuHanhChinhRoutes.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);

  const item = await findPhieuHanhChinhById(id);
  if (!item) return c.json({ error: 'Not found' }, 404);

  const denied = await assertPhieuHanhChinhPermission(c, 'xoa');
  if (denied) return denied;

  if (
    (item.trang_thai === 'cho_hcns_duyet' ||
      item.trang_thai === 'da_duyet') &&
    !(await canManageLockedPhieuHanhChinh(c))
  ) {
    return c.json(
      {
        error:
          'Chỉ cấp bậc 1 hoặc quản trị module được xóa phiếu chờ HCNS/đã duyệt',
      },
      403,
    );
  }

  const ok = await deletePhieuHanhChinh(id);
  if (!ok) return c.json({ error: 'Not found' }, 404);
  return c.json({ ok: true });
});

export { phieuHanhChinhRoutes };
