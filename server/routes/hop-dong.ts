import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth, type AuthVariables } from '@/server/auth';
import { assertHopDongPermission } from '@/server/permissions/hop-dong';
import {
  createHopDong,
  deleteHopDong,
  findHopDongById,
  findHopDongPage,
  updateHopDong,
} from '@/server/repositories/hop-dong';

function parseCsvQuery(raw: string | undefined): string[] | undefined {
  if (!raw?.trim()) return undefined;
  const parts = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length ? parts : undefined;
}

const hopDongRoutes = new Hono<{ Variables: AuthVariables }>();
hopDongRoutes.use('*', requireAuth);

const LOAI_VALUES = ['thu_viec', 'chinh_thuc'] as const;
const TRANG_THAI_VALUES = ['chua_xong', 'da_xong'] as const;
const HINH_THUC_VALUES = ['theo_thang', 'theo_ngay', 'theo_gio'] as const;

const nullableStr = z.union([z.string(), z.null()]).optional();

const createBodySchema = z.object({
  loai_hop_dong: z.enum(LOAI_VALUES),
  ma_hop_dong: z.string().min(1),
  ngay_ky: z.string().min(1),
  ngay_hieu_luc: z.string().min(1),
  ngay_ket_thuc: nullableStr,
  id_nhan_vien: z.string().min(1),
  id_chuc_vu: z.string().min(1),
  id_phong_ban: z.string().min(1),
  muc_luong: z.string().min(1),
  hinh_thuc_tra_luong: z.enum(HINH_THUC_VALUES),
  che_do_khac: nullableStr,
  noi_lam_viec: nullableStr,
  thoi_gian_lam_viec: nullableStr,
  luu_y_khac: nullableStr,
  ghi_chu: nullableStr,
  trang_thai: z.enum(TRANG_THAI_VALUES),
});

const updateBodySchema = createBodySchema.partial();

hopDongRoutes.get('/', async (c) => {
  const denied = await assertHopDongPermission(c, 'xem');
  if (denied) return denied;

  const limit = Number(c.req.query('limit') ?? 50);
  const offset = Number(c.req.query('offset') ?? 0);
  const orderBy = c.req.query('orderBy') ?? 'tg_cap_nhat';
  const ascending = c.req.query('ascending') === 'true';
  const search = c.req.query('search') ?? undefined;

  const result = await findHopDongPage({
    limit: Number.isFinite(limit) ? limit : 50,
    offset: Number.isFinite(offset) ? offset : 0,
    orderBy,
    ascending,
    search,
    loai_hop_dong: parseCsvQuery(c.req.query('loai_hop_dong') ?? undefined),
    trang_thai: parseCsvQuery(c.req.query('trang_thai') ?? undefined),
    id_phong_ban: parseCsvQuery(c.req.query('id_phong_ban') ?? undefined),
  });
  return c.json(result);
});

hopDongRoutes.get('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);

  const item = await findHopDongById(id);
  if (!item) return c.json({ error: 'Not found' }, 404);

  const denied = await assertHopDongPermission(c, 'xem', {
    recordNguoiTao: item.nguoi_tao,
  });
  if (denied) return denied;

  return c.json(item);
});

hopDongRoutes.post('/', async (c) => {
  const denied = await assertHopDongPermission(c, 'them');
  if (denied) return denied;

  const raw = await c.req.json();
  const parsed = createBodySchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400);
  }
  const session = c.get('session');

  try {
    const item = await createHopDong({
      ...parsed.data,
      ngay_ket_thuc: parsed.data.ngay_ket_thuc ?? null,
      che_do_khac: parsed.data.che_do_khac ?? null,
      noi_lam_viec: parsed.data.noi_lam_viec ?? null,
      thoi_gian_lam_viec: parsed.data.thoi_gian_lam_viec ?? null,
      luu_y_khac: parsed.data.luu_y_khac ?? null,
      ghi_chu: parsed.data.ghi_chu ?? null,
      nguoi_tao: session.employee_id,
    });
    return c.json(item, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Create failed';
    return c.json({ error: message }, 400);
  }
});

hopDongRoutes.patch('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);

  const existing = await findHopDongById(id);
  if (!existing) return c.json({ error: 'Not found' }, 404);

  const denied = await assertHopDongPermission(c, 'sua', {
    recordNguoiTao: existing.nguoi_tao,
  });
  if (denied) return denied;

  const raw = await c.req.json();
  const parsed = updateBodySchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400);
  }

  try {
    const item = await updateHopDong(id, parsed.data);
    if (!item) return c.json({ error: 'Not found' }, 404);
    return c.json(item);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update failed';
    return c.json({ error: message }, 400);
  }
});

hopDongRoutes.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);

  const item = await findHopDongById(id);
  if (!item) return c.json({ error: 'Not found' }, 404);

  const denied = await assertHopDongPermission(c, 'xoa');
  if (denied) return denied;

  const ok = await deleteHopDong(id);
  if (!ok) return c.json({ error: 'Not found' }, 404);
  return c.json({ ok: true });
});

export { hopDongRoutes };
