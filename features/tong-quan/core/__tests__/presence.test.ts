import { describe, expect, it } from 'vitest';
import { LEAVE_MA_PHIEU, PRESENCE_MA_PHIEU, TRIP_MA_PHIEU } from '../slides';

describe('TV presence phiếu codes', () => {
  it('covers leave and trip without DC', () => {
    expect(LEAVE_MA_PHIEU).toEqual(['XN', 'NL', 'NB']);
    expect(TRIP_MA_PHIEU).toEqual(['CT']);
    expect(PRESENCE_MA_PHIEU).toContain('CT');
    expect(PRESENCE_MA_PHIEU).not.toContain('DC');
  });
});
