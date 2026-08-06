'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { txt } from '@/lib/text';
import { ImageLightbox } from '@/components/ui/ImageLightbox';

export interface PreviewableImageProps {
  src: string;
  alt?: string;
  /** Classes on the outer button (layout / border) */
  className?: string;
  /** Classes on the `<img>` */
  imgClassName?: string;
  /** Disable click-to-preview */
  disabled?: boolean;
  title?: string;
}

/**
 * Thumbnail that opens {@link ImageLightbox} on click.
 * Prefer this in detail drawers / read-only views over a bare `<img>`.
 */
export function PreviewableImage({
  src,
  alt = '',
  className,
  imgClassName,
  disabled = false,
  title,
}: PreviewableImageProps): ReactNode {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  if (disabled) {
    return (
      <img src={src} alt={alt} className={cn(imgClassName, className)} />
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'p-0 border-0 bg-transparent cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-[inherit]',
          className,
        )}
        title={title ?? txt('media.multiViewLarge')}
        aria-label={title ?? txt('media.multiViewLarge')}
      >
        <img src={src} alt={alt} className={cn('block', imgClassName)} />
      </button>
      <ImageLightbox src={open ? src : null} alt={alt} onClose={close} />
    </>
  );
}

export default PreviewableImage;
