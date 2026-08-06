import { lazy, Suspense } from 'react';
import { isDev } from '@/lib/env';

const ReactQueryDevtools = lazy(() =>
  import('@tanstack/react-query-devtools').then((m) => ({ default: m.ReactQueryDevtools })),
);

export function QueryDevtoolsPanel() {
  if (!isDev()) return null;
  return (
    <Suspense fallback={null}>
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </Suspense>
  );
}
