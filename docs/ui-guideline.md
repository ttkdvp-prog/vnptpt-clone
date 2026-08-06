# UI guideline (mục lục)

Quy ước giao diện 5F ERP. Tài liệu đầy đủ nằm ở các file dưới — đọc theo nhu cầu, không nhân bản nội dung dài vào đây.

## Nguồn chính

| Tài liệu | Khi nào đọc |
|----------|-------------|
| [`UI-CONVENTIONS.md`](./UI-CONVENTIONS.md) | Dialog, drawer, toolbar, stats, import/export, media, section order |
| [`view-types.md`](./view-types.md) | Catalog ViewType (table, form, detail, dashboard…) |
| [`data-types.md`](./data-types.md) | DataTypeId — widget field / cell |
| [`patterns-button-labels.md`](./patterns-button-labels.md) | Nhãn nút chuẩn |
| [`patterns-data-table-actions.md`](./patterns-data-table-actions.md) | Action trên bảng |
| [`patterns-permissions.md`](./patterns-permissions.md) | Ẩn/hiện theo quyền |
| [`checklist-module.md`](./checklist-module.md) | Checklist khi làm CRUD mới |
| [`GUIDE-CONTENT.md`](./GUIDE-CONTENT.md) | Nội dung hướng dẫn / copy |

Cursor rule luôn apply: `.cursor/rules/06-project-5f.mdc`.

## Tóm tắt nhanh (đừng thay thế UI-CONVENTIONS)

- **Dialog:** `DIALOG_SIZE` + `AppDialog` / `ConfirmDialog` — không tự invent confirm modal.
- **Drawer:** `GenericDrawer`, width từ `lib/dialog-sizes.ts`, `stackLevel` khi xếp chồng.
- **Section:** title primary (`text-primary`) mặc định.
- **Toolbar filters:** `FilterChipMultiSelect` / `FilterChipSingleSelect` — không tự viết multi-select.
- **Stats table:** max 10 body rows viewport; dùng `StatsDataGrid` / `StatsTableCard`.
- **Detail:** Summary → DetailToolbar → sections → child tables → `DetailSystemSection` cuối.
- **Radius:** `rounded-lg` controls · `rounded-xl` cards · `rounded-2xl` modal/drawer.
- **Import:** `ImportDialog` + `lib/import/`.
- **Ảnh:** `SingleImageInput` + `lib/media/`.

## Component entry

```ts
import {
  GenericTable,
  GenericDrawer,
  RhfDataField,
  DetailSection,
  FormGrid,
} from '@/components/views';
```

UI primitives thấp hơn: `@/components/ui/*`.
