'use client';

import {
  useEffect,
  useCallback,
  useMemo,
  type ComponentProps,
  type ReactNode,
  type CSSProperties,
} from 'react';
import NextLink from 'next/link';
import {
  useRouter,
  usePathname,
  useParams as useNextParams,
  useSearchParams as useNextSearchParams,
} from 'next/navigation';

/** Drop-in replacements for react-router-dom (Phase 5). */

export function useNavigate() {
  const router = useRouter();
  return (to: string | number, options?: { replace?: boolean }) => {
    if (typeof to === 'number') {
      router.back();
      return;
    }
    if (options?.replace) router.replace(to);
    else router.push(to);
  };
}

export function useLocation() {
  const pathname = usePathname() ?? '/';
  const searchParams = useNextSearchParams();
  const search = searchParams?.toString() ? `?${searchParams}` : '';
  return { pathname, search, hash: '', state: null as unknown, key: 'next' };
}

export function useParams<T extends Record<string, string | string[]> = Record<string, string>>() {
  return useNextParams() as T;
}

export function useSearchParams(): [
  URLSearchParams,
  (
    nextInit: URLSearchParams | Record<string, string> | ((prev: URLSearchParams) => URLSearchParams),
    navigateOpts?: { replace?: boolean },
  ) => void,
] {
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const sp = useNextSearchParams();
  const search = sp?.toString() ?? '';
  const params = useMemo(() => new URLSearchParams(search), [search]);

  const setSearchParams = useCallback(
    (
      nextInit:
        | URLSearchParams
        | Record<string, string>
        | ((prev: URLSearchParams) => URLSearchParams),
      navigateOpts?: { replace?: boolean },
    ) => {
      let next: URLSearchParams;
      if (typeof nextInit === 'function') next = nextInit(new URLSearchParams(params));
      else if (nextInit instanceof URLSearchParams) next = nextInit;
      else next = new URLSearchParams(nextInit);
      const url = `${pathname}?${next.toString()}`;
      if (navigateOpts?.replace) router.replace(url);
      else router.push(url);
    },
    [params, pathname, router],
  );

  return [params, setSearchParams];
}

export function useNavigationType(): 'POP' | 'PUSH' | 'REPLACE' {
  return 'POP';
}

type LinkProps = Omit<ComponentProps<typeof NextLink>, 'href'> & {
  to?: string;
  href?: string;
  children?: ReactNode;
};

export function Link({ to, href, ...props }: LinkProps) {
  return <NextLink href={href ?? to ?? '/'} {...props} />;
}

type NavLinkClassName =
  | string
  | ((args: { isActive: boolean; isPending: boolean }) => string | undefined);

type NavLinkChildren =
  | ReactNode
  | ((args: { isActive: boolean; isPending: boolean }) => ReactNode);

export function NavLink({
  to,
  href,
  className,
  style,
  children,
  end,
  ...props
}: Omit<LinkProps, 'children' | 'className' | 'style'> & {
  className?: NavLinkClassName;
  style?: CSSProperties | ((args: { isActive: boolean }) => CSSProperties);
  children?: NavLinkChildren;
  end?: boolean;
}) {
  const pathname = usePathname() ?? '/';
  const target = href ?? to ?? '/';
  const isActive = end
    ? pathname === target
    : pathname === target || pathname.startsWith(`${target}/`);
  const resolvedClass =
    typeof className === 'function' ? className({ isActive, isPending: false }) : className;
  const resolvedStyle = typeof style === 'function' ? style({ isActive }) : style;
  const resolvedChildren =
    typeof children === 'function' ? children({ isActive, isPending: false }) : children;
  return (
    <NextLink href={target} className={resolvedClass} style={resolvedStyle} {...props}>
      {resolvedChildren}
    </NextLink>
  );
}

export function Navigate({ to, replace = false }: { to: string; replace?: boolean }) {
  const router = useRouter();
  useEffect(() => {
    try {
      if (replace) router.replace(to);
      else router.push(to);
    } catch {
      /* Outside Next.js (unit tests) — no-op */
    }
  }, [to, replace, router]);
  return null;
}

export function Outlet() {
  return null;
}

/** Test helpers — stubs for legacy MemoryRouter tests. */
export function MemoryRouter({
  children,
}: {
  children?: ReactNode;
  initialEntries?: string[];
}) {
  return <>{children}</>;
}
export function Routes({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}
export function Route(_props: { path?: string; element?: ReactNode }) {
  return null;
}
