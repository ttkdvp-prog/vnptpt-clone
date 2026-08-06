# Deploy — Vercel

Stack: Next.js 16 (App Router) + Google Sheets API (data) + Google Drive (ảnh upload) + Vercel (hosting).
Không còn Docker/VPS, không còn Postgres/Prisma — xem [`AGENTS.md`](../AGENTS.md) cho kiến trúc.

## 1. Chuẩn bị Google Cloud

1. Tạo project trên [Google Cloud Console](https://console.cloud.google.com/), bật **Google Sheets API** và **Google Drive API**.
2. Tạo **Service Account** → tải file JSON credentials.
3. Tạo 1 Google Sheet, mỗi tab (sheet con) đặt tên đúng theo `lib/sheets/config.ts` → `SHEET_TABS` (ví dụ `var_nhan_vien`, `var_phong_ban`, `kh_danh_sach_khach_hang`, ...). Hàng 1 = header đúng tên cột (xem `prisma/schema.prisma` cũ đã xoá — tham chiếu tên cột qua từng `server/repositories/*.ts`, phần `toDbRow`/`insertRow`).
4. **Share** Google Sheet với email Service Account (quyền Editor).
5. Tạo 1 folder trên Google Drive để chứa ảnh upload → **Share** folder đó với email Service Account (quyền Editor) → copy folder ID (trong URL).

## 2. Env vars trên Vercel

Vào **Project Settings → Environment Variables**, set (xem đầy đủ ở [`.env.example`](../.env.example)):

| Biến | Ghi chú |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | từ JSON credentials |
| `GOOGLE_PRIVATE_KEY` | trường `private_key` trong JSON, paste nguyên văn (giữ `\n`) |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | ID trong URL Google Sheet |
| `GOOGLE_DRIVE_FOLDER_ID` | ID folder Drive chứa ảnh upload |
| `AUTH_SECRET` / `JWT_SECRET` | chuỗi random dài |
| `NEXT_PUBLIC_APP_URL` | domain Vercel (vd `https://your-app.vercel.app`) |
| `NEXT_PUBLIC_DATA_SOURCE` | `api` |
| `NEXT_PUBLIC_MEDIA_PROVIDER` | `uploads` (route `/uploads` → Google Drive) |

`GOOGLE_PRIVATE_KEY` dán trực tiếp vào ô value trên dashboard Vercel — không cần escape thủ công, Vercel giữ nguyên chuỗi nhiều dòng. Code tự thay `\n` literal thành newline thật (`lib/sheets/config.ts`).

## 3. Deploy

1. Connect GitHub repo trên Vercel (New Project → import repo).
2. Build command mặc định (`next build`) — không cần custom, không có bước migrate DB.
3. Deploy — mỗi push lên nhánh chính tạo production deployment, PR tạo preview deployment riêng.

## 4. Giới hạn cần biết

- **Sheets API rate limit**: 100 requests/100s/user. `lib/sheets/sheet-cache.ts` cache TTL ~15s giảm số lần đọc, nhưng ghi đồng thời nhiều người dùng vẫn có thể race (không có transaction thật như Postgres).
- **PDF render** (`lib/pdf/render-html-to-pdf.ts`) dùng `@sparticuz/chromium` + `puppeteer-core` — hoạt động trên Vercel serverless functions, nhưng cần function timeout đủ dài cho tài liệu nhiều trang. Nếu vượt giới hạn plan, tăng `maxDuration` qua `vercel.json` hoặc route segment config (`export const maxDuration = 60` trong route handler).
- **Không có ổ đĩa bền vững** — mọi upload ảnh đi qua route `/uploads` → Google Drive (`lib/storage/drive.ts`), không còn `UPLOAD_DIR`.
