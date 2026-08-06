import React from 'react';
import { cn } from '@/lib/utils';

export interface FieldMessagesOptions {
  /** Chú thích dưới ô — quy tắc / hệ quả. Luôn hiển thị, kể cả khi đang gõ hoặc đang lỗi. */
  hint?: React.ReactNode;
  /** Thông báo lỗi validation. */
  error?: string;
}

export interface FieldMessageIds {
  hintId?: string;
  errorId?: string;
  /** Ghép cho `aria-describedby` — lỗi trước, hint sau (đúng thứ tự DOM). */
  describedBy?: string;
}

/**
 * Sinh id cho hint / error và chuỗi `aria-describedby` tương ứng.
 * Dùng chung cho mọi form control để không mỗi nơi tự nối một kiểu.
 */
export function useFieldMessageIds(
  baseId: string,
  { hint, error }: FieldMessagesOptions,
): FieldMessageIds {
  const hintId = hint ? `${baseId}-hint` : undefined;
  const errorId = error ? `${baseId}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;
  return { hintId, errorId, describedBy };
}

interface FieldMessagesProps extends FieldMessagesOptions, FieldMessageIds {
  className?: string;
}

/**
 * FieldMessages – khối chữ dưới form control: lỗi trước, chú thích sau.
 *
 * Quy ước (xem `docs/UI-CONVENTIONS.md` § Quy tắc viết chữ gợi ý):
 * - Đặt **dưới** control, không đặt trên — để `FormGrid cols={2}` giữ được căn hàng
 *   giữa nhãn và ô nhập của hai cột.
 * - Có lỗi thì **vẫn hiện hint**: hint thường chính là cách sửa lỗi.
 * - Hint dùng `text-caption` (11px) để tách khỏi nhãn/placeholder (12px) bằng **cỡ chữ**,
 *   không bằng opacity — `text-muted-foreground/70` rơi xuống ~2,6:1, dưới ngưỡng đọc được.
 */
const FieldMessages: React.FC<FieldMessagesProps> = ({
  hint,
  error,
  hintId,
  errorId,
  className,
}) => {
  if (!hint && !error) return null;

  return (
    <div className={cn('space-y-1', className)}>
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-destructive mt-1">
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className="text-caption text-muted-foreground leading-snug mt-1">
          {hint}
        </p>
      )}
    </div>
  );
};

export default FieldMessages;
