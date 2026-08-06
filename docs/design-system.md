# Design System

Nguồn sự thật CSS: [`app/globals.css`](../app/globals.css).  
Audit / hardening: [`design-token-audit.md`](./design-token-audit.md).  
UI conventions: [`UI-CONVENTIONS.md`](./UI-CONVENTIONS.md).

## Dual color system

Hai lớp song song (pattern shadcn + Tailwind v4) — **phải sync cả hai** khi thêm màu:

| Lớp | Dạng | Ví dụ |
|-----|------|--------|
| `@theme --color-*` | `hsl(...)` đầy đủ | `bg-primary`, `text-success` |
| `:root` / `.dark` channels | HSL không `hsl()` | `hsl(var(--primary))` |

## Typography scale

Hai nhóm: **dense chrome** (Form / Detail / List) và **reading / chrome lớn**. Không dùng 12–13px cho prose dài.

| Class / utility | ~px @16 | Use |
|-----------------|---------|-----|
| `text-caption` | 11 | Badge count trên chip tương phản cao, chart tick/meta siêu nhỏ — **không** label/value/prose |
| `text-xs` | 12 | Field label, **form control value**, toolbar, helper, form error, section title |
| `text-body-sm` | 13 | Detail value, list/stats body cell |
| `text-sm` | 14 | Button, dialog/sheet body, dropdown chrome |
| `text-base` | 16 | Drawer / page title |
| `text-lg` | 18 | Dashboard / empty hero |

### Dense roles (Form / Detail / List)

| Role | Size | Weight | Color | Case / tracking |
|------|------|--------|-------|-----------------|
| Field label | `text-xs` | `font-medium` | `text-muted-foreground` | Sentence case |
| Form control value | `text-xs` | **`font-normal`** | `text-foreground` | Sentence case |
| Detail / List value | `text-body-sm` | **`font-normal`** | `text-foreground` | Sentence case |
| Error | `text-xs` | `font-medium` | `text-destructive` | Sentence case |
| Section title | `text-xs` | `font-bold` | `text-primary` | `uppercase` + `tracking-wider` |

**Value luôn `font-normal`.** Form value dùng `text-xs` (1 bước denser hơn Detail) vì chữ trong ô `h-10`+border trông to hơn cùng px trên text phẳng — để Form/Detail khớp cảm quan. Hierarchy label/value bằng màu (muted vs foreground). Do not “fix” values to `font-medium`.

### Muted contrast (WCAG AA @ 12px)

Light `--muted-foreground` = `215 16% 46%` (không hạ dưới L 46%):

| Nền | Ratio | AA normal text (≥4.5:1) |
|-----|-------|-------------------------|
| `card` / white | ≈4.89:1 | PASS |
| `background` 98% | ≈4.68:1 | PASS |

Dark `217 20% 68%` trên bg/card ≈7.45–7.60:1 — PASS. Sync cả `@theme --color-muted-foreground` và `:root` channels khi đổi.

- Root preference: `data-text-size` → 14 / 16 / 18 px trên `<html>`.
- Font stacks: [`lib/theme/fonts.ts`](../lib/theme/fonts.ts); runtime via `ThemeSynchronizer`.
- **Freeze:** không thêm `text-[Npx]` mới ngoài print/PDF. Arbitrary cũ chỉ thay khi map rõ (vd. `text-[13px]` → `text-body-sm`).
- Weight: ưu tiên `font-medium` / `font-semibold`; `font-bold` cho KPI lớn / section title.

## Color palette & theme

| Item | Location |
|------|----------|
| Semantic chrome | primary, secondary, muted, accent, destructive, card, border, ring |
| Status (D2) | `success`, `warning`, `info` (+ foreground) |
| Primary runtime | [`lib/theme-utils.ts`](../lib/theme-utils.ts) |
| Charts | [`lib/constants/chart-colors.ts`](../lib/constants/chart-colors.ts) — hex cố định, ngoài UI chrome |

CTA trên nền primary: `text-primary-foreground` — **không** `text-white`.  
Required asterisk: `text-destructive` — **không** `text-red-500`.

## Radius

| Token / class | Use |
|---------------|-----|
| `rounded-lg` | Input, button, chip vuông |
| `rounded-xl` | Card, panel, dropdown |
| `rounded-2xl` | Modal, drawer, dialog, MainCard |
| `rounded-full` | Avatar, count pill |

Tránh `rounded-md` trên control mới.

## Shadow (locked)

| Token | Use |
|-------|-----|
| `shadow-sm` … `shadow-xl` | Elevation chung |
| `shadow-soft` / `shadow-medium` | Card / soft lift |
| `shadow-ultra` | Drawer panel |
| `shadow-sticky` | Drawer footer / sticky table chrome |
| `shadow-2xl` (+ optional `shadow-{variant}/20` on CTA) | ConfirmDialog panel / confirm button |

Không invent shadow token mới cho một module.

## Icon size

[`lib/icon-sizes.ts`](../lib/icon-sizes.ts):

| Token | px | Use |
|-------|-----|-----|
| `micro` | 12 | Dense UI |
| `compact` | 14 | Toolbar / filter |
| `default` | 16 | List actions |
| `prominent` | 20 | Dialog close |
| `feature` | 24 | Empty / confirm well |

Toolbar list actions: [`lib/toolbar-list-actions.ts`](../lib/toolbar-list-actions.ts).

## Control height / Button

[`components/ui/Button.tsx`](../components/ui/Button.tsx): base **`rounded-lg`**.

| Size | Height | Use |
|------|--------|-----|
| `sm` | `h-8` | Toolbar, filter chip, list actions |
| `default` | `h-10` | Form controls |
| `lg` | `h-11` | Confirm dialog actions |
| `icon` | `h-10 w-10` | Icon-only |

Không override `h-*` / `rounded-md` trên Button trừ khi product ghi nhận exception.

## Table density

[`lib/table-density.ts`](../lib/table-density.ts) — `compact` | `default` | `comfortable`.

Stats / detail-sub: [`lib/stats-table.ts`](../lib/stats-table.ts), [`lib/detail-sub-table.ts`](../lib/detail-sub-table.ts) (viewport riêng; tham chiếu density default).

## Dialog / drawer / z-index

[`lib/dialog-sizes.ts`](../lib/dialog-sizes.ts) — `DIALOG_SIZE`, drawer widths, z-index.

## Breakpoints & responsive

Tailwind defaults. Mobile: `MobileBottomNav`, `MobileFilterSheet`, `MobileListCard`. Safe-area trong `globals.css`.

## Animation

Framer Motion via `LazyMotion` + `domAnimation` trong `providers/app-shell.tsx`.

## Theme provider model

Zustand UI store + CSS variables + `ThemeSynchronizer`. Không React Theme Context riêng.

## Related

- [`ui-guideline.md`](./ui-guideline.md)
- [`.cursor/rules/06-project-5f.mdc`](../.cursor/rules/06-project-5f.mdc)
- [`checklist-module.md`](./checklist-module.md) — Design System freeze rules
