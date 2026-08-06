/**
 * Class Tailwind dùng chung cho input dạng khung viền (Input, NumericFormatInput,
 * CurrencyInput, PercentInput, DatePicker, TimeInput, DateTimeInput, MonthYearPicker,
 * ColorPickerInput, đổi mật khẩu…). Trước đây mỗi file tự lặp lại chuỗi này (23 bản
 * sao / 19 file), một vài bản đã lệch màu viền (`border-input` thay vì `border-border`)
 * và độ dày focus ring khác nhau — gom về một nguồn để tránh lệch tiếp.
 */
export const FORM_CONTROL_BASE =
  'flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 disabled:cursor-not-allowed disabled:opacity-50';

export const FORM_CONTROL_PLACEHOLDER = 'placeholder:text-placeholder placeholder:italic';

export const FORM_CONTROL_ERROR = 'border-destructive focus-visible:ring-destructive';
