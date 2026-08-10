/**
 * Apps Script — tạo tab + dữ liệu mẫu cho module "Hệ thống" trên Google Sheet.
 *
 * Cách dùng:
 * 1. Mở Google Sheet cần seed → copy ID trong URL:
 *    https://docs.google.com/spreadsheets/d/ĐOẠN_NÀY/edit
 * 2. Dán ID đó vào SPREADSHEET_ID bên dưới (giữ nguyên trong dấu nháy).
 * 3. Mở Google Sheet đó → Extensions/Tiện ích mở rộng → Apps Script (script sẽ
 *    tự chạy đúng trên sheet có ID bạn khai, kể cả khi project script này
 *    không "bound" — nên tránh được lỗi "getSpreadsheet đã bị xóa" do gọi
 *    SpreadsheetApp.getActiveSpreadsheet() từ project độc lập).
 * 4. Xoá code mẫu (myFunction), dán TOÀN BỘ nội dung file này vào.
 * 5. Chọn hàm `seedHeThong` ở thanh chạy (Run) → bấm Run. Lần đầu Google sẽ hỏi
 *    cấp quyền cho script — cấp quyền cho tài khoản Google đang mở Sheet đó.
 * 6. Xem log: View → Logs (hoặc Ctrl+Enter) để thấy danh sách tài khoản demo.
 *
 * CẢNH BÁO: script XOÁ SẠCH nội dung tab rồi ghi lại mỗi lần chạy — chỉ chạy
 * trên Sheet test/mới tạo, đừng chạy trên Sheet đã có dữ liệu thật muốn giữ.
 *
 * Mật khẩu demo cho MỌI tài khoản mẫu bên dưới: 123456
 * (hash bcrypt cố định — không cần thư viện ngoài trong Apps Script).
 */

const SPREADSHEET_ID = 'DÁN_SPREADSHEET_ID_CỦA_BẠN_VÀO_ĐÂY';
const DEMO_PASSWORD_HASH = '$2b$10$vcH.9JTm2LCb8KtbhR/Fi.1WM.wc19Z9Hk43/JbCAwYyoCNJSWz1S';

