# Design Token Audit & Hardening (D1 → D2)

**Ngày:** 2026-07-16  
**Phạm vi:** UI chrome tokens + shared primitives + permission-matrix + chuc-vu list/detail  
**Không:** redesign, đổi business logic, mass-xóa toàn bộ `text-[Npx]`, tạo Generic Component mới, đổi Business Foundation

## D1 — Kết luận ngắn

Semantic color + drawer sizing đã ổn. Drift chính: Button `sm`/`rounded-md`, thiếu type/icon/status tokens tập trung, permission-matrix + badge hand-rolled.

## D2 — Trạng thái hardening

| Phase | Nội dung | Status |
|-------|----------|--------|
| D2.1 | Typography / icon / success-warning-info / density / shadow-sticky + docs | **Done** |
| D2.2 | Button, ConfirmDialog, EnumBadge, GenericDrawer, asterisk, text-white→foreground, DetailToolbar | **Done** |
| D2.3 | permission-matrix type/icon/pill; chuc-vu EnumBadge shared config | **Done** |
| D2.4 | Automated test + eslint changed files; manual visual smoke recommended | **Done** (code) |
| D2.5 | Freeze checklist + residual drift | **Done** |

## Token inventory (locked)

Xem bảng chuẩn trong [`design-system.md`](./design-system.md).

| Area | Source |
|------|--------|
| Typography utilities | `app/globals.css` (`.text-caption`, `.text-body-sm`) + Tailwind scale |
| Icon scale | `lib/icon-sizes.ts` |
| Status colors | `success` / `warning` / `info` in `app/globals.css` |
| Table density | `lib/table-density.ts` |
| Toolbar list actions | `lib/toolbar-list-actions.ts` |
| Shadow sticky | `--shadow-sticky` / `shadow-sticky` |

## Files changed (summary)

- **Tokens/docs:** `app/globals.css`, `lib/icon-sizes.ts`, `lib/table-density.ts`, `lib/toolbar-list-actions.ts`, `lib/stats-table.ts`, `docs/design-system.md`, `docs/UI-CONVENTIONS.md`, `docs/checklist-module.md` (§16b)
- **Shared:** `Button`, `EnumBadge`, `ConfirmDialog`, `GenericDrawer`, `GenericTable`, `DetailToolbar`, `FormDrawerFooter`, `GenericToolbar`, Import/Export dialogs, pagination, `EmbeddedChildDataGrid`, inputs asterisk, `DateRangePicker`
- **Modules:** `permission-matrix.tsx`, `chuc-vu-list.tsx`, `chuc-vu-detail.tsx`, `utils/position-badges.ts`

## D2.4 Visual verification checklist

Automated: `npm run test` — 131 passed; eslint on touched TS files — clean.

Manual smoke (recommended after deploy/dev):

| Màn | Focus |
|-----|--------|
| Nhân viên | Toolbar h-8, table, drawer title `text-base`, form asterisk |
| Phòng ban | Hierarchy, EnumBadge, drawer footer shadow |
| Chức vụ | EnumBadge list+detail, buttons |
| Công ty | Form save CTA foreground |
| Phân quyền | Matrix type/icon/pills |
| Dashboard | No broken primary CTAs |

## Residual drift (cố ý giữ)

| Item | Lý do |
|------|--------|
| Print / PDF `text-[Npt]`, hex | Surface riêng, ngoài UI chrome |
| Chart series hex | Legend cố định; dùng `CHART_COLORS` |
| Một số Lucide `size` ngoài 5 bậc ở layout/nav | Không mass-migrate Layout trong D2 |
| Horizontal sticky column soft shadow | Dùng `shadow-soft` (không invent thêm token X/Y) |
| Arbitrary typography còn lại ngoài matrix/list đã sửa | Chỉ thay khi map 1-1 rõ — không xóa hết ~47 hits |
| EnumBadge legacy color keys (`emerald`, …) | Alias → semantic; modules cũ không break |
| Scrollbar hex trong `globals.css` | Low polish, ngoài scope D2 |

## Freeze rule

Không thêm arbitrary typography / `rounded-md` control / raw status palette trong **shared UI** hoặc module mới. Xem checklist §16b.

---

## D3 — Design System Hardening (2026-07-16)

| Item | Status |
|------|--------|
| Button `sm=h-8` + `rounded-lg` | Verified locked in `Button.tsx` |
| Typography — remove leftover `text-[11px]` in Layout → `text-caption` | Done |
| Icon — `GenericToolbar` Lucide sizes → `ICON_SIZE` 12/14 | Done |
| Semantic colors (`success` / `warning` / `info`) + EnumBadge | Keep D2; no redesign |
| ConfirmDialog / GenericDrawer / EnumBadge shadows | Documented in `design-system.md` |
| Docs sync | `design-system.md` + this file |

Không redesign layout / Business Foundation.
