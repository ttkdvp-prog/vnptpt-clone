import { describe, expect, it } from 'vitest';
import { marketInSchema } from '../schema';

const base = {
  thu_tu: 1,
  id_khach_hang: '1',
  ma_san_pham: 'SP-BAG-001',
  ma_market: 'MI0001',
};

describe('marketInSchema', () => {
  it('accepts valid market in', () => {
    const parsed = marketInSchema.parse({
      ...base,
      mo_ta: 'Market in túi PE',
      link_file: 'https://drive.google.com/file/d/sample',
      id_nguoi_ve: '2',
      ngay_hieu_luc: '2026-06-01',
    });
    expect(parsed.ma_market).toBe('MI0001');
    expect(parsed.link_file).toBe('https://drive.google.com/file/d/sample');
    expect(parsed.ngay_hieu_luc).toBe('2026-06-01');
  });

  it('nulls empty optional fields', () => {
    const parsed = marketInSchema.parse({
      ...base,
      mo_ta: '  ',
      link_file: '',
      id_nguoi_ve: '',
      ngay_hieu_luc: null,
    });
    expect(parsed.mo_ta).toBeNull();
    expect(parsed.link_file).toBeNull();
    expect(parsed.id_nguoi_ve).toBeNull();
    expect(parsed.ngay_hieu_luc).toBeNull();
  });

  it('rejects missing market code', () => {
    expect(() => marketInSchema.parse({ ...base, ma_market: '' })).toThrow();
  });

  it('rejects missing customer', () => {
    expect(() => marketInSchema.parse({ ...base, id_khach_hang: '' })).toThrow();
  });

  it('rejects invalid link', () => {
    expect(() =>
      marketInSchema.parse({ ...base, link_file: 'not-a-url' }),
    ).toThrow();
  });

  it('rejects negative order', () => {
    expect(() => marketInSchema.parse({ ...base, thu_tu: -1 })).toThrow();
  });
});
