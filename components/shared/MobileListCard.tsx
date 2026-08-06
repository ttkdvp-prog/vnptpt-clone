import React, { useState } from 'react';
import * as m from 'framer-motion/m';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Card một dòng cho danh sách mobile (GenericTable `renderMobileCard`).
 * Tách vùng bấm mở chi tiết (body) và vùng chọn / thao tác (footer) để tránh mở trùng menu và đồng bộ layout giữa các module.
 *
 * - Body: `role="button"` — tap mở detail / record.
 * - Footer: checkbox trái + actions phải — `stopPropagation` để không kích hoạt body; dùng cho hàng “Thao tác” giống summary detail.
 * - Swipe trái (nếu có `swipeActions`): lộ 1-2 nút thao tác nhanh (sửa/xóa) phía sau card.
 * - `expandedContent` (nếu có): chevron toggle để xem thêm chi tiết ngay trong card, không cần mở drawer.
 */
export interface MobileListCardProps {
  selected?: boolean;
  onBodyClick?: () => void;
  onBodyKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  /** Avatar hoặc icon dẫn đầu */
  leading: React.ReactNode;
  /** Hàng tiêu đề (vd. tên + badge trạng thái canh phải) */
  titleRow: React.ReactNode;
  /** Dòng phụ dưới tiêu đề (vd. mã, chức danh) */
  subheader?: React.ReactNode;
  /** Một dòng meta gọn (vd. mã · phòng ban) */
  metaLine?: React.ReactNode;
  /** Thanh cuối: thường checkbox trái */
  footerStart?: React.ReactNode;
  /** Thanh cuối: menu / nút phải */
  footerEnd?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Nội dung ẩn/hiện qua chevron — không truyền = không có chevron. */
  expandedContent?: React.ReactNode;
  /** 1-2 nút thao tác nhanh lộ ra khi vuốt trái (vd sửa/xóa). Không truyền = không hỗ trợ swipe. */
  swipeActions?: React.ReactNode;
}

const SWIPE_REVEAL_WIDTH = 96;

export function MobileListCard({
  selected,
  onBodyClick,
  onBodyKeyDown,
  leading,
  titleRow,
  subheader,
  metaLine,
  footerStart,
  footerEnd,
  className,
  bodyClassName,
  expandedContent,
  swipeActions,
}: MobileListCardProps) {
  const hasFooter = footerStart != null || footerEnd != null;
  const [expanded, setExpanded] = useState(false);

  const card = (
    <div
      className={cn(
        'relative bg-card rounded-xl border shadow-sm transition-all active:scale-[0.98]',
        hasFooter ? 'pt-3 px-3 pb-1.5' : 'p-3',
        selected ? 'border-primary ring-2 ring-primary/10' : 'border-border',
        className
      )}
    >
      <div className="flex items-start gap-1">
        <div
          role="button"
          tabIndex={0}
          onClick={onBodyClick}
          onKeyDown={onBodyKeyDown}
          className={cn(
            'w-full rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2',
            bodyClassName
          )}
        >
          <div className="flex items-start gap-3.5">
            {leading}
            <div className="min-w-0 flex-1 space-y-1">
              {titleRow}
              {subheader}
              {metaLine}
            </div>
          </div>
        </div>
        {expandedContent != null && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
            aria-expanded={expanded}
            className="shrink-0 p-1.5 -mr-1 -mt-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ChevronDown size={16} className={cn('transition-transform', expanded && 'rotate-180')} />
          </button>
        )}
      </div>

      {expanded && expandedContent != null && (
        <div className="mt-2 pt-2 border-t border-border/60 text-body-sm text-muted-foreground">
          {expandedContent}
        </div>
      )}

      {hasFooter && (
        <div
          role="group"
          className="mt-3 flex min-h-[44px] items-center justify-between gap-2 border-t border-border pt-2 pb-1"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex min-h-0 min-w-0 flex-1 items-center justify-start gap-1">{footerStart}</div>
          {footerEnd != null && (
            <div className="flex shrink-0 items-center justify-end">{footerEnd}</div>
          )}
        </div>
      )}
    </div>
  );

  if (!swipeActions) return card;

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div
        className="absolute inset-y-0 right-0 flex items-stretch"
        style={{ width: SWIPE_REVEAL_WIDTH }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {swipeActions}
      </div>
      <m.div
        drag="x"
        dragConstraints={{ left: -SWIPE_REVEAL_WIDTH, right: 0 }}
        dragElastic={0.05}
        dragSnapToOrigin={false}
        dragTransition={{ bounceStiffness: 500, bounceDamping: 40 }}
        className="relative bg-card"
      >
        {card}
      </m.div>
    </div>
  );
}
