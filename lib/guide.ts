import guideData from '@/locales/guide.json';

/** Các section bắt buộc theo docs/GUIDE-CONTENT.md */
export const GUIDE_SECTION_IDS = [
  'overview',
  'permissions',
  'workflow',
  'quickStart',
  'glossary',
  'faq',
  'contact',
] as const;

export type GuideSectionId = (typeof GUIDE_SECTION_IDS)[number];

export interface ModuleGuideContent {
  intro?: string;
  overview?: string;
  permissions?: string;
  workflow?: string;
  quickStart?: string;
  glossary?: string;
  faq?: string;
  contact?: string;
}

function kebabToCamel(kebab: string): string {
  return kebab.replace(/-([a-z0-9])/gi, (_, c: string) => c.toUpperCase());
}

/** `/he-thong/nhan-vien` → `heThong_nhanVien` */
export function modulePathToGuideKey(modulePath: string): string {
  const parts = modulePath.replace(/^\//, '').split('/').filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return kebabToCamel(parts[0]!);
  const [submenu, ...moduleParts] = parts;
  return `${kebabToCamel(submenu!)}_${kebabToCamel(moduleParts.join('-'))}`;
}

/** `/he-thong/nhan-vien/huong-dan` → `/he-thong/nhan-vien` */
export function guidePathToModulePath(pathname: string): string {
  return pathname.replace(/\/huong-dan\/?$/, '') || '/';
}

export function getModuleGuide(modulePath: string): ModuleGuideContent | undefined {
  const key = modulePathToGuideKey(modulePath);
  const modules = guideData.modules as Record<string, ModuleGuideContent>;
  return modules[key];
}
