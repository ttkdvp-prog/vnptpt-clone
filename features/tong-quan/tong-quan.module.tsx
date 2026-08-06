'use client';

import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import * as m from 'framer-motion/m';
import { txt } from '@/lib/text';
import { useNavigate } from '@/lib/navigation';
import { useUIStore } from '@/store/useStore';
import { TV_SLIDE_TITLE_KEYS, type TvSlideId } from './core/slides';
import type { TongQuanMode } from './core/types';
import { useTvSlideshow } from './hooks/use-tv-slideshow';
import { TvChrome } from './components/tv-chrome';
import { TvTicker } from './components/tv-ticker';
import { TvRail } from './components/tv-rail';
import { TongQuanDashboard } from './components/tong-quan-dashboard';
import { SlideNhanSu } from './components/slides/slide-nhan-su';
import { SlideSanXuat } from './components/slides/slide-san-xuat';
import { SlideChatLuong } from './components/slides/slide-chat-luong';
import { SlideAnToan } from './components/slides/slide-an-toan';

function renderSlide(slideId: TvSlideId, isHeld: boolean) {
  switch (slideId) {
    case 'nhan-su':
      return <SlideNhanSu isHeld={isHeld} />;
    case 'san-xuat':
      return <SlideSanXuat />;
    case 'chat-luong':
      return <SlideChatLuong />;
    case 'an-toan':
      return <SlideAnToan />;
    default:
      return null;
  }
}

function WallboardShell() {
  const { slideId, slideIndex, slideCount, isHeld, toggleHold, goTo } = useTvSlideshow();
  const companyInfo = useUIStore((s) => s.companyInfo);
  const navigate = useNavigate();

  const companyName =
    companyInfo.companyName?.trim() || companyInfo.appName || txt('overview.title');
  const logoUrl = companyInfo.appLogo ?? null;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        navigate('/tong-quan');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigate]);

  return (
    <div className="tv-wallboard relative h-[100dvh] w-full flex flex-col bg-zinc-950 text-white overflow-hidden select-none font-sans">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 0% 0%, hsl(var(--primary) / 0.14), transparent 55%), radial-gradient(ellipse 40% 30% at 100% 0%, hsl(var(--primary) / 0.06), transparent 50%)',
        }}
      />
      <div className="tv-wallboard-grid pointer-events-none absolute inset-0 opacity-[0.25]" />

      <div className="relative z-10 flex flex-col h-full min-h-0">
        <TvChrome
          title={txt(TV_SLIDE_TITLE_KEYS[slideId])}
          companyName={companyName}
          logoUrl={logoUrl}
          slideIndex={slideIndex}
          slideCount={slideCount}
          isHeld={isHeld}
          onToggleHold={toggleHold}
          onGoTo={goTo}
        />

        <div className="flex-1 min-h-0 px-[3.5%] flex gap-3">
          <TvRail slideIndex={slideIndex} onGoTo={goTo} />
          <main className="flex-1 min-h-0 relative min-w-0">
            <AnimatePresence mode="wait">
              <m.div
                key={slideId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="h-full"
              >
                {renderSlide(slideId, isHeld)}
              </m.div>
            </AnimatePresence>
          </main>
        </div>

        <TvTicker />
      </div>
    </div>
  );
}

export interface TongQuanModuleProps {
  mode?: TongQuanMode;
}

export function TongQuanModule({ mode = 'embedded' }: TongQuanModuleProps) {
  if (mode === 'tv') {
    return <WallboardShell />;
  }
  return <TongQuanDashboard />;
}
