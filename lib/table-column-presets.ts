/**
 * Quy tắc kích thước cột bảng (list/table dùng ColumnConfig).
 *
 * Ba giá trị, đừng lẫn:
 * - `defaultWidth`: chiều rộng KHI MỞ BẢNG (chưa resize tay). Phải đủ cho nội dung thực tế
 *   một dòng tiếng Việt + padding ô (px-4 = 32px) + nhãn header và nút sort/filter (~28px).
 *   Đây là con số người dùng nhìn thấy → ưu tiên dễ đọc, không phải nhỏ nhất có thể.
 * - `minWidth`: SÀN khi user kéo thu hẹp. Nhỏ hơn defaultWidth; chấp nhận truncate.
 * - `maxWidth`: TRẦN khi user kéo mở rộng. Luôn chừa khoảng trên defaultWidth để còn kéo được.
 *
 * Nguyên tắc chung:
 * - Ô vẫn `min-w-0` + `truncate` / ellipsis — text cực dài hiển thị “…” (xem EnumBadge `truncate`,
 *   cell `overflow-hidden`); default rộng chỉ giảm truncate ở dữ liệu điển hình, không xoá hẳn.
 * - Badge / enum (trạng thái, giới tính, loại HĐ): không wrap; default theo nhãn dài nhất trong locale.
 * - Ngày / số: hẹp, tabular-nums.
 * - Bảng dùng `table-layout: fixed` + `<colgroup>`; phần dư khi tổng cột < bề rộng bảng được
 *   trình duyệt chia lại theo tỷ lệ, nên default lớn không gây khoảng trắng lạ.
 *
 * Đơn vị: px (khớp ColumnConfig.defaultWidth / minWidth / maxWidth).
 */
export const TABLE_COLUMN_PRESETS = {
  /** Mã nhân viên, mã đơn hàng, … (thường hiển thị dạng badge font-mono) */
  code: { defaultWidth: 148, minWidth: 88, maxWidth: 200 },
  /** Thứ tự, cấp bậc, cấp độ — số ngắn nhưng nhãn header dài hơn nội dung */
  orderIndex: { defaultWidth: 104, minWidth: 72, maxWidth: 140 },
  /** Đếm số (số người liên hệ, số phiếu…) */
  count: { defaultWidth: 128, minWidth: 100, maxWidth: 180 },
  /** Họ tên, tên khách hàng */
  personName: { defaultWidth: 216, minWidth: 160, maxWidth: 320 },
  /** Tên đăng nhập (font-mono) */
  username: { defaultWidth: 150, minWidth: 120, maxWidth: 200 },
  /** Số điện thoại VN */
  phone: { defaultWidth: 148, minWidth: 112, maxWidth: 180 },
  /** Email */
  email: { defaultWidth: 248, minWidth: 176, maxWidth: 340 },
  /** Link tài liệu / file */
  link: { defaultWidth: 240, minWidth: 150, maxWidth: 400 },
  /** Ngày (chuỗi hiển thị ngắn) */
  date: { defaultWidth: 136, minWidth: 104, maxWidth: 176 },
  /** Giờ (HH:mm) */
  time: { defaultWidth: 108, minWidth: 88, maxWidth: 140 },
  /** Ngày giờ (chuỗi dài hơn) */
  datetime: { defaultWidth: 176, minWidth: 152, maxWidth: 224 },
  /** Phần trăm */
  percent: { defaultWidth: 116, minWidth: 96, maxWidth: 160 },
  /** Số tiền (mức lương, đơn giá…) — tabular-nums, có thể kèm đơn vị */
  money: { defaultWidth: 144, minWidth: 112, maxWidth: 200 },
  /** Badge enum 1 dòng — trạng thái, loại trung bình (nhãn có thể dài) */
  enumBadge: { defaultWidth: 164, minWidth: 132, maxWidth: 240 },
  /** Badge enum ngắn (Nam/Nữ, có/không) */
  enumBadgeShort: { defaultWidth: 112, minWidth: 92, maxWidth: 150 },
  /** Badge / tag loại hợp đồng, trình độ (nhãn trung bình) */
  enumBadgeMedium: { defaultWidth: 148, minWidth: 120, maxWidth: 200 },
  /** Tên chức vụ, phòng ban (một dòng, truncate nếu quá dài) */
  titleShort: { defaultWidth: 204, minWidth: 136, maxWidth: 280 },
  /**
   * Cột tên trong bảng cây (HierarchyTable): phần indent theo cấp + icon nhánh ăn
   * ~70–110px bề rộng, nên phải rộng hơn `titleShort` mới không truncate ở cấp 2–3.
   */
  treeName: { defaultWidth: 320, minWidth: 200, maxWidth: 440 },
  /** Tên chi nhánh, địa điểm, bộ phận */
  branch: { defaultWidth: 220, minWidth: 140, maxWidth: 300 },
  /** Địa chỉ / nơi làm việc — thường truncate */
  addressLine: { defaultWidth: 260, minWidth: 160, maxWidth: 400 },
  /** Mô tả / lý do / ghi chú — text dài, luôn truncate */
  longText: { defaultWidth: 280, minWidth: 160, maxWidth: 480 },
  /** Tỉnh/TP */
  province: { defaultWidth: 160, minWidth: 120, maxWidth: 240 },
  /** CCCD / CMND (số) */
  idCard: { defaultWidth: 152, minWidth: 128, maxWidth: 200 },
} as const;

export type TableColumnPresetKey = keyof typeof TABLE_COLUMN_PRESETS;
