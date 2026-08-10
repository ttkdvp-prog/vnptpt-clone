import React, { useMemo } from 'react';
import { txt } from '@/lib/text';
import { Link, useLocation } from '@/lib/navigation';
import { ChevronRight, Home } from 'lucide-react';
import type { TFunction } from '@/lib/text';

interface RouteConfig {
  label: string;
  parentPath?: string;
}

const getRouteConfig = (t: TFunction): Record<string, RouteConfig> => ({
  '/': { label: t('breadcrumb.home') },
  '/he-thong': { label: t('breadcrumb.systemAdmin'), parentPath: '/' },
  '/he-thong/nhan-vien': { label: t('breadcrumb.employee'), parentPath: '/he-thong' },
  '/he-thong/thong-tin-cong-ty': { label: t('breadcrumb.companyInfo'), parentPath: '/he-thong' },
  '/he-thong/phan-quyen': { label: t('breadcrumb.permission'), parentPath: '/he-thong' },
  '/cong-viec': { label: t('breadcrumb.workItems'), parentPath: '/' },
  '/cong-viec/danh-sach-cong-viec': { label: t('breadcrumb.task'), parentPath: '/cong-viec' },
  '/cong-viec/nhiem-vu': { label: t('breadcrumb.assignment'), parentPath: '/cong-viec' },
  '/cong-viec/thong-ke-cong-viec': { label: t('breadcrumb.taskStats'), parentPath: '/cong-viec' },
  '/cong-viec/danh-sach-tai-lieu': { label: t('breadcrumb.documentList'), parentPath: '/cong-viec' },
  '/cong-viec/thong-ke-tai-lieu': { label: t('breadcrumb.documentStats'), parentPath: '/cong-viec' },
  '/ho-so': { label: t('breadcrumb.profile'), parentPath: '/' },
  '/thong-bao': { label: t('notification.title'), parentPath: '/' },
});

/** Cấp cha theo breadcrumb/router (không dùng lịch sử trình duyệt). */
export function getParentPath(pathname: string, t: TFunction): string | undefined {
  if (pathname === '/') return undefined;
  if (pathname.startsWith('/ho-so-nhan-vien/')) {
    return '/he-thong/nhan-vien';
  }
  if (pathname.endsWith('/huong-dan')) {
    return pathname.slice(0, -'/huong-dan'.length) || undefined;
  }
  const config = getRouteConfig(t);
  const exact = config[pathname]?.parentPath;
  if (exact !== undefined) return exact;
  return undefined;
}

interface BreadcrumbItem {
  label: string;
  to: string;
  isLast: boolean;
}

/** Interactive crumb — muted by default; solid primary + foreground on hover for contrast. */
const crumbLinkClass =
  'px-2 py-0.5 rounded-md text-xs font-normal whitespace-nowrap transition-colors text-muted-foreground hover:bg-primary hover:text-primary-foreground';

/** Current page crumb chip. */
const crumbCurrentClass =
  'px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold flex items-center whitespace-nowrap shadow-sm shadow-primary/20';

const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const ROUTE_CONFIG = useMemo(() => getRouteConfig(txt), []);

  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => {
    const currentPath = location.pathname;
    const items: BreadcrumbItem[] = [];

    // Trang hướng dẫn: {module}/huong-dan → cha = module, nhãn = Hướng dẫn
    if (currentPath.endsWith('/huong-dan')) {
      const modulePath = currentPath.slice(0, -'/huong-dan'.length);
      const moduleConfig = ROUTE_CONFIG[modulePath];
      items.push({
        label: txt('breadcrumb.moduleGuide'),
        to: currentPath,
        isLast: true,
      });
      if (moduleConfig) {
        items.unshift({
          label: moduleConfig.label,
          to: modulePath,
          isLast: false,
        });
        if (moduleConfig.parentPath) {
          const parentConfig = ROUTE_CONFIG[moduleConfig.parentPath];
          if (parentConfig) {
            items.unshift({
              label: parentConfig.label,
              to: moduleConfig.parentPath,
              isLast: false,
            });
          }
        }
      }
      return items;
    }

    const currentConfig = ROUTE_CONFIG[currentPath];

    if (currentConfig) {
      items.unshift({
        label: currentConfig.label,
        to: currentPath,
        isLast: true,
      });

      if (currentConfig.parentPath) {
        const parentConfig = ROUTE_CONFIG[currentConfig.parentPath];
        if (parentConfig) {
          items.unshift({
            label: parentConfig.label,
            to: currentConfig.parentPath,
            isLast: false,
          });
        }
      }
    } else {
      const pathnames = currentPath.split('/').filter((x) => x);
      pathnames.forEach((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const label =
          ROUTE_CONFIG[to]?.label || value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ');
        items.push({
          label,
          to,
          isLast: index === pathnames.length - 1,
        });
      });
      if (items.length > 0) {
        const firstPath = items[0].to;
        const firstConfig = ROUTE_CONFIG[firstPath];
        if (firstConfig?.parentPath === '/' && ROUTE_CONFIG['/']) {
          items.unshift({
            label: ROUTE_CONFIG['/'].label,
            to: '/',
            isLast: false,
          });
        }
      }
    }

    return items;
  }, [location.pathname, ROUTE_CONFIG]);

  if (location.pathname === '/') {
    return (
      <nav aria-label={txt('breadcrumb.label')}>
        <ol className="flex items-center gap-1 flex-nowrap overflow-hidden">
          <li className="flex items-center gap-1.5">
            <span className="flex items-center justify-center w-6 h-6 rounded-md text-primary" aria-hidden>
              <Home size={14} />
            </span>
            <span className={crumbCurrentClass} aria-current="page">
              {txt('breadcrumb.home')}
            </span>
          </li>
        </ol>
      </nav>
    );
  }

  const crumbsToShow = breadcrumbs[0]?.to === '/' ? breadcrumbs.slice(1) : breadcrumbs;

  return (
    <nav aria-label={txt('breadcrumb.label')}>
      <ol className="flex items-center gap-1 flex-nowrap overflow-hidden">
        {/* Always show home so mobile can leave module dashboards / deep routes */}
        <li className="flex items-center gap-1.5 shrink-0">
          <Link
            to="/"
            className={`flex items-center gap-1.5 ${crumbLinkClass}`}
            title={txt('breadcrumb.goHome')}
            aria-label={txt('breadcrumb.goHome')}
          >
            <Home size={14} className="shrink-0" />
            <span className="hidden md:inline">{txt('breadcrumb.home')}</span>
          </Link>
        </li>

        {crumbsToShow.map((crumb, index) => {
          const isHiddenOnMobile = crumbsToShow.length > 2 && index < crumbsToShow.length - 2;

          return (
            <li
              key={crumb.to}
              className={`flex items-center gap-1 ${isHiddenOnMobile ? 'hidden md:flex' : 'flex'}`}
            >
              <ChevronRight size={12} className="text-muted-foreground shrink-0" />

              {crumb.isLast ? (
                <span className={crumbCurrentClass} aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <Link to={crumb.to} className={crumbLinkClass}>
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default React.memo(Breadcrumbs);
