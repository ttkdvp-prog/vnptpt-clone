import type { Prisma } from '@prisma/client';
import { prisma } from '@/server/db';

export interface BulkAuditEntry {
  moduleKey: string;
  action: string;
  mode: 'partial' | 'atomic';
  actorId: number | null;
  targetIds: number[];
  failedIds: number[];
  /** Ý định thao tác (vd `{"trang_thai":"da_duyet"}`) — KHÔNG BAO GIỜ đưa mật khẩu vào đây. */
  payload?: Prisma.InputJsonValue | null;
  /** Lý do từ chối/hủy hàng loạt — một lý do áp cho cả lô. */
  reason?: string | null;
  errorSample?: string | null;
}

/**
 * Ghi một dòng audit cho hành động bulk. KHÔNG BAO GIỜ throw — gọi ở NGOÀI
 * transaction nghiệp vụ, sau khi dữ liệu đã xử lý xong, để một lỗi ghi audit
 * (vd mất kết nối DB tạm thời) không kéo theo rollback thao tác thật.
 */
export async function writeBulkAudit(entry: BulkAuditEntry): Promise<void> {
  try {
    await prisma.sys_bulk_audit.create({
      data: {
        module_key: entry.moduleKey,
        action: entry.action,
        mode: entry.mode,
        actor_id: entry.actorId,
        target_count: entry.targetIds.length,
        success_count: entry.targetIds.length - entry.failedIds.length,
        fail_count: entry.failedIds.length,
        target_ids: entry.targetIds,
        failed_ids: entry.failedIds,
        payload: entry.payload ?? undefined,
        reason: entry.reason ?? undefined,
        error_sample: entry.errorSample ?? undefined,
      },
    });
  } catch (err) {
    console.error('[bulk-audit] ghi audit thất bại (không ảnh hưởng thao tác chính):', err);
  }
}