function seedHeThong() {
  const ss = SPREADSHEET_ID && SPREADSHEET_ID.indexOf('DÁN_') !== 0
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error(
      'Không mở được Spreadsheet. Điền SPREADSHEET_ID ở đầu file, hoặc mở script này từ trong chính Google Sheet (Extensions → Apps Script).',
    );
  }
  const now = new Date().toISOString();

  const SHEETS = [
    {
      name: 'var_phong_ban',
      headers: [
        'id', 'ma_phong_ban', 'ten_phong_ban', 'id_cha', 'trang_thai', 'mo_ta',
        'thu_tu', 'nguoi_tao', 'tg_tao', 'tg_cap_nhat',
      ],
      rows: [
        ['1', 'BGD', 'Ban Giám Đốc', '', 'active', 'Ban điều hành công ty', '1', '', now, now],
        ['2', 'KD', 'Kinh Doanh', '', 'active', 'Phòng kinh doanh', '2', '', now, now],
        ['3', 'HCNS', 'Hành Chính Nhân Sự', '', 'active', 'Phòng hành chính nhân sự', '3', '', now, now],
        ['4', 'KT', 'Kế Toán', '', 'active', 'Phòng kế toán', '4', '', now, now],
        ['5', 'KD-MN', 'Kinh Doanh Miền Nam', '2', 'active', 'Trực thuộc Kinh Doanh', '1', '', now, now],
      ],
    },
    {
      name: 'var_chuc_vu',
      headers: [
        'id', 'id_phong_ban', 'ma_chuc_vu', 'ten_chuc_vu', 'cap_bac', 'mo_ta',
        'thu_tu', 'trang_thai', 'nguoi_tao', 'tg_tao', 'tg_cap_nhat',
      ],
      rows: [
        ['1', '1', 'GD', 'Giám Đốc', '1', 'Điều hành công ty', '1', 'active', '', now, now],
        ['2', '2', 'TPKD', 'Trưởng Phòng Kinh Doanh', '2', '', '2', 'active', '', now, now],
        ['3', '2', 'NVKD', 'Nhân Viên Kinh Doanh', '4', '', '3', 'active', '', now, now],
        ['4', '3', 'TPHCNS', 'Trưởng Phòng HCNS', '2', '', '4', 'active', '', now, now],
        ['5', '3', 'NVHCNS', 'Nhân Viên HCNS', '4', '', '5', 'active', '', now, now],
        ['6', '4', 'KTT', 'Kế Toán Trưởng', '2', '', '6', 'active', '', now, now],
      ],
    },
    {
      name: 'var_nhan_vien',
      headers: [
        'id', 'ho_va_ten', 'hinh_anh', 'email', 'email_ca_nhan', 'so_dien_thoai', 'gioi_tinh',
        'ngay_sinh', 'so_cccd', 'ngay_cap_cccd', 'noi_cap_cccd', 'dia_chi_thuong_tru',
        'dia_chi_hien_tai', 'que_quan', 'dan_toc', 'ton_giao', 'tinh_trang_hon_nhan', 'quoc_tich',
        'ngay_vao_lam', 'ngay_chinh_thuc', 'ngay_nghi_viec', 'ly_do_nghi', 'so_tai_khoan',
        'ten_chu_tai_khoan', 'ngan_hang', 'chi_nhanh', 'nguoi_lien_he_khan', 'sdt_khan',
        'moi_quan_he', 'so_so_bhxh', 'so_bhyt', 'ma_so_thue_ca_nhan', 'trinh_do', 'chuyen_nganh',
        'truong', 'trang_thai', 'id_chuc_vu', 'id_phong_ban', 'cap_bac', 'tai_khoan', 'mat_khau',
        'must_change_password', 'nguoi_tao', 'tg_tao', 'tg_cap_nhat',
      ],
      rows: [
        [
          '1', 'Nguyễn Văn An', '', 'an.nguyen@example.com', '', '0901234567', 'Nam',
          '1985-03-12', '079085001234', '2021-05-10', 'CA TP.HCM', '12 Nguyễn Huệ, Q1, TP.HCM',
          '12 Nguyễn Huệ, Q1, TP.HCM', 'Bình Dương', 'Kinh', 'Không', 'Đã kết hôn', 'Việt Nam',
          '2019-01-15', '2019-04-15', '', '', '0011002233445',
          'Nguyễn Văn An', 'Vietcombank', 'CN TP.HCM', 'Nguyễn Thị B', '0909876543',
          'Vợ', '7912345678', '7912345678', '8012345678', 'Đại học', 'Quản trị kinh doanh',
          'ĐH Kinh Tế TP.HCM', 'ACTIVE', '1', '1', '1', 'admin', DEMO_PASSWORD_HASH,
          'false', '', now, now,
        ],
        [
          '2', 'Trần Thị Bích', '', 'bich.tran@example.com', '', '0912345678', 'Nữ',
          '1990-07-22', '079090005678', '2022-02-01', 'CA TP.HCM', '45 Lê Lợi, Q1, TP.HCM',
          '45 Lê Lợi, Q1, TP.HCM', 'Đồng Nai', 'Kinh', 'Không', 'Độc thân', 'Việt Nam',
          '2020-06-01', '2020-09-01', '', '', '0022003344556',
          'Trần Thị Bích', 'Techcombank', 'CN Hà Nội', 'Trần Văn C', '0918765432',
          'Anh trai', '7911223344', '7911223344', '8022334455', 'Đại học', 'Kế toán',
          'ĐH Kinh Tế TP.HCM', 'ACTIVE', '6', '4', '2', 'bich.tran', DEMO_PASSWORD_HASH,
          'true', '1', now, now,
        ],
        [
          '3', 'Lê Hoàng Nam', '', 'nam.le@example.com', '', '0923456789', 'Nam',
          '1995-11-30', '079095009876', '2023-01-20', 'CA TP.HCM', '78 Hai Bà Trưng, Q3, TP.HCM',
          '78 Hai Bà Trưng, Q3, TP.HCM', 'Long An', 'Kinh', 'Không', 'Độc thân', 'Việt Nam',
          '2023-03-01', '2023-06-01', '', '', '0033004455667',
          'Lê Hoàng Nam', 'BIDV', 'CN TP.HCM', 'Lê Thị D', '0928765432',
          'Mẹ', '7913344556', '7913344556', '8033445566', 'Cao đẳng', 'Kinh doanh',
          'CĐ Kinh Tế Đối Ngoại', 'PROBATION', '3', '2', '4', 'nam.le', DEMO_PASSWORD_HASH,
          'true', '1', now, now,
        ],
      ],
    },
    {
      name: 'var_cong_ty',
      headers: [
        'id', 'ten_ung_dung', 'mo_ta_ung_dung', 'logo', 'ten_cong_ty', 'ma_so_thue',
        'dia_chi', 'so_dien_thoai', 'email', 'website', 'nguoi_dai_dien',
        'chuc_vu_nguoi_dai_dien', 'dia_diem_ky', 'tg_tao', 'tg_cap_nhat',
      ],
      rows: [
        [
          '1', 'Trung tâm hạ tầng', 'Hệ thống quản trị nội bộ Trung tâm hạ tầng', '',
          'Công ty TNHH Trung tâm hạ tầng', '0312345678',
          '12 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh', '028 3822 1234', 'contact@anhungthinh.vn',
          'https://anhungthinh.vn', 'Nguyễn Văn An', 'Giám Đốc', 'TP. Hồ Chí Minh', now, now,
        ],
      ],
    },
    {
      name: 'var_phan_quyen',
      headers: ['id', 'module_key', 'chuc_vu_id', 'quyen', 'tg_tao', 'tg_cap_nhat'],
      rows: [
        ['1', 'nhan_vien', '1', 'xem,them,sua,xoa,admin', now, now],
        ['2', 'nhan_vien', '2', 'xem,them,sua', now, now],
        ['3', 'nhan_vien', '4', 'xem,them,sua', now, now],
        ['4', 'phan_quyen', '1', 'xem,them,sua,xoa,admin', now, now],
        ['5', 'phong_ban', '1', 'xem,them,sua,xoa', now, now],
        ['6', 'phong_ban', '2', 'xem', now, now],
        ['7', 'khach_hang', '2', 'xem,them,sua', now, now],
        ['8', 'khach_hang', '3', 'xem,them,sua,xoa', now, now],
      ],
    },
    {
      name: 'hc_thong_bao',
      headers: [
        'id', 'tg_dang', 'tieu_de', 'noi_dung', 'id_chuc_vu', 'nguoi_tao', 'tg_tao', 'tg_cap_nhat',
      ],
      rows: [
        [
          '1', now, 'Thông báo nghỉ lễ Quốc Khánh 2/9',
          'Công ty nghỉ lễ Quốc Khánh từ ngày 02/09 đến hết ngày 03/09. Chúc toàn thể CBNV nghỉ lễ vui vẻ.',
          '', '1', now, now,
        ],
        [
          '2', now, 'Cập nhật quy trình chấm công',
          'Từ tháng sau, toàn bộ nhân viên chấm công qua app di động thay vì máy chấm vân tay.',
          '2,3', '1', now, now,
        ],
      ],
    },
  ];

  SHEETS.forEach(function (sheetDef) {
    let sheet = ss.getSheetByName(sheetDef.name);
    if (!sheet) {
      sheet = ss.insertSheet(sheetDef.name);
      Logger.log('Đã tạo tab mới: ' + sheetDef.name);
    } else {
      sheet.clearContents();
    }

    const values = [sheetDef.headers].concat(sheetDef.rows);
    sheet.getRange(1, 1, values.length, sheetDef.headers.length).setValues(values);
    sheet.setFrozenRows(1);
    Logger.log('Đã ghi ' + sheetDef.rows.length + ' dòng mẫu vào "' + sheetDef.name + '"');
  });

  Logger.log('\nXong. Tài khoản demo (mật khẩu cho mọi user mẫu: 123456):');
  Logger.log('  - admin        (Giám Đốc, cap_bac=1 — full quyền)');
  Logger.log('  - bich.tran    (Kế Toán Trưởng, phải đổi mật khẩu lần đầu)');
  Logger.log('  - nam.le       (NVKD, trạng thái thử việc PROBATION)');
}
