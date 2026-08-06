import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

export interface VirtualizedRowsOptions {
  /** Số dòng sẽ render. */
  count: number;
  /** Chiều cao ước lượng mỗi dòng (px) — dùng khi không đo động. */
  estimateSize: number;
  /** Bật virtual scroll khi `count` vượt ngưỡng này. */
  threshold: number;
  overscan?: number;
  /** true: đo động chiều cao từng dòng qua `measureElement` (cần cho dòng có kích thước khác nhau, vd full-span row). */
  dynamicSize?: boolean;
}

export interface VirtualRowItem {
  index: number;
  size: number;
  start: number;
}

export interface VirtualizedRowsResult {
  /** Ref gắn vào phần tử scroll container. */
  scrollElRef: React.RefObject<HTMLDivElement | null>;
  useVirtual: boolean;
  items: VirtualRowItem[];
  totalSize: number;
  /** Gắn vào `ref` của mỗi `<tr>` khi `useVirtual` true (đo/track kích thước thật). */
  measureElement: ((el: HTMLElement | null) => void) | undefined;
}

/**
 * Gộp logic `useVirtualizer` + kỹ thuật "2 hàng đệm top/bottom" dùng chung giữa
 * GenericTable/EmbeddedChildDataGrid/StatsDataGrid (trước đây mỗi nơi tự viết lại
 * gần giống hệt nhau). Khi count &lt;= threshold, trả về items "giả" (không virtual)
 * để nơi gọi luôn dùng chung 1 code path render.
 */
export function useVirtualizedRows({
  count,
  estimateSize,
  threshold,
  overscan = 10,
  dynamicSize = false,
}: VirtualizedRowsOptions): VirtualizedRowsResult {
  const scrollElRef = useRef<HTMLDivElement>(null);
  const useVirtual = count > threshold;

  // TanStack Virtual intentionally returns non-memoizable helpers; safe here.
  // eslint-disable-next-line react-hooks/incompatible-library -- useVirtualizer
  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => scrollElRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  if (!useVirtual) {
    const items: VirtualRowItem[] = Array.from({ length: count }, (_, i) => ({
      index: i,
      size: estimateSize,
      start: 0,
    }));
    return { scrollElRef, useVirtual, items, totalSize: 0, measureElement: undefined };
  }

  return {
    scrollElRef,
    useVirtual,
    items: virtualizer.getVirtualItems(),
    totalSize: virtualizer.getTotalSize(),
    measureElement: dynamicSize ? virtualizer.measureElement : undefined,
  };
}
