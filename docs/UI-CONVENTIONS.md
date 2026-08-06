# Quy ước giao diện (UI Conventions)

## Trang submenu (dashboard nhóm)

- **Tên nhóm module** (vd. "Nhân sự", "Bảo mật & cấu hình" trên Hệ thống) **luôn dùng màu primary** (`text-primary`).
- Áp dụng cho mọi trang submenu có danh sách nhóm + module (Hệ thống, và sau này Hành chính, Nhân sự, Marketing, Tài chính, Mua hàng, Kho vận khi đã có trang thật).
- Cách làm: dùng component **`ModuleDashboardLayout`** (`components/dashboard/ModuleDashboardLayout.tsx`), truyền `groups` với `groupTitle` và `items`. Component đã style `groupTitle` bằng `text-primary`.
- Trang placeholder submenu (chưa xây): tên nhóm cũng dùng primary qua **`ComingSoonLayout`** với prop `titlePrimary={true}` (vd. trong `SubmenuPlaceholder` hoặc `ModuleDashboardLayout`).

## Dialog và Drawer (kích thước thống nhất)

- **Nguồn constant:** `lib/dialog-sizes.ts`.
- **Dialog (modal giữa màn hình):** dùng `DIALOG_SIZE`:
  - `CONFIRM` (max-w-sm): xác nhận đơn giản (xóa, hủy thao tác).
  - `COMPACT` (max-w-md): lựa chọn nhanh (picker đơn giản).
  - `MEDIUM` (max-w-lg): nội dung vừa.
  - `LARGE` (max-w-2xl): import, export, upload (max-h 85vh).
  - `XL` (max-w-4xl): popup drill-down / preview bảng dữ liệu (tab Thống kê).
  - `WIDE` (max-w-6xl): preview rộng, nhiều cột.
- **Shell dialog dùng chung:** `AppDialog` (`components/shared/AppDialog.tsx`) — z-index `Z_INDEX_DATA_DIALOG_CLASS` (180), chiều cao `DIALOG_MAX_HEIGHT`.
- **Phân tầng overlay:** drawer mặc định (60) → data dialog (180) → drawer trên data dialog (190) → confirm modal (200). Drawer mở từ popup drill-down: `GenericDrawer` với `overlayTier="aboveDataDialog"`.
- **Drawer (slide từ phải):**
  - **Form và Detail dùng chung kích thước:** 48rem (768px). Dùng `DRAWER_WIDTH_FORM` / `DRAWER_WIDTH_DETAIL` hoặc `getDrawerWidthClass(0)`.
  - **Drawer chồng:** khi mở drawer trên một drawer đang mở (vd. Form mở từ Detail), drawer ở trên dùng **44rem** và z-index cao hơn. Truyền `stackLevel={1}` (hoặc cao hơn) cho `GenericDrawer`; width lấy từ `getDrawerWidthClass(stackLevel)`.
  - **Drawer rộng (form + panel phụ):** `DRAWER_WIDTH_WIDE` (82rem) — form phức tạp hai cột.
  - **Detail compact (nested):** `DRAWER_WIDTH_DETAIL_SMALL` (36rem) — detail mở từ drawer khác khi cần hẹp.
- **GenericDrawer:** prop `stackLevel` (mặc định 0). `stackLevel > 0` → width 44rem, z-index tăng theo level.
- **Icon tiêu đề drawer (Form & Detail) — bắt buộc:** truyền `icon` (Lucide) trên mọi `GenericDrawer` form/detail. Size: **`ICON_SIZE.prominent` (20)** từ `lib/icon-sizes.ts`. Không dùng `size={18}` ad-hoc. Tham chiếu: `nhan-vien-form` / `chuc-vu-detail`.

## Section trong Form và Detail

- **Tiêu đề section luôn màu primary.** Dùng component **`Section`** (hoặc **`FormSection`** / **`DetailSection`**) trong form và detail.
- **Mặc định:** `variant="primary"` (không cần truyền) → tiêu đề `text-primary`, border `border-primary/20`.
- **Ngoại lệ:** Chỉ dùng `variant="muted"` khi section thực sự phụ, ít cần nhấn mạnh (ít dùng).
- **Icon tiêu đề section — bắt buộc:** mọi `FormSection` / `DetailSection` phải có `icon` (Lucide), size **`ICON_SIZE.compact` (14)**. Không bỏ icon vì section “đơn giản”. Form và Detail cùng nhóm nên dùng cùng icon (vd. hợp đồng: `FileSignature` / `Briefcase` / `Wallet` / `StickyNote`).
- **Icon từng trường — bắt buộc:**
  - **`DetailField`:** mọi field nghiệp vụ phải có `icon` — size **`ICON_SIZE.micro` (12)**. Dùng `fieldIcon(LucideIcon)` từ `lib/field-icon.tsx` hoặc `<Icon size={ICON_SIZE.micro} />`.
  - **Form label** (`Input` / `RhfDataField` / `Textarea` / `Combobox` / …): bắt buộc `icon` **cùng Lucide** với `DetailField` tương ứng. Map dùng chung: `features/.../core/*-field-icons.ts`.
  - **Ngoại lệ hẹp:** widget không có label (toggle trong hàng tùy chỉnh, upload thumbnail thuần không hiện label) — không bắt buộc.
