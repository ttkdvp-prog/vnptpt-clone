/** Nhiệm vụ (giao việc & theo dõi tiến độ, dưới Công việc) — namespace riêng `nhiemVu.*`. */
export const nhiemVu = {
  "title": "Nhiệm vụ",
  "tabList": "Danh sách",
  "tabStats": "Thống kê",
  "searchPlaceholder": "Tìm theo tiêu đề, mô tả, ghi chú…",
  "uuTien": {
    "cao": "Cao",
    "trungBinh": "Trung bình",
    "thap": "Thấp"
  },
  "trangThai": {
    "chuaBatDau": "Chưa bắt đầu",
    "dangThucHien": "Đang thực hiện",
    "hoanThanh": "Hoàn thành",
    "quaHan": "Quá hạn"
  },
  "field": {
    "tieuDe": "Tiêu đề",
    "moTa": "Mô tả",
    "nguoiPhuTrach": "Người phụ trách",
    "hanChot": "Hạn chót",
    "trangThai": "Trạng thái",
    "uuTien": "Ưu tiên",
    "ghiChu": "Ghi chú"
  },
  "store": {
    "tieuDeCol": "Tiêu đề",
    "moTaCol": "Mô tả",
    "nguoiPhuTrachCol": "Người phụ trách",
    "uuTienCol": "Ưu tiên",
    "hanChotCol": "Hạn chót",
    "trangThaiCol": "Trạng thái",
    "ghiChuCol": "Ghi chú"
  },
  "toolbar": {
    "trangThai": "Trạng thái",
    "uuTien": "Ưu tiên",
    "nguoiPhuTrach": "Người phụ trách",
    "importData": "Nhập dữ liệu từ Excel",
    "exportData": "Xuất dữ liệu ra Excel"
  },
  "form": {
    "createTitle": "Thêm nhiệm vụ mới",
    "editTitle": "Chỉnh sửa nhiệm vụ",
    "createSubtitle": "Thiết lập nhiệm vụ mới",
    "validationError": "Vui lòng điền đầy đủ các trường bắt buộc (*) và kiểm tra lỗi bên dưới.",
    "generalInfo": "Thông tin chung",
    "assignment": "Phân công",
    "content": "Nội dung",
    "tieuDePlaceholder": "VD: Chuẩn bị báo cáo tháng",
    "nguoiPhuTrachPlaceholder": "Chọn người phụ trách",
    "hanChotPlaceholder": "Chọn hạn chót",
    "trangThaiPlaceholder": "Chọn trạng thái",
    "uuTienPlaceholder": "Chọn mức ưu tiên",
    "moTaPlaceholder": "Mô tả chi tiết nhiệm vụ",
    "ghiChuPlaceholder": "Ghi chú thêm"
  },
  "detail": {
    "title": "Chi tiết nhiệm vụ",
    "systemInfo": "Thông tin hệ thống",
    "createdAt": "Được tạo lúc",
    "updated": "Cập nhật",
    "createdBy": "Người tạo"
  },
  "deleteConfirmTitle": "Xóa nhiệm vụ?",
  "deleteConfirmMessage": "Bạn có chắc muốn xóa nhiệm vụ",
  "bulkDeleteTitle": "Xóa nhiều nhiệm vụ",
  "bulkDeleteMessage": "Bạn đang chọn xóa {{count}} nhiệm vụ. Hành động này không thể hoàn tác.",
  "toast": {
    "createSuccess": "Thêm nhiệm vụ thành công",
    "updateSuccess": "Cập nhật nhiệm vụ thành công",
    "deleteSuccess": "Đã xóa {{count}} nhiệm vụ",
    "importSuccess": "Đã nhập {{count}} nhiệm vụ"
  },
  "validation": {
    "tieuDeRequired": "Tiêu đề là bắt buộc",
    "nguoiPhuTrachRequired": "Người phụ trách là bắt buộc",
    "hanChotRequired": "Hạn chót là bắt buộc",
    "trangThaiInvalid": "Trạng thái không hợp lệ",
    "uuTienInvalid": "Ưu tiên không hợp lệ"
  },
  "service": {
    "notFound": "Nhiệm vụ không tồn tại"
  },
  "stats": {
    "total": "Tổng số nhiệm vụ",
    "chuaBatDau": "Chưa bắt đầu",
    "dangThucHien": "Đang thực hiện",
    "hoanThanh": "Hoàn thành",
    "quaHan": "Quá hạn",
    "byTrangThai": "Số lượng theo trạng thái",
    "byUuTien": "Phân bổ theo ưu tiên",
    "quantity": "Số lượng",
    "loading": "Đang tải thống kê...",
    "noData": "Không có dữ liệu"
  }
} as const;
