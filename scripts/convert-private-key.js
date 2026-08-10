// Chạy: node scripts/convert-private-key.js path/to/service-account.json
// In ra chuỗi GOOGLE_PRIVATE_KEY dạng \n literal một dòng, đúng format Vercel cần.
// Không commit output này vào git, không dán vào chat — chỉ copy trực tiếp sang Vercel.
const fs = require('fs');

const jsonPath = process.argv[2];
if (!jsonPath) {
  console.error('Dùng: node scripts/convert-private-key.js path/to/service-account.json');
  process.exit(1);
}

const key = JSON.parse(fs.readFileSync(jsonPath, 'utf8')).private_key;
// JSON.stringify escape \n thành \\n literal, bỏ dấu ngoặc kép bao ngoài
const escaped = JSON.stringify(key).slice(1, -1);
console.log(escaped);