- Áp dụng thống nhất cho mọi module (nhân viên, cấp bậc, chức vụ, v.v.) để giao diện đồng bộ.

## Trường bắt buộc trong form (Required fields)

- **Trường bắt buộc phải có dấu sao (*) bên cạnh label.** Component **Input** và **Textarea** (`components/ui/`) đã hỗ trợ prop **`required`**: khi `required={true}` sẽ render `<span className="text-red-500 ml-0.5">*</span>` cạnh label.
- **Quy ước:** Mọi form (drawer, dialog, page form) phải truyền **`required`** cho các trường bắt buộc (vd. tên, mã, nội dung câu hỏi). Validation vẫn dùng schema (zod, yup, v.v.); prop `required` chỉ dùng để hiển thị dấu sao, giúp người dùng nhận biết trường bắt buộc.
- **Áp dụng:** Tất cả module (thiết lập khóa học, nhân viên, hợp đồng, v.v.) dùng chung quy ước này.

## Quy tắc viết chữ gợi ý (placeholder & hint)

Ba loại chữ quanh một ô nhập, mỗi loại một nhiệm vụ:

| Loại | Nhiệm vụ | Sống sót khi gõ? |
|------|----------|------------------|
| **Nhãn** (label) | Trường này là gì | ✅ |
| **Chữ gợi ý** (placeholder) | Câu trả lời *trông như thế nào* | ❌ mất khi gõ ký tự đầu |
| **Chú thích** (hint) | *Quy tắc* và *hệ quả* — điều người dùng cần trong lúc gõ | ✅ |

> **Nguyên tắc số một: chữ gợi ý không bao giờ được là một câu trả lời hợp lệ cho chính trường đó.** Nếu người dùng đọc nó và nghĩ "đúng rồi, để nguyên" — thì nó sai. Đây là lý do `Việt Nam` (Quốc tịch), `Kinh` (Dân tộc), `0` (Số người phụ thuộc) đã bị bỏ: chúng khiến người nhập tưởng ô đã điền, bỏ qua, và lưu ra hồ sơ trống.

### Bảng quy tắc theo loại trường

| Loại trường | Mẫu | ✅ Đúng | ❌ Sai |
|---|---|---|---|
| Văn bản **có định dạng** (mã, SĐT, MST, CCCD) | `VD: <ví dụ hiển nhiên là giả>` | `VD: 0901234567` · `VD: TP_IT` | `090...` · `(+84) ...` · `079095012345` |
| Văn bản **không có định dạng** (họ tên, ghi chú) | **Bỏ trống** | *(không placeholder)* | `Nguyễn Văn A` · `Nhập tiêu đề thông báo` |
| Văn bản **ghép nhiều phần** (địa chỉ, chế độ) | Liệt kê các phần, không dấu kết | `Số nhà, đường, phường/xã, tỉnh/thành` | `Số nhà, đường...` |
| **Chọn một** (Combobox) | `Chọn <đối tượng đầy đủ>` | `Chọn chức vụ` | `Chọn...` · `Chọn một mục...` |
| **Chọn một, rỗng có nghĩa riêng** | `— <ý nghĩa khi rỗng> —` | `— Phòng ban gốc —` | `Chọn hồ sơ (tùy chọn)` |
| **Chọn nhiều** (MultiSelect) | `Chọn <đối tượng>` | `Chọn chức vụ được xem` | `Để trống = tất cả chức vụ` |
| **Ngày / giờ** | **Bỏ trống** — picker tự hiện định dạng | *(không placeholder)* | `dd/mm/yyyy` |
| **Số / tiền tệ** | **Bỏ trống** — đơn vị đưa vào nhãn hoặc hậu tố | *(không placeholder)* | `0` · `VD: 1` |
| **Mật khẩu** | **Bỏ trống**, quy tắc xuống hint | hint: `Tối thiểu 6 ký tự` | `••••••••` · `Ít nhất 6 ký tự` |
| **Tìm kiếm** | `Tìm theo <2–3 trường>` | `Tìm theo tên, mã NV, email…` | `Tìm kiếm . . .` |
| **Tệp / ảnh** | Câu lệnh ngắn, định dạng xuống hint | `Kéo thả hoặc bấm để chọn` | `Ảnh 3x4` |

### Quy định hình thức

