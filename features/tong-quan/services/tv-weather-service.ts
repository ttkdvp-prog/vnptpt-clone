import type { TvWeatherSnapshot } from '../core/weather';

export async function getTvWeather(): Promise<TvWeatherSnapshot> {
  const res = await fetch('/api/tv-weather', { credentials: 'same-origin' });
  if (!res.ok) {
    throw new Error(`weather_http_${res.status}`);
  }
  return (await res.json()) as TvWeatherSnapshot;
}
