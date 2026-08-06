// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const txMock = {
  var_phong_ban: {
    groupBy: vi.fn(),
    deleteMany: vi.fn(),
  },
};

vi.mock('@/server/db', () => ({
  prisma: {
    $transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn(txMock)),
  },
}));

import { prisma } from '@/server/db';
import { deleteDepartmentsMany } from '../phong-ban';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.$transaction).mockImplementation(
    (async (fn: (tx: unknown) => unknown) => fn(txMock)) as typeof prisma.$transaction,
  );
});

describe('deleteDepartmentsMany', () => {
  it('bỏ qua phòng ban còn phòng con, xoá phần còn lại', async () => {
    txMock.var_phong_ban.groupBy.mockResolvedValue([{ id_cha: 1, _count: 2 }]);
    txMock.var_phong_ban.deleteMany.mockResolvedValue({ count: 1 });

    const result = await deleteDepartmentsMany([1, 2]);
    expect(result).toEqual({ deletedCount: 1, skippedIds: [1] });
    expect(txMock.var_phong_ban.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: [2] } },
    });
  });

  it('mọi id đều còn con ⇒ không gọi deleteMany', async () => {
    txMock.var_phong_ban.groupBy.mockResolvedValue([
      { id_cha: 1, _count: 1 },
      { id_cha: 2, _count: 1 },
    ]);

    const result = await deleteDepartmentsMany([1, 2]);
    expect(result).toEqual({ deletedCount: 0, skippedIds: [1, 2] });
    expect(txMock.var_phong_ban.deleteMany).not.toHaveBeenCalled();
  });

  it('chạy trong transaction Serializable', async () => {
    txMock.var_phong_ban.groupBy.mockResolvedValue([]);
    txMock.var_phong_ban.deleteMany.mockResolvedValue({ count: 2 });

    await deleteDepartmentsMany([1, 2]);
    expect(prisma.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      { isolationLevel: 'Serializable' },
    );
  });

  it('lỗi P2034 (serialization failure) ⇒ tự retry một lần rồi thành công', async () => {
    txMock.var_phong_ban.groupBy.mockResolvedValue([]);
    txMock.var_phong_ban.deleteMany.mockResolvedValue({ count: 1 });

    let call = 0;
    vi.mocked(prisma.$transaction).mockImplementation((async (
      fn: (tx: unknown) => unknown,
    ) => {
      call++;
      if (call === 1) {
        const err = new Error('could not serialize access') as Error & { code: string };
        err.code = 'P2034';
        throw err;
      }
      return fn(txMock);
    }) as typeof prisma.$transaction);

    const result = await deleteDepartmentsMany([1]);
    expect(result).toEqual({ deletedCount: 1, skippedIds: [] });
    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
  });

  it('lỗi khác P2034 ⇒ ném thẳng ra, không retry im lặng', async () => {
    vi.mocked(prisma.$transaction).mockRejectedValue(new Error('mất kết nối DB'));
    await expect(deleteDepartmentsMany([1])).rejects.toThrow('mất kết nối DB');
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});
