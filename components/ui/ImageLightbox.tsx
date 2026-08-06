'use client';

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import * as m from 'framer-motion/m';
import { AnimatePresence } from 'framer-motion';
import { txt } from '@/lib/text';
import { Z_INDEX_LIGHTBOX_CLASS } from '@/lib/dialog-sizes';
import { cn } from '@/lib/utils';

export interface ImageLightboxProps {
  /** Image URL; `null` / empty closes the lightbox */
  src: string | null | undefined;
  alt?: string;
  onClose: () => void;
  className?: string;
}

/**
 * Full-screen image preview (portal).
 * Use for detail avatars/logos, galleries, product images later.
 * Close: backdrop click, X button, or Escape.
 */
export function ImageLightbox({
  src,
  alt = 'Preview',
  onClose,
  className,
}: ImageLightboxProps): ReactNode {
  const open = Boolean(src);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && src ? (
        <m.div
          key="image-lightbox"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={cn(
            'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4',
            Z_INDEX_LIGHTBOX_CLASS,
            className,
          )}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={alt}
        >
          <m.img
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.2 }}
            src={src}
            alt={alt}
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label={txt('common.close')}
          >
            <X size={20} />
          </button>
        </m.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

export default ImageLightbox;
