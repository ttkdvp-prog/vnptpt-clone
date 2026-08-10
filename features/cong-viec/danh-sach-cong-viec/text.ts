/** Công việc (mô hình RACI, dưới Công việc) — namespace riêng `congViec.*`. */
export const congViec = {
  "title": "Công việc",
  "tabList": "Danh sách",
  "tabStats": "Thống kê",
  "searchPlaceholder": "Tìm theo tiêu đề, mô tả, ghi chú…",
  "cap": {
    "trungTam": "Trung tâm",
    "to": "Tổ"
  },
  "uuTien": {
    "cao": "Cao",
    "trungBinh": "Trung bình",
    "thap": "Thấp"
  },
  "trangThai": {
    "hoanThanh": "Hoàn thành",
    "quaHan": "Quá hạn",
    "dangThucHien": "Đang thực hiện"
  },
  "field": {
    "cap": "Cấp",
    "tieuDe": "Tiêu đề",
    "moTa": "Mô tả",
    "toAr": "Tổ chính (A/R)",
    "toR": "Tổ hỗ trợ (R)",
    "mnvA": "Người chịu trách nhiệm (A)",
    "mnvR": "Người thực hiện (R)",
    "mnvC": "Người tham vấn (C)",
    "uuTien": "Ưu tiên",
    "ngayBd": "Ngày bắt đầu",
    "ngayKt": "Ngày kết thúc",
    "ghiChu": "Ghi chú",
    "ngayHt": "Ngày hoàn thành",
    "tepDinhKem": "Tệp đính kèm",
    "trangThai": "Trạng thái"
  },
  "store": {
    "tieuDeCol": "Tiêu đề",
    "capCol": "Cấp",
    "toArCol": "Tổ chính",
    "mnvACol": "Người AR",
    "mnvRCol": "Người R",
    "mnvCCol": "Người C",
    "moTaCol": "Mô tả",
    "keHoachCol": "Kế hoạch",
    "thucHienCol": "Thực hiện",
    "tyLeCol": "Tỷ lệ TH",
    "uuTienCol": "Ưu tiên",
    "ngayKtCol": "Ngày kết thúc",
    "trangThaiCol": "Trạng thái",
    "ngayHtCol": "Ngày hoàn thành",
    "ghiChuCol": "Ghi chú tiến độ"
  },
  "toolbar": {
    "cap": "Cấp",
    "uuTien": "Ưu tiên",
    "toAr": "Tổ chính",
    "mnvA": "Người AR",
    "mnvR": "Người R",
    "mnvC": "Người C",
    "importData": "Nhập dữ liệu từ Excel",
    "exportData": "Xuất dữ liệu ra Excel"
  },
  "form": {
    "createTitle": "Thêm công việc mới",
    "editTitle": "Chỉnh sửa công việc",
    "createSubtitle": "Thiết lập công việc mới",
    "validationError": "Vui lòng điền đầy đủ các trường bắt buộc (*) và kiểm tra lỗi bên dưới.",
    "generalInfo": "Thông tin chung",
    "assignment": "Phân công (RACI)",
    "schedule": "Thời gian",
    "content": "Nội dung",
    "tieuDePlaceholder": "VD: Chuẩn bị báo cáo tháng",
    "capPlaceholder": "Chọn cấp",
    "capNguoiLabel": "Lọc người theo cấp",
    "capNguoiPlaceholder": "Tất cả",
    "toArPlaceholder": "Chọn tổ chính",
    "toRPlaceholder": "Chọn tổ hỗ trợ",
    "mnvAPlaceholder": "Chọn người chịu trách nhiệm",
    "mnvRPlaceholder": "Chọn người thực hiện",
    "mnvCPlaceholder": "Chọn người tham vấn",
    "uuTienPlaceholder": "Chọn mức ưu tiên",
    "ghiChuPlaceholder": "Ghi chú thêm",
    "moTaPlaceholder": "Mô tả chi tiết công việc",
    "uploadPdf": "Tải file PDF lên",
    "uploadPdfUploading": "Đang tải lên…",
    "uploadPdfHint": "PDF từ máy tính hoặc điện thoại, tối đa 20MB",
    "uploadPdfNotPdf": "Chỉ chấp nhận file PDF",
    "uploadPdfTooLarge": "File vượt quá 20MB",
    "uploadPdfError": "Tải file lên thất bại, vui lòng thử lại"
  },
  "detail": {
    "title": "Chi tiết công việc",
    "systemInfo": "Thông tin hệ thống",
    "createdAt": "Được tạo lúc",
    "updated": "Cập nhật",
    "createdBy": "Người tạo"
  },
  "deleteConfirmTitle": "Xóa công việc?",
  "deleteConfirmMessage": "Bạn có chắc muốn xóa công việc",
  "bulkDeleteTitle": "Xóa nhiều công việc",
  "bulkDeleteMessage": "Bạn đang chọn xóa {{count}} công việc. Hành động này không thể hoàn tác.",
  "toast": {
    "createSuccess": "Thêm công việc thành công",
    "updateSuccess": "Cập nhật công việc thành công",
    "deleteSuccess": "Đã xóa {{count}} công việc",
    "importSuccess": "Đã nhập {{count}} công việc"
  },
  "validation": {
    "capInvalid": "Cấp không hợp lệ",
    "tieuDeRequired": "Tiêu đề là bắt buộc",
    "toArRequired": "Tổ chính (A/R) là bắt buộc",
    "mnvARequired": "Người chịu trách nhiệm (A) là bắt buộc",
    "uuTienInvalid": "Ưu tiên không hợp lệ",
    "ngayBdRequired": "Ngày bắt đầu là bắt buộc",
    "ngayKtRequired": "Ngày kết thúc là bắt buộc",
    "ngayKtBeforeBd": "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu"
  },
  "service": {
    "notFound": "Công việc không tồn tại"
  },
  "stats": {
    "total": "Tổng số công việc",
    "hoanThanh": "Hoàn thành",
    "quaHan": "Quá hạn",
    "dangThucHien": "Đang thực hiện",
    "byCap": "Số lượng theo cấp",
    "byUuTien": "Phân bổ theo ưu tiên",
    "byNguoiPhuTrach": "Số lượng theo người phụ trách",
    "quantity": "Số lượng",
    "loading": "Đang tải thống kê...",
    "noData": "Không có dữ liệu"
  }
} as const;
