import { useEffect, useState } from 'react';

const TABLET_QUERY = '(min-width: 768px) and (max-width: 1023px)';

/** true khi viewport nằm trong dải tablet (768–1024px) — dùng để rút gọn cột theo `priority`. */
export function useIsTablet(): boolean {
  const [isTablet, setIsTablet] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(TABLET_QUERY).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(TABLET_QUERY);
    const handler = (e: MediaQueryListEvent) => setIsTablet(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isTablet;
}
