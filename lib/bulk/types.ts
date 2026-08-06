/**
 * Kiểu dùng chung cho mọi hành động bulk (xoá, đổi trạng thái, sửa hàng loạt,
 * duyệt/từ chối theo lô). Thuần — không React, không import từ `features/`.
 *
 * `partial` — mỗi dòng một try/catch riêng, thu lỗi từng dòng, dòng còn lại vẫn
 *   chạy. Dùng cho đổi trạng thái / bulk-edit / duyệt-từ chối: dòng không đủ
 *   điều kiện chỉ nên bị bỏ qua, không kéo cả lô xuống.
 * `atomic` — một transaction bọc tất cả, một lỗi là rollback hết. Dùng cho xoá
 *   hàng loạt: xoá nửa vời khó lần lại.
 */
export type BulkMode = 'partial' | 'atomic';

export interface BulkRowFailure {
  id: string;
  /** Nhãn hiển thị cho người dùng (mã phiếu, tên, ...) — không phải id thô. */
  label: string;
  reason: string;
}

export interface BulkOutcome {
  mode: BulkMode;
  attempted: number;
  succeededIds: string[];
  failures: BulkRowFailure[];
}

export interface BulkPartition<T> {
  /** Đủ điều kiện, đã tải — gửi lên server. */
  eligible: T[];
  /** Đã tải nhưng không đủ điều kiện — hiện trong xác nhận, không gửi. */
  skipped: T[];
  /**
   * Nằm trong selection nhưng KHÔNG có trong `loadedItems` (selection trải
   * qua trang chưa tải). Không bao giờ ẩn action vì lý do này — server là
   * chốt cuối, gửi id này lên và để nó tự thành công hoặc lỗi từng dòng.
   */
  unknownIds: string[];
}

/**
 * Chia selection thành 3 nhóm dựa trên dữ liệu ĐÃ TẢI. `selectedIds` là nguồn
 * sự thật và có thể trải nhiều trang; `loadedItems` chỉ là những gì store hiện
 * đang giữ trong bộ nhớ (thường chỉ trang hiện tại với server-pagination).
 */
export function partitionEligible<T>(
  loadedItems: readonly T[],
  selectedIds: ReadonlySet<string> | Iterable<string>,
  getId: (item: T) => string,
  isEligible: (item: T) => boolean,
): BulkPartition<T> {
  const ids = selectedIds instanceof Set ? selectedIds : new Set(selectedIds);
  const loadedById = new Map(loadedItems.map((item) => [getId(item), item]));

  const eligible: T[] = [];
  const skipped: T[] = [];
  const unknownIds: string[] = [];

  for (const id of ids) {
    const item = loadedById.get(id);
    if (item === undefined) {
      unknownIds.push(id);
    } else if (isEligible(item)) {
      eligible.push(item);
    } else {
      skipped.push(item);
    }
  }

  return { eligible, skipped, unknownIds };
}
