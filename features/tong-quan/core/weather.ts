/** Open-Meteo WMO weather interpretation codes → UI. */

export type TvWeatherIconId =
  | 'sun'
  | 'cloud-sun'
  | 'cloud'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'thunder';

export interface TvWeatherSnapshot {
  temperatureC: number;
  weatherCode: number;
  iconId: TvWeatherIconId;
  /** Vietnamese short label key suffix under overview.weather.* */
  labelKey: string;
  fetchedAt: string;
}

const DEFAULT_LAT = 10.9804;
const DEFAULT_LON = 106.6519;

export function getTvWeatherCoords(): { lat: number; lon: number } {
  const lat = Number(process.env.NEXT_PUBLIC_TV_WEATHER_LAT ?? DEFAULT_LAT);
  const lon = Number(process.env.NEXT_PUBLIC_TV_WEATHER_LON ?? DEFAULT_LON);
  return {
    lat: Number.isFinite(lat) ? lat : DEFAULT_LAT,
    lon: Number.isFinite(lon) ? lon : DEFAULT_LON,
  };
}

export function mapWmoToWeather(code: number): {
  iconId: TvWeatherIconId;
  labelKey: string;
} {
  if (code === 0) return { iconId: 'sun', labelKey: 'clear' };
  if (code === 1 || code === 2) return { iconId: 'cloud-sun', labelKey: 'partlyCloudy' };
  if (code === 3) return { iconId: 'cloud', labelKey: 'cloudy' };
  if (code === 45 || code === 48) return { iconId: 'fog', labelKey: 'fog' };
  if (code >= 51 && code <= 57) return { iconId: 'drizzle', labelKey: 'drizzle' };
  if (code >= 61 && code <= 67) return { iconId: 'rain', labelKey: 'rain' };
  if (code >= 71 && code <= 77) return { iconId: 'snow', labelKey: 'snow' };
  if (code >= 80 && code <= 82) return { iconId: 'rain', labelKey: 'showers' };
  if (code >= 85 && code <= 86) return { iconId: 'snow', labelKey: 'snow' };
  if (code >= 95 && code <= 99) return { iconId: 'thunder', labelKey: 'thunder' };
  return { iconId: 'cloud', labelKey: 'cloudy' };
}
