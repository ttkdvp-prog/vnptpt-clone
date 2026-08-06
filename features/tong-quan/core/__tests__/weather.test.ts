import { describe, expect, it } from 'vitest';
import { mapWmoToWeather } from '../weather';

describe('mapWmoToWeather', () => {
  it('maps clear and rain codes', () => {
    expect(mapWmoToWeather(0)).toEqual({ iconId: 'sun', labelKey: 'clear' });
    expect(mapWmoToWeather(61).labelKey).toBe('rain');
    expect(mapWmoToWeather(95).iconId).toBe('thunder');
  });
});
