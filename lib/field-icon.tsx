import type { LucideIcon } from 'lucide-react';
import { createElement, type ReactElement } from 'react';
import { ICON_SIZE } from '@/lib/icon-sizes';

/** Render a Lucide icon at DetailField / form-label size (`ICON_SIZE.micro`). */
export function fieldIcon(Icon: LucideIcon): ReactElement {
  return createElement(Icon, { size: ICON_SIZE.micro });
}
