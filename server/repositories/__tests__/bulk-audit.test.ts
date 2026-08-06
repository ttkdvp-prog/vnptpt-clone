// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/server/db', () => ({
  prisma: { sys_bulk_audit: { create: vi.fn() } },
}));

import { prisma } from '@/server/db';
import { writeBulkAudit } from '../bulk-audit';

beforeEach(() => vi.clearAllMocks());

describe('writeBulkAudit', () => {
  it('ghi đúng dữ liệu, success_count = target - failed', async () => {
    await writeBulkAudit({
      moduleKey: 'nhan_vien',
      action: 'status',
      mode: 'partial',
      actorId: 1,
      targetIds: [1, 2, 3],
      failedIds: [2],
      payload: { trang_thai: 'INACTIVE' },
    });

    expect(prisma.sys_bulk_audit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        module_key: 'nhan_vien',
        action: 'status',
        mode: 'partial',
        actor_id: 1,
        target_count: 3,
        success_count: 2,
        fail_count: 1,
        target_ids: [1, 2, 3],
        failed_ids: [2],
      }),
    });
  });

  it('không throw khi prisma reject — caller vẫn resolve bình thường', async () => {
    vi.mocked(prisma.sys_bulk_audit.create).mockRejectedValue(new Error('DB down'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      writeBulkAudit({
        moduleKey: 'nhan_vien',
        action: 'delete',
        mode: 'atomic',
        actorId: null,
        targetIds: [1],
        failedIds: [],
      }),
    ).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('actorId null (vd hệ thống tự chạy) vẫn ghi được', async () => {
    await writeBulkAudit({
      moduleKey: 'phong_ban',
      action: 'delete',
      mode: 'atomic',
      actorId: null,
      targetIds: [5],
      failedIds: [],
    });
    expect(prisma.sys_bulk_audit.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ actor_id: null }) }),
    );
  });

  it('payload không được set khi undefined — không ghi mật khẩu hay dữ liệu thừa', async () => {
    await writeBulkAudit({
      moduleKey: 'nhan_vien',
      action: 'password_reset',
      mode: 'partial',
      actorId: 1,
      targetIds: [1],
      failedIds: [],
    });
    const call = vi.mocked(prisma.sys_bulk_audit.create).mock.calls[0][0];
    expect(call.data.payload).toBeUndefined();
  });
});