1. **Tiền tố ví dụ dùng `VD: `** (có một dấu cách). Không `Ví dụ:`, không ví dụ trần. Tính lặp lại chính là điểm mạnh: khi **mọi** ví dụ đều mở đầu bằng hai chữ đó, người dùng học được một lần rằng "chữ xám này không phải dữ liệu của tôi".
2. **Placeholder ô chọn không có `...`** — chevron đã báo "bấm để mở", và trigger `Combobox` có `truncate` nên ba chấm là ba ký tự bị cắt trước tiên.
3. **Chỉ dùng ký tự `…` (U+2026)**, không `...`, tuyệt đối không `. . .`. Và chỉ khi danh sách **cố ý còn thiếu**: `VD: AWS, PMP, IELTS…` đúng; `VD: Giám đốc…` sai (chỉ có một ví dụ).
4. **Placeholder ≤ 40 ký tự.** Ô trong `FormGrid cols={2}` của drawer 48rem chỉ hiện ~50 ký tự rồi `<input>` cắt thẳng, không có dấu hiệu.
5. **Hint ≤ 80 ký tự**, một dòng. Dài hơn thì đó là tài liệu hướng dẫn, không phải hint.
6. **Ví dụ số phải trông giả một cách hiển nhiên** — dùng dãy tăng dần `0901234567`, `012345678901`. Không dùng số trông thật (`079095012345` có `079` đúng là mã tỉnh TP.HCM): vừa bị tưởng là dữ liệu, vừa bị copy nguyên vào ô.
7. **Một bộ ví dụ chuẩn toàn app:** `VD: ten@congty.vn` · `VD: 0901234567` · `https://…`.
8. **Không viết `(tùy chọn)` / `(nếu có)`.** Dấu `*` đỏ đã là tín hiệu bắt buộc duy nhất; ghi thêm ở vài trường khiến người dùng hiểu nhầm những trường còn lại là bắt buộc.
9. **Không đặt quy tắc validation vào placeholder** — nó phải còn nhìn thấy khi người dùng đang gõ và khi bị báo lỗi. Nơi của nó là hint.

### Khi nào **bỏ hẳn** placeholder

Bỏ hẳn tốt hơn viết dở. Bỏ khi:

1. Ví dụ là một câu trả lời hợp lý cho trường đó (`Việt Nam`, `Kinh`, `0`).
2. Nó chỉ diễn đạt lại nhãn (`Nhập tiêu đề thông báo` dưới nhãn "Tiêu đề").
3. Trường không có định dạng nào để dạy (họ tên, ghi chú, mô tả).
4. Nội dung cần nói là một *quy tắc* — chuyển xuống hint.
5. Nội dung chỉ là `(tùy chọn)` / `(nếu có)`.

Nhãn đã bắt buộc có icon Lucide và dấu `*` đỏ khi bắt buộc — với phần lớn trường, thế là đủ. **Ô trống rõ ràng là ô chưa nhập; ô có chữ xám thì không.**

Nếu ~99% bản ghi có cùng một giá trị (Quốc tịch = "Việt Nam"), đừng giả vờ bằng placeholder — **đặt nó làm `defaultValues` thật** để người dùng thấy chữ đen và sửa được. Xem `getDefaultEmployeeCreateFormValues()` (`features/he-thong/nhan-vien/utils/employee-to-form.ts`).

### Cách dùng trong code

- Mọi chuỗi phải đi qua `txt()`; ESLint chặn hard-code chữ tiếng Việt ở `placeholder=` / `hint=`.
- Mọi form control đều có prop **`hint`** (`Input`, `Textarea`, `Combobox`, `AsyncCombobox`, `MultiSelect`, `FormField`, các picker, `DataField` → cả 34 data type). Hint render **dưới** control qua `components/ui/FieldMessages.tsx`, nối `aria-describedby` cùng với error, và **vẫn hiện khi có lỗi** (hint thường chính là cách sửa lỗi).
- Mặc định chung của ô chọn là `field.selectEmpty` = `— Chưa chọn —` (`lib/text/ui.ts`). Nó **cố ý vô dụng** để lập trình viên phải truyền chuỗi cụ thể.
- `DataField` **không** chuyển tiếp `placeholder` cho `number`/`decimal`/`currency`/`percent` (value bị ép về `0` nên ô không bao giờ rỗng) và `date`/`time`/`datetime`/`month_year` (input native tự vẽ). Với các kiểu này dùng `hint`.
- Hàng rào: `lib/text/__tests__/placeholder-copy.test.ts` — chạy `npm test`.

## Design system (border radius, button, error)

Nguồn token đầy đủ: [`design-system.md`](./design-system.md). Audit: [`design-token-audit.md`](./design-token-audit.md).

- **Typography:** `text-caption` / `text-body-sm` / `text-xs` / `text-sm` / `text-base` / `text-lg`. **Không** thêm `text-[Npx]` mới ngoài print/PDF.
- **Typography Form / Detail / List (dense chrome):**

| Role | Size | Weight | Color |
|------|------|--------|-------|
| Field label | `text-xs` | `font-medium` | `text-muted-foreground` |
| Form control value | `text-xs` | `font-normal` | `text-foreground` |
| Chữ gợi ý (placeholder) | `text-xs` | `font-normal` + `italic` | `text-placeholder` |
| Chú thích (hint) — dưới control | `text-caption` | `font-normal` | `text-muted-foreground` |
| Detail / List value | `text-body-sm` | `font-normal` | `text-foreground` |
| Error | `text-xs` | `font-medium` | `text-destructive` |
| Section title | `text-xs` | `font-bold` | `text-primary` + `uppercase` + `tracking-wider` |

  Value luôn `font-normal`. Form value `text-xs` (denser trong ô `h-10`) để khớp cảm quan với Detail `text-body-sm`. Hierarchy label/value bằng màu. Prose/dialog body dùng `text-sm`+, không 12–13px. `text-caption` (11px) dùng cho badge count, meta siêu nhỏ, và **chú thích (hint) dưới control**.
