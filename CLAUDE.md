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
  chạy `lint:ci` khi cần bắt lỗi ở file *không* nằm trong commit sắp tới, hoặc
  khi chuẩn bị mở PR — không chạy giữa chừng "cho chắc".
- **`npm run build` không tự chạy.** ~40-60s/lần và hiếm khi bắt được lỗi mà
  `tsc` không bắt. User tự quyết định khi nào cần build.
- Commit sau mỗi nghiệp vụ nhỏ — checkpoint git là lưới an toàn thay cho việc
  chạy gate liên tục. Không có checkpoint thì "gate 1 lần ở cuối" là đánh cược.

## Không mở browser nếu đọc code đã đủ chắc

Mục tiêu là tốc độ. Chỉ mở Browser pane (preview_start + verification workflow)
khi **không thể** khẳng định đúng/sai bằng cách đọc code:

- Thay đổi logic thuần (transform data, validate, tính toán, điều kiện hiển
  thị, sửa type...) mà đọc diff + `tsc` là đủ kết luận → **không** mở browser.
- Chỉ mở browser khi việc cần kiểm chứng phụ thuộc runtime thật: CSS/layout
  render ra sao, animation, responsive, hành vi tương tác nhiều bước, lỗi chỉ
  xuất hiện lúc chạy (hydration mismatch, race condition, network timing).
- Khi lười biện minh ("chắc là chạy được") mà thực ra là loại thay đổi runtime
  ở trên thì vẫn phải mở browser — tăng tốc không có nghĩa là bỏ qua rủi ro
  thật, chỉ là bỏ bước thừa.

## Chạy nhiều task liên tiếp

Khi làm một loạt task nhỏ liên quan (ví dụ nhiều field, nhiều component cùng
pattern): làm hết **một cụm** rồi mới `npx tsc --noEmit` một lần, không check
sau từng task lẻ. "Một cụm" là các sửa đổi cùng thuộc một nghiệp vụ, không
phải toàn bộ phiên làm việc — vẫn giữ tầng 1 (test liên quan) khi xong nghiệp
vụ đó.

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
- Đọc/tìm nhiều file không phụ thuộc nhau → gọi song song trong cùng một
  message (nhiều Read/Grep một lượt), không tuần tự từng cái.
- Spawn Explore agent với phạm vi "quick" cho câu hỏi định vị đơn giản
  ("file X ở đâu", "hàm Y định nghĩa chỗ nào"). Chỉ dùng "medium"/"rất kỹ" khi
  câu hỏi thực sự mở, cần dò nhiều vị trí/naming convention khác nhau.
- Không đọc lại file vừa Edit/Write để "xác nhận" — công cụ đã báo lỗi ngay
  nếu thao tác fail, đọc lại là dư thừa.

## Báo cáo

Ngắn. Nêu việc đã làm và kết quả, không diễn giải lại từng bước hay liệt kê
phương án đã loại. Bảng/gạch đầu dòng thay cho đoạn văn dài.

## Skill (từ anthropics/skills)

Đã cài toàn bộ skill của repo [anthropics/skills](https://github.com/anthropics/skills)
vào `~/.claude/skills` (user-level, không nằm trong repo này). Danh sách hiện có:
`algorithmic-art`, `brand-guidelines`, `canvas-design`, `claude-api`,
`doc-coauthoring`, `docx`, `frontend-design`, `internal-comms`, `mcp-builder`,
`pdf`, `pptx`, `skill-creator`, `slack-gif-creator`, `theme-factory`,
`web-artifacts-builder`, `webapp-testing`, `xlsx`.

- Dùng `Skill` tool để gọi khi tác vụ khớp mô tả skill (ví dụ: tạo/sửa file
  Word/PDF/Excel/PPTX, build web artifact, test webapp bằng Playwright, viết
  MCP server, thiết kế theo brand guideline...). Không đoán tên skill — chỉ
  dùng skill có trong danh sách trên hoặc do user gọi trực tiếp.
- Skill ở user-level nên áp dụng cho **mọi** project, không riêng vnptpt. Khi
  cập nhật skill, sync lại từ repo gốc (`git clone` rồi copy đè vào
  `~/.claude/skills`), không sửa tay nội dung skill.
- Với công việc thuần nghiệp vụ ERP nội bộ (Sheets/Drive/Next.js) trong repo
  này, các skill trên hầu như không liên quan — chỉ kích hoạt khi tác vụ thực
  sự chạm tới loại file/nghiệp vụ mà skill đó mô tả.
