import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'sonner';
import { reportBulkOutcome } from '../report-bulk-outcome';
import type { BulkOutcome } from '../types';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

function outcome(over: Partial<BulkOutcome>): BulkOutcome {
  return {
    mode: 'partial',
    attempted: 3,
    succeededIds: [],
    failures: [],
    ...over,
  };
}

const opts = {
  successMessage: (n: number) => `OK ${n}`,
  partialMessage: (ok: number, fail: number) => `${ok}/${fail}`,
  allFailedMessage: (n: number) => `FAIL ${n}`,
  onShowDetails: vi.fn(),
};

beforeEach(() => vi.clearAllMocks());

describe('reportBulkOutcome', () => {
  it('không có lỗi ⇒ toast.success', () => {
    reportBulkOutcome(outcome({ succeededIds: ['1', '2', '3'], failures: [] }), opts);
    expect(toast.success).toHaveBeenCalledWith('OK 3');
    expect(toast.warning).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('toàn bộ thất bại ⇒ toast.error', () => {
    reportBulkOutcome(
      outcome({ succeededIds: [], failures: [{ id: '1', label: 'A', reason: 'x' }] }),
      opts,
    );
    expect(toast.error).toHaveBeenCalledWith('FAIL 1');
  });

  it('một phần thất bại ⇒ toast.warning kèm action', () => {
    const failures = [{ id: '2', label: 'B', reason: 'y' }];
    reportBulkOutcome(outcome({ succeededIds: ['1'], failures }), opts);
    expect(toast.warning).toHaveBeenCalledTimes(1);
    const [message, options] = vi.mocked(toast.warning).mock.calls[0];
    expect(message).toBe('1/1');
    const action = options?.action as { label: string; onClick: () => void } | undefined;
    expect(action).toBeDefined();

    action?.onClick();
    expect(opts.onShowDetails).toHaveBeenCalledWith(failures);
  });
});
