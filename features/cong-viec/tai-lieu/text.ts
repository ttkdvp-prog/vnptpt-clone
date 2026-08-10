/** Tài liệu (đăng ký hồ sơ tài liệu, dưới Công việc) — namespace riêng, không đụng `taiLieu.*` (văn bản đến/đi) đã có. */
export const congViecTaiLieu = {
  "title": "Tài liệu",
  "tabList": "Danh sách",
  "tabStats": "Thống kê",
  "searchPlaceholder": "Tìm theo tên hồ sơ, số hồ sơ, danh mục…",
  "status": {
    "active": "Đang hiệu lực",
    "expired": "Hết hiệu lực",
    "draft": "Dự thảo"
  },
  "field": {
    "soHoSo": "Số hồ sơ",
    "tenHoSo": "Tên hồ sơ",
    "danhMuc": "Danh mục",
    "to": "Tổ/Phòng",
    "ngayBanHanh": "Ngày ban hành",
    "ngayKetThuc": "Ngày hết hiệu lực",
    "tinhTrang": "Tình trạng",
    "url": "Đường dẫn",
    "moTa": "Mô tả"
  },
  "store": {
    "tenHoSoCol": "Tên hồ sơ",
    "danhMucCol": "Danh mục",
    "toCol": "Tổ/Phòng",
    "tinhTrangCol": "Tình trạng",
    "ngayBanHanhCol": "Ngày ban hành"
  },
  "toolbar": {
    "status": "Tình trạng",
    "danhMuc": "Danh mục",
    "to": "Tổ/Phòng"
  },
  "form": {
    "createTitle": "Thêm tài liệu mới",
    "editTitle": "Chỉnh sửa tài liệu",
    "createSubtitle": "Thiết lập hồ sơ tài liệu mới",
    "validationError": "Vui lòng điền đầy đủ các trường bắt buộc (*) và kiểm tra lỗi bên dưới.",
    "docInfo": "Thông tin hồ sơ",
    "content": "Nội dung",
    "tenHoSoPlaceholder": "VD: Hợp đồng thuê văn phòng năm 2026",
    "danhMucPlaceholder": "VD: Hợp đồng, Quyết định, Công văn…",
    "toPlaceholder": "Chọn tổ/phòng",
    "tinhTrangPlaceholder": "Chọn tình trạng",
    "urlPlaceholder": "https://…",
    "moTaPlaceholder": "Ghi chú thêm về hồ sơ",
    "uploadPdf": "Tải file PDF lên",
    "uploadPdfUploading": "Đang tải lên…",
    "uploadPdfHint": "PDF từ máy tính hoặc điện thoại, tối đa 20MB",
    "uploadPdfNotPdf": "Chỉ chấp nhận file PDF",
    "uploadPdfTooLarge": "File vượt quá 20MB",
    "uploadPdfError": "Tải file lên thất bại, vui lòng thử lại"
  },
  "detail": {
    "title": "Chi tiết tài liệu",
    "systemInfo": "Thông tin hệ thống",
    "createdAt": "Được tạo lúc",
    "updated": "Cập nhật",
    "createdBy": "Người tạo"
  },
  "deleteConfirmTitle": "Xóa tài liệu?",
  "deleteConfirmMessage": "Bạn có chắc muốn xóa hồ sơ",
  "bulkDeleteTitle": "Xóa nhiều tài liệu",
  "bulkDeleteMessage": "Bạn đang chọn xóa {{count}} hồ sơ tài liệu. Hành động này không thể hoàn tác.",
  "toast": {
    "createSuccess": "Thêm tài liệu thành công",
    "updateSuccess": "Cập nhật tài liệu thành công",
    "deleteSuccess": "Đã xóa {{count}} tài liệu"
  },
  "validation": {
    "nameRequired": "Tên hồ sơ là bắt buộc",
    "categoryRequired": "Danh mục là bắt buộc",
    "toRequired": "Tổ/Phòng là bắt buộc",
    "issueDateRequired": "Ngày ban hành là bắt buộc",
    "statusInvalid": "Tình trạng không hợp lệ",
    "endDateBeforeStart": "Ngày hết hiệu lực phải sau hoặc bằng ngày ban hành"
  },
  "service": {
    "notFound": "Tài liệu không tồn tại"
  },
  "stats": {
    "total": "Tổng số tài liệu",
    "active": "Đang hiệu lực",
    "expired": "Hết hiệu lực",
    "draft": "Dự thảo",
    "byDanhMuc": "Số lượng theo danh mục",
    "byTinhTrang": "Phân bổ theo tình trạng",
    "quantity": "Số lượng",
    "loading": "Đang tải thống kê...",
    "noData": "Không có dữ liệu"
  }
} as const;