- **Icon size:** `lib/icon-sizes.ts` — micro 12 · compact 14 · default 16 · prominent 20 · feature 24.
- **Status colors:** `success` / `warning` / `info` (CSS tokens) — không rải `emerald`/`amber`/`sky` mới trong shared UI.
- **Table density:** `lib/table-density.ts` — `compact` | `default` | `comfortable`.
- **Border radius:** Dùng 2–3 mức thống nhất.
  - `rounded-lg`: form control (input, select, textarea, combobox), nút thường, chip.
  - `rounded-xl`: card, panel, dropdown list, section.
  - `rounded-2xl`: modal, drawer, dialog, thẻ lớn (MainCard).
  - Tránh trộn `rounded-md` với `rounded-lg` cho cùng mục đích; ưu tiên `rounded-lg` cho form.
- **Button height:** Chuẩn theo size (Button component / toolbar).
  - `sm`: `h-8` (32px).
  - `default`: `h-10` (40px).
  - `lg`: theo thiết kế (vd. `h-11`). Toolbar và action trong form nên dùng sm hoặc default thống nhất.
- **CTA foreground:** `text-primary-foreground` (không `text-white` trên `bg-primary`).
- **Error message (form):** Luôn dùng `text-xs` cho thông báo lỗi dưới input/textarea/combobox (Input, Textarea, Combobox). Không đổi sang `text-sm` để giữ đồng bộ và tiết kiệm không gian. Required asterisk: `text-destructive`.

## Toolbar và Filter chip (màn mới)

- **Toolbar mới:** Luôn truyền `filters` bằng **FilterChipMultiSelect** hoặc **FilterChipSingleSelect** (từ `components/shared/`). Không tự viết dropdown multi-select riêng.
- **Quy chuẩn filter chip:** Mỗi dropdown có "Chọn tất cả" (trái) và nút "Xóa chọn" (phải); đã implement trong **MultiSelect** và **MobileFilterSheet**.
- **Mobile:** Truyền đủ **filterGroups** cho **GenericToolbar** để dùng **MobileFilterSheet** (mỗi nhóm filter có "Xóa chọn" theo nhóm).
- **Count và ẩn option rỗng (chuẩn chung):**
  - **Count thực tế:** Khi filter chip hiển thị count (số lượng), danh sách dùng để đếm phải là **danh sách người dùng được phép xem** (sau phân quyền). Toolbar nhận prop danh sách đó (vd. `employees`, `items`) và hook đếm (vd. `useFilterCounts`) đếm trên chính list đó.
  - **Chỉ hiện option có dữ liệu:** Option có `count === 0` (và không đang chọn) được ẩn. Util **`filterOptionsWithCount`** (`lib/filterOptionsWithCount.ts`) và prop **`hideZeroCount`** (mặc định `true`) trên **FilterChipMultiSelect** / **MobileFilterSheet** đảm bảo điều này; toolbar chỉ cần truyền `options` có field `count`, không cần lọc tay.
- **Ví dụ:** Xem `nhan-vien-toolbar`, `phong-ban-toolbar`, `chuc-vu-toolbar` (có count); `filters` = nhiều `<FilterChipMultiSelect />` / `FilterChipSingleSelect`, `filterGroups` = mảng `{ key, label, icon, options, value, onChange }` khớp với từng filter. Module **mới**: chọn Filter Pattern A **hoặc** B — không hybrid (xem [`page-pattern.md`](./page-pattern.md)).

### Nút action listview (Thêm, Import, Export)

- **Component dùng chung:** `ListToolbarIconButton` (Import/Export) và `ListToolbarAddButton` (Thêm) từ `components/shared/ListToolbarActions.tsx`.
- **Constants:** `lib/toolbar-list-actions.ts` — class Tailwind chuẩn; không hardcode `h-9 w-9` hay icon responsive `w-5 sm:w-4` cho các nút này.
- **Spec:**

| Nút | Button | Icon | Label |
|-----|--------|------|-------|
| Import / Export | `h-8 w-8 p-0`, `variant="outline"`, touch 44px mobile | `w-4 h-4` (16px) | Tooltip |
| Thêm | `h-8 px-3`, primary, `shadow-sm` | `Plus` `w-4 h-4 mr-1.5` | `text-xs`, `BTN_ADD()` |

- **Thứ tự:** trái → phải luôn là **Import → Export → Thêm** (cả desktop `actions` lẫn `mobileActions`). Nút Import luôn nằm bên trái nút Export.
- **Tham chiếu:** `features/he-thong/nhan-vien/components/nhan-vien-toolbar.tsx`.

