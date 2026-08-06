import { NextResponse } from 'next/server';
import {
  getTvWeatherCoords,
  mapWmoToWeather,
  type TvWeatherSnapshot,
} from '@/features/tong-quan/core/weather';

export const revalidate = 900;

interface OpenMeteoCurrentResponse {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
  };
}

export async function GET(): Promise<NextResponse> {
  const { lat, lon } = getTvWeatherCoords();
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('current', 'temperature_2m,weather_code');
  url.searchParams.set('timezone', 'Asia/Ho_Chi_Minh');

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 900 },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'weather_upstream' }, { status: 502 });
    }
    const json = (await res.json()) as OpenMeteoCurrentResponse;
    const temperatureC = json.current?.temperature_2m;
    const weatherCode = json.current?.weather_code;
    if (typeof temperatureC !== 'number' || typeof weatherCode !== 'number') {
      return NextResponse.json({ error: 'weather_invalid' }, { status: 502 });
    }
    const mapped = mapWmoToWeather(weatherCode);
    const body: TvWeatherSnapshot = {
      temperatureC: Math.round(temperatureC),
      weatherCode,
      iconId: mapped.iconId,
      labelKey: mapped.labelKey,
      fetchedAt: new Date().toISOString(),
    };
    return NextResponse.json(body, {
      headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800' },
    });
  } catch {
    return NextResponse.json({ error: 'weather_fetch' }, { status: 502 });
  }
}
