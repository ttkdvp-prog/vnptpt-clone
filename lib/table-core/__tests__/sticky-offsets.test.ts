import { describe, it, expect } from 'vitest';
import { computeStickyOffsets } from '../sticky-offsets';
import type { ColumnConfig } from '@/store/createGenericStore';

type Col = Pick<ColumnConfig, 'width' | 'defaultWidth' | 'minWidth'>;

describe('computeStickyOffsets', () => {
  it('stickyLeftCount=0 → mảng rỗng, không đọc cột nào', () => {
    expect(computeStickyOffsets([{ defaultWidth: 100 }], 0, 44, 150)).toEqual([]);
  });

  it('tích luỹ đúng theo defaultWidth, cột đầu = leftStart', () => {
    const columns: Col[] = [{ defaultWidth: 100 }, { defaultWidth: 200 }, { defaultWidth: 50 }];
    expect(computeStickyOffsets(columns, 3, 44, 150)).toEqual([44, 144, 344]);
  });

  it('ưu tiên width (đã resize) trước defaultWidth trước minWidth trước fallback', () => {
    const columns: Col[] = [
      { width: 80, defaultWidth: 999, minWidth: 999 },
      { defaultWidth: 120, minWidth: 999 },
      { minWidth: 60 },
      {},
    ];
    expect(computeStickyOffsets(columns, 4, 0, 150)).toEqual([0, 80, 200, 260]);
  });

  it('stickyLeftCount lớn hơn số cột thực có → chỉ tính đến hết mảng, không lỗi', () => {
    const columns: Col[] = [{ defaultWidth: 100 }];
    expect(computeStickyOffsets(columns, 5, 0, 150)).toEqual([0]);
  });
});
