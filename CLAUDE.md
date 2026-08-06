# CLAUDE.md

Kiến trúc, stack, quy ước module: xem @AGENTS.md (nguồn sự thật duy nhất — đừng
lặp lại nội dung đó ở đây, hai file lệch nhau còn tệ hơn một file thiếu).

File này chỉ chứa thứ riêng cho cách làm việc trong Claude Code.

## Nhịp độ kiểm tra

Ba tầng, **không** chạy cả ba sau mỗi lần sửa file:

| Tầng | Khi nào | Chạy gì |
|---|---|---|
| 0 | sau mỗi cụm sửa liên quan | `npx tsc --noEmit` |
| 1 | xong một nghiệp vụ | `npx vitest related <file>` hoặc `npm run test -- <pattern>` |
| 2 | **chỉ khi user yêu cầu** | `npm run test` (full) · `npm run lint:ci` · `npm run build` |

- **Tầng 0 bật vô điều kiện.** `tsconfig.json` có `incremental: true` nên nó rẻ
  (~2s) và bắt được nhiều lỗi nhất. Không bỏ qua tầng này để "đi nhanh".
- **`lint:ci` toàn repo là dư trong lúc làm** — `.husky/pre-commit` đã chạy
  `lint-staged` → `eslint --max-warnings 0` trên file staged ở mọi commit. Chỉ
  chạy `lint:ci` khi cần bắt lỗi ở file *không* nằm trong commit sắp tới.
- **`npm run build` không tự chạy.** ~40-60s/lần và hiếm khi bắt được lỗi mà
  `tsc` không bắt. User tự quyết định khi nào cần build.
- Commit sau mỗi nghiệp vụ nhỏ — checkpoint git là lưới an toàn thay cho việc
  chạy gate liên tục. Không có checkpoint thì "gate 1 lần ở cuối" là đánh cược.

## Test phải nhanh thật

`lib/data/mock-repository.ts` giả lập độ trễ mạng bằng `setTimeout` **ngủ thật**.
Đã chặn dưới vitest (`process.env.VITEST` → `delayMs = 0`). Nếu thêm nguồn độ trễ
giả lập mới, chặn dưới vitest ngay từ đầu — đừng để test ngủ thật.

## Khảo sát code tối giản

- `grep -n` định vị dòng trước, rồi `Read` đúng vùng bằng `offset`/`limit`. Đừng
  đọc cả file lớn "cho chắc" khi chỉ sửa một hàm.
- Rà nhiều file cùng một pattern: gộp **một** lệnh `grep` trên nhiều file, không
  `Read` từng file.
- Không spawn subagent cho việc làm được bằng 1-2 lệnh `grep`/`find`.

## Báo cáo

Ngắn. Nêu việc đã làm và kết quả, không diễn giải lại từng bước hay liệt kê
phương án đã loại. Bảng/gạch đầu dòng thay cho đoạn văn dài.