### Pattern B — lọc / tìm theo header cột

Module hierarchy hoặc list lớn (Nhân viên, Phòng ban, Chức vụ) có thể chuyển filter sang **header cột** thay vì chip desktop:

- Giữ **ô search tổng** trên toolbar (`searchTerm` + `matchesSearchTerm` / `SEARCHABLE_KEYS`) trừ khi product ghi nhận `hideSearch`.
- Filter theo cột lưu trong store (`columnSearch`); kết hợp **AND** với search tổng trong `filterFn`.
- Desktop: không hiển thị chip trùng filter đã có ở header; mobile vẫn dùng `filterGroups` + **MobileFilterSheet** cho parity.
- Badge **Xóa tất cả** reset `searchTerm`, `columnSearch`, sort, và filter sheet.
- Shared components: column header search/sort trong `components/shared/` (GenericTable accessories).
- Chi tiết QA: `docs/checklist-module.md` mục **6.8**, **7.4**.

## Pattern docs (companion)

- [Nhãn nút & toolbar actions](patterns-button-labels.md)
- [Hành động bảng dữ liệu](patterns-data-table-actions.md)
- [Data types & field-meta](data-types.md)

## Tab Thống kê — filter thời gian (DateRangePicker)

Áp dụng cho mọi tab **Thống kê** có filter chip khoảng thời gian (vd. Nhân viên). Tham chiếu: `lib/stats-date-range.ts`, `components/ui/DateRangePicker.tsx`, `features/he-thong/nhan-vien/`.

- **Mặc định:** preset `all` (`DEFAULT_STATS_DATE_PRESET_ID`) — **không lọc theo thời gian**, hiển thị toàn bộ dữ liệu. Chip hiển thị placeholder (`employee.stats.dateRangePlaceholder`), **không** gán sẵn "Tháng này".
- **Component:** dùng **`DateRangePicker`** với `presets` lấy từ `STANDARD_STATS_DATE_PRESET_IDS` + `custom`. Khi `preset === 'all'`: không truyền `displayLabel` (để trigger hiện placeholder).
- **Preset chuẩn** (thứ tự trong grid "Chọn nhanh"):
  1. Tất cả (`all`)
  2. Tuần này / Tuần trước
  3. 7 ngày qua
  4. Tháng này / Tháng trước
  5. 30 ngày qua
  6. Quý này / Quý trước
  7. 6 tháng qua
  8. Năm nay / **Năm trước**
  9. Tùy chọn (`custom`) — nhập Từ/Đến ngày
- **Logic lọc:** preset `all` → bỏ qua điều kiện "as-at" theo ngày vào làm; các preset khác → lọc headcount tại `dateRange.end`. Helper: `shouldApplyStatsAsAtFilter()`, `isAllStatsDateRange()`.
- **Xóa bộ lọc:** reset về `all` cùng với phòng ban / trạng thái; đếm filter active chỉ tính thời gian khi `preset !== 'all'`.
- **Chuỗi UI:** thêm key trong `features/<module>/text.ts` dưới `stats.preset.*` và `stats.dateRangePlaceholder`; không hardcode trong component.
- **Phân quyền:** non-admin vẫn clamp range tối đa 12 tháng (`clampDateRangeForRole`); preset `all` không bị clamp.

## Bảng trong tab Thống kê (stats table)

Áp dụng cho bảng số liệu tổng hợp trong tab **Thống kê** (vd. theo phòng ban, theo trạng thái).

- **Giao diện:** đồng bộ listview (`GenericTable` desktop) — `bg-muted` thead, `even:bg-muted/15`, `hover:bg-accent`, `tabular-nums`, không checkbox/cột Thao tác CRUD.
- **Viewport:** tối đa **10 dòng body** hiển thị; nhiều hơn cuộn dọc trong vùng bảng. Constants: `lib/stats-table.ts` (`STATS_TABLE_MAX_BODY_ROWS`, `getStatsTableScrollMaxHeightCss()`).
- **Phân trang:** `TablePaginationFooter`, page size mặc định **10** (`STATS_TABLE_DEFAULT_PAGE_SIZE`); options `[10, 20, 30, 50]`. Khi user tăng page size > 10 → scroll dọc trong viewport.
- **Sticky:** thead + cột label đầu khi cuộn ngang/dọc.
- **Component:**
  - Bảng đa cột (≥3 cột, sort/drill-down): **`StatsDataGrid`** (`components/shared/stats/StatsDataGrid.tsx`)
  - Bảng 2 cột (label + value): **`StatsTableCard`** (cùng constant scroll + pagination)
