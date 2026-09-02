#!/usr/bin/env node
/**
 * Ghi đè cột `mat_khau` của TOÀN BỘ dòng trên sheet `var_nhan_vien` bằng bcrypt
 * hash của "1" — sửa lỗi các dòng đang lưu mật khẩu dạng plaintext ("1" gõ tay,
 * không phải hash) khiến `bcrypt.compare()` luôn báo sai mật khẩu.
 *
 * Chạy:
 *   node --env-file=.env.local scripts/reset-all-passwords-to-1.mjs
 *
 * Chỉ ghi cột `mat_khau` — không đụng tới các cột khác (id, ten_tai_khoan,
 * must_change_password, role...).
 */
import { google } from 'googleapis';
import bcrypt from 'bcryptjs';

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n');
const TAB = 'var_nhan_vien';

if (!SPREADSHEET_ID || !SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
  console.error(
    'Thiếu GOOGLE_SHEETS_SPREADSHEET_ID / GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY trong env.',
  );
  process.exit(1);
}

function columnLetter(n) {
  let s = '';
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

async function main() {
  const auth = new google.auth.JWT({
    email: SERVICE_ACCOUNT_EMAIL,
    key: PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: TAB,
  });
  const values = data.values ?? [];
  if (values.length < 2) {
    console.log('Không có dữ liệu trên sheet', TAB);
    return;
  }
  const headers = values[0];
  const matKhauCol = headers.indexOf('mat_khau');
  if (matKhauCol === -1) {
    console.error('Không tìm thấy cột `mat_khau` trên sheet', TAB);
    process.exit(1);
  }
  const idCol = headers.indexOf('id');
  const colLetter = columnLetter(matKhauCol + 1);

  const hash = await bcrypt.hash('1', 10);

  const dataRows = values.slice(1).filter((row) => (row[idCol] ?? '').trim());
  console.log(`Tổng số dòng có id: ${dataRows.length}. Cột mat_khau: ${colLetter}.`);

  const updates = dataRows.map((_, i) => ({
    range: `${TAB}!${colLetter}${i + 2}`,
    values: [[hash]],
  }));

  const BATCH_SIZE = 200;
  let done = 0;
  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const chunk = updates.slice(i, i + BATCH_SIZE);
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { valueInputOption: 'RAW', data: chunk },
    });
    done += chunk.length;
    console.log(`Đã cập nhật ${done}/${updates.length} dòng...`);
  }
  console.log('Xong. Toàn bộ mật khẩu đã chuyển thành "1" (đã hash bcrypt).');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
