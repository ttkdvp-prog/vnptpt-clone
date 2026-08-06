import React from 'react';
import { Navigate, useLocation } from '@/lib/navigation';
import { useAuthStore } from '@/store/useStore';

const FORCE_CHANGE_PATH = '/doi-mat-khau-bat-buoc';

export const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const fallbackDone = React.useRef(false);

  React.useEffect(() => {
    if (hasHydrated) return;
    const t = setTimeout(() => {
      if (fallbackDone.current) return;
      fallbackDone.current = true;
      useAuthStore.setState({ _hasHydrated: true });
    }, 400);
    return () => clearTimeout(t);
  }, [hasHydrated]);

  if (!hasHydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center" aria-busy="true" aria-label="Đang tải">
        <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/dang-nhap" replace />;
  }

  if (
    user?.must_change_password &&
    location.pathname !== FORCE_CHANGE_PATH
  ) {
    return <Navigate to={FORCE_CHANGE_PATH} replace />;
  }

  return <>{children}</>;
};

/** Public self-registration allowed (mock / non-production flows). */
export function RegisterRouteGuard({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

export { FORCE_CHANGE_PATH };
