'use client';

import '@/lib/text/bootstrap-module-strings';
import { useState, type ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import * as Sentry from '@sentry/react';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import { QueryDevtoolsPanel } from '@/components/dev/QueryDevtoolsPanel';
import { SERVER_GC_TIME_MS, SERVER_STALE_TIME_MS } from '@/lib/query/query-config';
import { isDev, isProd, getPublicEnv } from '@/lib/env';
import { AppShell } from '@/providers/app-shell';

const sentryDsn = getPublicEnv('NEXT_PUBLIC_SENTRY_DSN');
if (sentryDsn?.trim()) {
  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV || 'production',
    enabled: true,
    integrations: isProd() ? [Sentry.browserTracingIntegration()] : [],
    tracesSampleRate: isProd() ? 0.1 : 0,
  });
}

function queryErrorToast(error: unknown) {
  const msg =
    error instanceof Error ? error.message : typeof error === 'string' ? error : 'Đã xảy ra lỗi';
  toast.error(msg);
}

function isRetryableError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return /network|timeout|ECONNREFUSED|ETIMEDOUT|Failed to fetch|fetch/i.test(msg);
}

function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: queryErrorToast,
    }),
    defaultOptions: {
      queries: {
        staleTime: SERVER_STALE_TIME_MS,
        gcTime: SERVER_GC_TIME_MS,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: (failureCount, error) => {
          if (failureCount >= 2) return false;
          return isRetryableError(error);
        },
      },
      mutations: {
        onError: queryErrorToast,
      },
    },
  });
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <SessionProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AppShell>{children}</AppShell>
          {isDev() ? <QueryDevtoolsPanel /> : null}
        </QueryClientProvider>
      </ErrorBoundary>
    </SessionProvider>
  );
}
