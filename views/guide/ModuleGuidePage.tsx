'use client';

import { ArrowLeft, HelpCircle } from 'lucide-react';
import { Link, useLocation } from '@/lib/navigation';
import { txt } from '@/lib/text';
import {
  GUIDE_SECTION_IDS,
  getModuleGuide,
  guidePathToModulePath,
  type GuideSectionId,
} from '@/lib/guide';

const SECTION_TITLE_KEYS: Record<GuideSectionId, string> = {
  overview: 'guide.sections.overview',
  permissions: 'guide.sections.permissions',
  workflow: 'guide.sections.workflow',
  quickStart: 'guide.sections.quickStart',
  glossary: 'guide.sections.glossary',
  faq: 'guide.sections.faq',
  contact: 'guide.sections.contact',
};

function GuideBody({ text }: { text: string }) {
  return (
    <div className="space-y-3 text-sm text-foreground/90 leading-relaxed">
      {text.split(/\n\n+/).map((block, i) => (
        <p key={i} className="whitespace-pre-line">
          {block}
        </p>
      ))}
    </div>
  );
}

/**
 * Trang hướng dẫn module — đọc nội dung từ `locales/guide.json`.
 * Route: `{modulePath}/huong-dan`.
 */
export default function ModuleGuidePage() {
  const { pathname } = useLocation();
  const modulePath = guidePathToModulePath(pathname);
  const guide = getModuleGuide(modulePath);

  return (
    <div className="mx-auto max-w-3xl pb-10 pt-2 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="shrink-0 rounded-xl bg-primary/10 p-2.5 text-primary">
            <HelpCircle size={22} strokeWidth={2.25} aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <h1 className="text-lg font-semibold text-foreground">{txt('guide.pageTitle')}</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {guide?.intro ?? txt('guide.fallback')}
            </p>
          </div>
        </div>
        <Link
          to={modulePath}
          className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 self-start rounded-lg border border-input bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          <ArrowLeft size={14} strokeWidth={2.25} aria-hidden />
          {txt('guide.backToModule')}
        </Link>
      </div>

      {!guide ? (
        <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
          {txt('guide.fallback')}
        </div>
      ) : (
        <div className="space-y-4">
          {GUIDE_SECTION_IDS.map((id) => {
            const body = guide[id];
            if (!body?.trim()) return null;
            return (
              <section
                key={id}
                className="space-y-3 rounded-xl border border-border bg-card p-5"
              >
                <h2 className="border-b border-primary/20 pb-2 text-sm font-semibold text-primary">
                  {txt(SECTION_TITLE_KEYS[id])}
                </h2>
                <GuideBody text={body} />
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
