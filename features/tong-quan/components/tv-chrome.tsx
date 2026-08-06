'use client';

import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Pin,
  Snowflake,
  Sparkles,
  Sun,
  X,
  type LucideIcon,
} from 'lucide-react';
import { txt } from '@/lib/text';
import { Link } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import type { TvWeatherIconId } from '../core/weather';
import { useTvClock } from '../hooks/use-tv-clock';
import { useTvWeather } from '../hooks/use-tv-weather';
import { TV_CHIP } from './tv-theme';

const WEATHER_ICONS: Record<TvWeatherIconId, LucideIcon> = {
  sun: Sun,
  'cloud-sun': CloudSun,
  cloud: Cloud,
  fog: CloudFog,
  drizzle: CloudRain,
  rain: CloudRain,
  snow: Snowflake,
  thunder: CloudLightning,
};

function weatherLocationLabel(): string {
  const fromEnv = process.env.NEXT_PUBLIC_TV_WEATHER_LOCATION?.trim();
  return fromEnv || txt('overview.weather.locationDefault');
}

export interface TvChromeProps {
  title: string;
  companyName: string;
  logoUrl: string | null;
  slideIndex: number;
  slideCount: number;
  isHeld: boolean;
  onToggleHold: () => void;
  onGoTo: (index: number) => void;
}

export function TvChrome({
  title,
  companyName,
  logoUrl,
  slideIndex,
  slideCount,
  isHeld,
  onToggleHold,
  onGoTo,
}: TvChromeProps) {
  const { time, dateLabel } = useTvClock();
  const { data: weather, isError: weatherError } = useTvWeather();

  const WeatherIcon = weather ? WEATHER_ICONS[weather.iconId] : Cloud;
  const weatherLabel = weather
    ? txt(`overview.weather.${weather.labelKey}`)
    : txt('overview.weather.unavailable');
  const location = weatherLocationLabel();

  return (
    <header className="relative shrink-0 px-[3.5%] pt-[2%] pb-3">
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/90 via-zinc-950/40 to-transparent pointer-events-none" />
      <div className="absolute inset-x-[3.5%] bottom-0 h-px bg-border/60" />

      <div className="relative grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 lg:gap-6">
        <Link
          to="/tong-quan"
          className="flex items-center gap-3 min-w-0 justify-self-start rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          title={txt('overview.exitTv')}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              className="h-12 w-12 rounded-lg object-contain bg-white/[0.05] border border-white/10 shrink-0"
            />
          ) : (
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
          <div className="min-w-0 hidden sm:block">
            <p className="text-xs font-medium text-primary truncate">{txt('overview.liveTv')}</p>
            <p className="text-sm lg:text-base font-semibold text-white/85 truncate">
              {companyName || txt('overview.title')}
            </p>
          </div>
        </Link>

        <div className="flex flex-col items-center justify-center gap-2 min-w-0 px-2">
          <h1 className="text-2xl lg:text-3xl xl:text-4xl font-semibold text-white tracking-wide uppercase truncate max-w-[min(40vw,28rem)]">
            {title}
          </h1>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: slideCount }, (_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`${i + 1}`}
                onClick={() => onGoTo(i)}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  i === slideIndex
                    ? 'w-7 bg-primary'
                    : 'w-1.5 bg-white/25 hover:bg-white/40',
                  i === slideIndex && isHeld && 'ring-2 ring-primary/40 ring-offset-1 ring-offset-zinc-950',
                )}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2.5 lg:gap-3 shrink-0 justify-self-end">
          {!weatherError && (
            <div className={cn(TV_CHIP, 'hidden sm:flex items-center gap-2.5 px-3 py-2 min-w-[7.5rem]')}>
              <WeatherIcon
                className={cn(
                  'h-7 w-7 shrink-0',
                  weather?.iconId === 'sun' || weather?.iconId === 'cloud-sun'
                    ? 'text-warning'
                    : weather?.iconId === 'rain' ||
                        weather?.iconId === 'drizzle' ||
                        weather?.iconId === 'thunder'
                      ? 'text-info'
                      : 'text-white/55',
                )}
                strokeWidth={1.5}
              />
              <div className="leading-tight min-w-0">
                <p className="text-xl font-semibold text-white tabular-nums tracking-tight">
                  {weather ? `${weather.temperatureC}°` : '—'}
                </p>
                <p className="text-xs text-white/45 truncate">{weatherLabel}</p>
                <p className="text-xs text-white/30 truncate">{location}</p>
              </div>
            </div>
          )}

          <div className={cn(TV_CHIP, 'px-3.5 py-2 text-right leading-none tabular-nums min-w-[7.5rem]')}>
            <p className="text-3xl lg:text-4xl font-semibold text-white tracking-tight">{time}</p>
            <p className="mt-1 text-xs text-white/45 font-medium">{dateLabel}</p>
          </div>

          <button
            type="button"
            onClick={onToggleHold}
            aria-pressed={isHeld}
            aria-label={isHeld ? txt('overview.releaseHold') : txt('overview.hold')}
            title={isHeld ? txt('overview.releaseHold') : txt('overview.hold')}
            className={cn(
              'inline-flex items-center justify-center h-10 w-10 rounded-lg transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              isHeld
                ? 'bg-primary/20 text-primary border border-primary/40'
                : cn(TV_CHIP, 'text-white/70 hover:text-white hover:bg-white/[0.08]'),
            )}
          >
            {isHeld ? (
              <Pin className="h-4 w-4 fill-primary" strokeWidth={1.75} />
            ) : (
              <Pin className="h-4 w-4" strokeWidth={1.75} />
            )}
          </button>

          <Link
            to="/tong-quan"
            title={txt('overview.exitTv')}
            className={cn(
              TV_CHIP,
              'inline-flex items-center justify-center h-10 w-10 text-white/70 hover:text-white hover:bg-white/[0.08]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            )}
          >
            <X className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