- **Export:** Excel/PDF export **toàn bộ dataset** (bao gồm cả KPI đang ẩn qua config), không slice theo trang hiện tại. PDF dùng font Unicode qua `registerVietnameseFont()` (`lib/pdf/vietnamese-font.ts`) — set `font` trong cả `styles` lẫn `headStyles` của autoTable; tải file bằng `doc.save()` (không `window.open`).
- **Dòng tổng cộng:** dùng prop `renderSummaryRow` của `StatsDataGrid` cho bảng tổng hợp (Σ các cột số + tỷ lệ gộp).
- **Drill-down:** click row → mở `StatsDrillDownDialog` (xem mục Drill-down bên dưới); map theo **id** (không theo tên hiển thị).
- Tham chiếu: `features/he-thong/nhan-vien/components/nhan-vien-stats.tsx`.

## Drill-down tab Thống kê

- **Không** chuyển sang tab Danh sách khi click biểu đồ / bảng tổng hợp. Mở **`StatsDrillDownDialog`** (`components/shared/stats/StatsDrillDownDialog.tsx`) bọc `AppDialog` + `StatsDataGrid` (`embedded`).
- Kích thước mặc định: `DIALOG_SIZE.XL`; nhiều cột: `WIDE`.
- Dữ liệu fetch **server-side** qua list query với filter tương ứng (dept/status/gender/tháng + filter toolbar đang chọn), giới hạn 100 dòng đầu; subtitle hiển thị **total từ server** và ghi chú `stats.drillDown.showingFirst` khi total > số dòng đã tải. Truyền `isLoading` vào dialog.
- Mọi giá trị trên biểu đồ đều click được khi có ý nghĩa drill-down (lát pie theo id/key, bar theo key, điểm tháng trên trend chart); phần tử không drill được (vd. "Chưa phân bổ" không có id) thì không phản hồi click.
- Click dòng trong popup → mở drawer Chi tiết (`onViewItem` từ `createFeatureModule` / `buildStatsProps`); popup **giữ mở** phía sau; drawer dùng `overlayTier="aboveDataDialog"`.
- Factory: `buildStatsProps` nhận thêm `onViewItem`; không truyền `onTabChange('list')` trong drill-down.
- Tham chiếu: `features/he-thong/nhan-vien/components/nhan-vien-stats.tsx`, `lib/factories/create-feature-module.tsx`.

## Bảng con trong Detail (sub-table)

Áp dụng cho danh sách con nhúng trong drawer Detail (vd. phòng ban con, phiên bản tài liệu).

- **Số dòng hiển thị:** tối đa **5 dòng body**; từ dòng thứ 6 cuộn dọc (`overflow-y-auto`, `custom-scrollbar`).
- **Constant:** `lib/detail-sub-table.ts` — `DETAIL_SUB_TABLE_MAX_BODY_ROWS`, `DETAIL_SUB_TABLE_SCROLL_MAX_HEIGHT`.
- **Component ưu tiên:** `EmbeddedChildDataGrid` (mặc định 5 dòng), `GenericSubTableSection` (`maxTableHeight` mặc định theo constant).
- Không để bảng con kéo dài vô hạn trong detail.

## Last-view flow (List ↔ Detail ↔ Form)

Sau **Hủy** hoặc **Lưu** form, quay về màn hình đã mở form.

| Mở form từ | Sau đóng form |
|------------|----------------|
| List (Thêm, sửa từ bảng) | Quay **List** — đóng detail |
| Detail (Sửa, Thêm con, …) | Quay **Detail** — refresh bản ghi |

- **Type:** `FormViewOrigin` — `lib/last-view-flow.ts`.
- **Factory:** `onEdit(item, 'list')` từ bảng; `onEdit(item, 'detail')` từ drawer detail.
- Module `usePageHandlers` + `trackFormOrigin: true` tuân cùng quy tắc.

## In tài liệu A4 (hồ sơ, phiếu)

Áp dụng cho trang preview in (vd. `/ho-so-nhan-vien/:id`). Tham chiếu: `lib/print-document/`, `components/shared/PrintDocumentShell.tsx`, `features/he-thong/nhan-vien/components/EmployeeProfileDocument.tsx`.

- **Khung trang:** dùng `PrintDocumentShell` (`.print-document-host` › `.print-document-sheet`). Shell inject stylesheet tài liệu vào `<head>`, lo toolbar / Escape / click-outside / dropdown Tải / `document.title` / toast lỗi.
- **Lề chuẩn:** trái **2cm** (20mm), phải/trên/dưới **1.5cm** (15mm). Hằng số: `PRINT_MARGIN_MM` trong `lib/print-document/constants.ts`. `@page` chỉ khai ở MỘT chỗ: `buildPrintDocumentCSS({ includePage: true })`.
- **Khổ giấy:** A4 (`210mm × 297mm`). Preview màn hình: `max-w-[210mm]`, padding nội dung do `.epdoc-sheet` lo (không dùng class Tailwind).
- **Font:** `--font-sans` / `getFontStack()` cho preview; server render dùng `PRINT_DEFAULT_FONT_STACK`. Body **10pt**, `line-height: 1.45`.

### 3 luật bất biến (đã từng gây bug in mất trang / PDF hỏng)

