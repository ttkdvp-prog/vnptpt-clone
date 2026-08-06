/**
 * Last-view flow: sau Form (Thêm/Sửa/Hủy/Lưu) quay về màn hình đã mở form.
 * Xem docs/UI-CONVENTIONS.md § Last-view flow (List ↔ Detail ↔ Form).
 */

export type FormViewOrigin = 'list' | 'detail';

/**
 * Chế độ mở form: `duplicate` là tạo mới với dữ liệu điền sẵn từ bản ghi nguồn
 * (mã định danh, trạng thái, file đính kèm... do form từng module tự reset).
 */
export type FormMode = 'create' | 'edit' | 'duplicate';
