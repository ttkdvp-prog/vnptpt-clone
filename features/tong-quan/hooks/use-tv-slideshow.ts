'use client';

import { useCallback, useEffect, useState } from 'react';
import { TV_SLIDE_IDS, TV_SLIDE_INTERVAL_MS, type TvSlideId } from '../core/slides';

export interface UseTvSlideshowResult {
  slideId: TvSlideId;
  slideIndex: number;
  slideCount: number;
  isHeld: boolean;
  toggleHold: () => void;
  goTo: (index: number) => void;
  goNext: () => void;
  goPrev: () => void;
}

export function useTvSlideshow(): UseTvSlideshowResult {
  const [slideIndex, setSlideIndex] = useState(0);
  const [isHeld, setIsHeld] = useState(false);
  const slideCount = TV_SLIDE_IDS.length;

  const goTo = useCallback(
    (index: number) => {
      const next = ((index % slideCount) + slideCount) % slideCount;
      setSlideIndex(next);
    },
    [slideCount],
  );

  const goNext = useCallback(() => {
    setSlideIndex((i) => (i + 1) % slideCount);
  }, [slideCount]);

  const goPrev = useCallback(() => {
    setSlideIndex((i) => (i - 1 + slideCount) % slideCount);
  }, [slideCount]);

  const toggleHold = useCallback(() => {
    setIsHeld((v) => !v);
  }, []);

  useEffect(() => {
    if (isHeld) return;
    const id = window.setInterval(goNext, TV_SLIDE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [isHeld, goNext]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        toggleHold();
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goNext, goPrev, toggleHold]);

  return {
    slideId: TV_SLIDE_IDS[slideIndex]!,
    slideIndex,
    slideCount,
    isHeld,
    toggleHold,
    goTo,
    goNext,
    goPrev,
  };
}