1. **Vùng tài liệu chỉ dùng class `epdoc-*` với màu hex.** Cấm class màu/alpha của Tailwind (`text-gray-*`, `bg-primary`, `.../80`) — palette Tailwind v4 là `oklch()`, modifier alpha sinh `color-mix(in oklab, …)`; cả hai làm html2canvas throw, và token semantic còn đảo màu ở theme tối (in ra tờ giấy nền đen).
2. **Không `position: fixed` / `overflow` trên chuỗi ancestor của tờ giấy.** Bản cũ in bằng `body * { visibility: hidden }` + `position: absolute` trong backdrop `fixed` → Chrome chỉ vẽ trang 1. Nay chỉ `display: none` các sibling của `<body>` (Toaster, ConfirmDialog portal).
3. **Không khai `width: 210mm` trong `@media print`.** Bề rộng do `@page` margin quyết định; khai thêm 210mm là tràn vùng in 175mm và cắt mép phải. Dùng `width: auto`.

### Bố cục & xuất file

- **Phân trang:** `break-inside: avoid` trên từng `tr` của `.epdoc-fields` và trên `.epdoc-sign-footer`; `break-after: avoid` trên `.epdoc-section-bar` để tiêu đề không đứng lẻ cuối trang.
- **Ẩn field trống:** model mặc định `includeEmpty: false` — hồ sơ thiếu dữ liệu ra 1 trang thay vì nhiều trang dấu `—`. Chỉ Excel truyền `includeEmpty: true`.
- **Footer chữ ký chuẩn (4 cột):** Người lập · Người kiểm tra · Người liên quan · Phê duyệt — dựng bằng `<table>`/`table-cell` (**không flexbox** — Word không hỗ trợ), khoảng ký **25mm** (`PRINT_SIGN_SPACE_MM`), tiêu đề `nowrap` 8.5pt.
- **Một nguồn bố cục:** component tài liệu thuần (props-only, không hook/store) dùng cho cả preview và `renderToStaticMarkup()` ở server. Không viết thêm bản HTML-string song song.
- **Kênh xuất:** Preview = In trình duyệt = PDF = .docx. PDF render **ở server** bằng Chromium (`lib/pdf/render-html-to-pdf.ts`) → chữ vector, tìm được chữ, tiếng Việt đúng dấu. `.docx` là OOXML thật (`docx`). Excel là export dữ liệu thô (ngoại lệ).
- **Số trang:** PDF lấy từ `footerTemplate` của Puppeteer; `.docx` từ `PageNumber`. Bấm **In** từ trình duyệt thì số trang do hộp thoại in của trình duyệt quản — CSS `@page { @bottom-right }` Chrome chưa hỗ trợ, đây không phải bug.
- **Toolbar preview:** Chiều cao gọn — `py-1.5`, nút `h-8 text-xs`, icon 14px.
- **Màu tài liệu:** `PRINT_PRIMARY_HEX` cố định, **không** bám `primaryColor` người dùng chọn — PDF/.docx render ở server nên không biết theme từng người.

## Import dữ liệu (ImportDialog + lib/import)

Áp dụng cho mọi module có nút Import trên toolbar. Tham chiếu: `components/shared/ImportDialog.tsx`, `lib/import/`.

### Luồng dialog (4 bước)

1. **Upload** — một file `.xlsx` / `.xls` / `.csv`; ưu tiên đọc sheet `Du_lieu` nếu có.
2. **Mapping** — map cột file ↔ cột hệ thống (`ImportColumn`: `key`, `label`, `required?`).
3. **Importing (batch)** — xử lý theo lô, hiển thị tiến trình `done/total`.
4. **Result** — tổng hợp `created` + lỗi; nút **Tải file lỗi (.xlsx)** khi có dòng thất bại.

Dialog: `DIALOG_SIZE.LARGE` (max-w-2xl, max-h 85vh).

### Template (.xlsx)

Dùng `buildImportTemplate()` — **không** tự tạo template một sheet.

| Sheet | Nội dung |
|-------|----------|
| `Du_lieu` | Header cột import (cột bắt buộc có `*`); dòng 2 gợi ý (có thể xóa); nhập từ dòng 3 |
| `Huong_dan` | Hướng dẫn + danh sách cột bắt buộc + sheet tra cứu |
| Lookup sheets | Bảng tham chiếu FK/enum (mã + tên; thêm `id` nếu import theo id) |

Module khai báo `importLookupSheets` (factory) hoặc `useImportLookupSheets` (master data tách khỏi list). Dùng `createTrangThaiLookupSheet()` cho cột trạng thái Active/Inactive.

### Service import

- Hàm `importXxx(rows: ImportBatchRow[], options?)` trả `ImportResult` (`created`, `failed[]`).
- Dùng `runImportBatch()` — concurrency mặc định **5**; lỗi từng dòng `throw` trong `processRow`, không dừng cả batch.
- Hook mutation: `mutationFn: ({ rows, onProgress }) => importXxx(rows, { onProgress })`; invalidate cache; toast ngắn khi `created > 0` — **không** toast chi tiết từng dòng (dialog + file lỗi đảm nhiệm).

### File lỗi

