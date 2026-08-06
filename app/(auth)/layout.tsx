import type { ReactNode } from 'react';

/**
 * Auth layout — no app sidebar/header.
 * Route group `(auth)` does not affect URL paths (`/dang-nhap`, `/login`, …).
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-[100dvh] bg-background text-foreground">{children}</div>;
}
