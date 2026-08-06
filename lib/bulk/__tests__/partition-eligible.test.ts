import { describe, it, expect } from 'vitest';
import { partitionEligible } from '../types';

interface Row {
  id: string;
  status: string;
}

const rows: Row[] = [
  { id: '1', status: 'cho_duyet' },
  { id: '2', status: 'da_duyet' },
  { id: '3', status: 'cho_duyet' },
];

const getId = (r: Row) => r.id;
const isEligible = (r: Row) => r.status === 'cho_duyet';

describe('partitionEligible', () => {
  it('chia đúng eligible / skipped khi mọi id đều đã tải', () => {
    const result = partitionEligible(rows, ['1', '2', '3'], getId, isEligible);
    expect(result.eligible.map(getId)).toEqual(['1', '3']);
    expect(result.skipped.map(getId)).toEqual(['2']);
    expect(result.unknownIds).toEqual([]);
  });

  it('id chọn nhưng không có trong loadedItems (selection trải trang chưa tải) ⇒ unknownIds', () => {
    const result = partitionEligible(rows, ['1', '99'], getId, isEligible);
    expect(result.eligible.map(getId)).toEqual(['1']);
    expect(result.unknownIds).toEqual(['99']);
  });

  it('selection rỗng ⇒ cả 3 nhóm rỗng', () => {
    const result = partitionEligible(rows, [], getId, isEligible);
    expect(result.eligible).toEqual([]);
    expect(result.skipped).toEqual([]);
    expect(result.unknownIds).toEqual([]);
  });

  it('toàn bộ selection đều chưa tải (cross-page) ⇒ unknownIds đầy đủ, không hề ẩn action', () => {
    const result = partitionEligible([], ['1', '2', '3'], getId, isEligible);
    expect(result.eligible).toEqual([]);
    expect(result.unknownIds).toEqual(['1', '2', '3']);
  });

  it('nhận Set trực tiếp, không chỉ mảng', () => {
    const result = partitionEligible(rows, new Set(['2']), getId, isEligible);
    expect(result.skipped.map(getId)).toEqual(['2']);
  });
});