`buildErrorWorkbook()` — cột `Dong` | các cột import | `Loi`. Tên file: `{templateFileName}_Loi_{timestamp}.xlsx`. Người dùng sửa và import lại chỉ các dòng lỗi.

## Tải ảnh / Media upload

Nguồn chuẩn: `lib/media/` (provider `local` | `uploads` | `cloudinary`). Chi tiết env: `.env.example`.

### Component

| Loại | Component | Ghi chú |
|------|-----------|---------|
| Ảnh đơn (avatar, logo, chữ ký) | **`SingleImageInput`** | Không tự viết `FileReader` trong feature; bấm ảnh đã có → lightbox xem lớn |
| Nhiều ảnh | **`MultiImageInput`** / data type `multi_image` | `allowUrlInput`, `uploadContext` giống `SingleImageInput` |
| Xem ảnh lớn (detail / gallery) | **`ImageLightbox`** + **`PreviewableImage`** | Dùng chung toàn app; detail bấm thumbnail → fullscreen |
| File đính kèm (không phải ảnh UI) | **`FileInput`** | |

### Lưu trữ

- **VPS self-hosted:** `NEXT_PUBLIC_MEDIA_PROVIDER=uploads` + `UPLOAD_DIR=/data/uploads` — ghi disk, URL công khai `/uploads/...` (vd. `https://anhungthinh.5fedu.com/uploads/5f/company/logo/<id>.jpg`). Xem [`deploy-vps.md`](./deploy-vps.md).
- **Cloudinary:** `NEXT_PUBLIC_MEDIA_PROVIDER=cloudinary` + cloud name + unsigned upload preset.
- **Dev/mock:** `NEXT_PUBLIC_MEDIA_PROVIDER=local` — base64 data URL, không cần disk/Cloudinary.
- **Không** embed base64 lớn vào Postgres khi `uploads` hoặc Cloudinary đã bật.
- **Không** đặt Cloudinary API secret trong client bundle.

### Quy ước theo ngữ cảnh

| Ngữ cảnh | `SingleImageInput` | Folder (`uploadContext.folder`) |
|----------|-------------------|----------------------------------|
| Logo công ty | `shape="rounded"`, `allowUrlInput={true}`, `maxSizeMB={10}` | `5f/company/logo` |
| Avatar nhân viên | `shape="circle"`, `maxSizeMB={10}` | `5f/employees/avatars` |

- Định dạng: PNG, JPG, WebP, GIF; giới hạn chọn file qua `maxSizeMB` (mặc định **10MB**).
- Trước khi upload, `compressImageForUpload()` nén phía browser: **giữ tỷ lệ khung hình**, ưu tiên WebP, mục tiêu **~700KB** (trần 1MB), downsample chất lượng cao (avatar max cạnh **2048px**, logo **2560px**).
- Provider **`uploads`**: lưu disk + URL public. Dev local có thể proxy lên VPS qua `UPLOAD_REMOTE_BASE_URL` + `UPLOAD_API_KEY` (xem [`deploy-vps.md`](./deploy-vps.md)).
- Dán URL ảnh: prop `allowUrlInput` — validate `http(s)://`, thử load preview trước khi lưu.
- Transform CDN: `getOptimizedImageUrl()` trong `lib/media/image-url.ts` khi URL là Cloudinary.
- **Detail / read-only:** dùng `PreviewableImage` (bấm → `ImageLightbox`). Không dùng `<img>` trần khi user cần xem phóng to (avatar, logo, ảnh sản phẩm sau này).

### Hook / service

- Upload file: `uploadImage()` từ `@/lib/media`; hook client `useImageUpload()` từ `@/lib/media/use-image-upload` (không re-export qua barrel — tránh kéo vào App Route / RSC).
- UI gọi hook qua `SingleImageInput` — feature không gọi Cloudinary / `/uploads` API trực tiếp.

## Tóm tắt

| Ngữ cảnh | Thành phần | Màu chữ |
|----------|------------|---------|
| Trang submenu (dashboard thật) | Tiêu đề nhóm (groupTitle) | `text-primary` |
| Trang placeholder submenu | Tiêu đề (tên nhóm) | `text-primary` (titlePrimary) |
| Form / Detail | Tiêu đề section (Section / FormSection / DetailSection) | `text-primary` (mặc định, variant='primary') |

| Mục đích | Loại | Kích thước / Ghi chú |
|----------|------|----------------------|
| Xác nhận (confirm, xóa) | Dialog | DIALOG_SIZE.CONFIRM (max-w-sm) |
| Import / Export (rộng, cao) | Dialog | DIALOG_SIZE.LARGE (max-w-2xl, max-h 85vh) |
| Drill-down / preview bảng (Thống kê) | Dialog | DIALOG_SIZE.XL (max-w-4xl) hoặc WIDE (max-w-6xl) |
| Form drawer | Drawer | 48rem (chung với Detail) |
| Detail drawer | Drawer | 48rem (chung với Form) |
| Drawer chồng (mở từ drawer khác) | Drawer | 44rem, stackLevel ≥ 1 |
