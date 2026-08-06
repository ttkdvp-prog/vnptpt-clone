import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import '@/lib/text/bootstrap-module-strings';
import { getAllStrings, txt } from '@/lib/text';

/**
 * Hàng rào cho chữ gợi ý (placeholder) và chú thích (hint).
 * Quy tắc đầy đủ: `docs/UI-CONVENTIONS.md` § Quy tắc viết chữ gợi ý.
 *
 * Khi một luật ở đây chặn bạn: sửa **chuỗi**, đừng nới luật. Nếu thật sự cần
 * ngoại lệ, thêm vào allowlist ngay dưới kèm lý do — không thêm im lặng.
 */

const SRC_ROOTS = ['features', 'components', 'views', 'app'];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next' || entry === '.git') continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(p)) out.push(p);
  }
  return out;
}

const allFiles = SRC_ROOTS.flatMap((r) => walk(r));

/** Bỏ dấu tiếng Việt + lowercase, để so sánh placeholder với label. */
function normalize(v: string): string {
  return v
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const strings = getAllStrings();

const placeholderEntries = Object.entries(strings).filter(([k]) => {
  const leaf = k.split('.').pop() ?? '';
  return leaf.endsWith('Placeholder') || leaf === 'placeholder';
});

const hintEntries = Object.entries(strings).filter(([k]) => {
  const leaf = k.split('.').pop() ?? '';
  return leaf.endsWith('Hint');
});

/** Chuỗi tìm kiếm / lọc — không phải ô nhập dữ liệu, miễn một số luật. */
function isSearchString(key: string, value: string): boolean {
  const leaf = key.split('.').pop() ?? '';
  return leaf.toLowerCase().includes('search') || /^(Tìm|Lọc)\b/.test(value) || value === 'Lọc';
}

function fail(key: string, value: string, rule: string, fix: string): string {
  return `\n  ${key}\n    giá trị : "${value}"\n    vi phạm : ${rule}\n    sửa     : ${fix}`;
}

describe('Quy tắc viết chữ gợi ý (placeholder)', () => {
  it('không dùng "Ví dụ:" — quy ước là "VD: "', () => {
    const bad = placeholderEntries
      .filter(([, v]) => v.includes('Ví dụ:'))
      .map(([k, v]) => fail(k, v, 'dùng "Ví dụ:"', 'đổi thành "VD: "'));
    expect(bad, bad.join('')).toEqual([]);
  });

  it('không dùng "..." hay ". . ." — chỉ ký tự "…"', () => {
    const bad = placeholderEntries
      .filter(([, v]) => v.includes('...') || v.includes('. . .'))
      .map(([k, v]) => fail(k, v, 'dấu ba chấm ASCII', 'bỏ hẳn, hoặc thay bằng ký tự "…"'));
    expect(bad, bad.join('')).toEqual([]);
  });

  it('"…" chỉ được nằm ở cuối, và chỉ khi danh sách cố ý còn thiếu', () => {
    const bad = placeholderEntries
      .filter(([, v]) => v.includes('…') && !v.endsWith('…'))
      .map(([k, v]) => fail(k, v, '"…" nằm giữa chuỗi', 'chuyển "…" ra cuối hoặc bỏ'));
    expect(bad, bad.join('')).toEqual([]);
  });

  it('placeholder ô chọn không kết thúc bằng "." hoặc "…"', () => {
    const bad = placeholderEntries
      .filter(([, v]) => v.startsWith('Chọn ') && /[.…]$/.test(v))
      .map(([k, v]) => fail(k, v, 'ô chọn có dấu kết', 'bỏ dấu kết — chevron đã báo "bấm để mở"'));
    expect(bad, bad.join('')).toEqual([]);
  });

  it('không nhúng quy tắc validation vào placeholder (nó mất khi gõ)', () => {
    const RULE_WORDS = ['Ít nhất', 'Tối đa', 'Tối thiểu', 'bắt buộc', 'Để trống', 'ký tự'];
    const bad = placeholderEntries
      .filter(([, v]) => RULE_WORDS.some((w) => v.includes(w)))
      .map(([k, v]) => fail(k, v, 'chứa quy tắc validation', 'chuyển sang key *Hint tương ứng'));
    expect(bad, bad.join('')).toEqual([]);
  });

  it('không viết "(tùy chọn)" / "(nếu có)" — dấu * đỏ là tín hiệu duy nhất', () => {
    const bad = placeholderEntries
      .filter(([, v]) => /\((tùy chọn|nếu có|không bắt buộc)\)/i.test(v))
      .map(([k, v]) => fail(k, v, 'tự đánh dấu "tùy chọn"', 'bỏ — trường không có * đã là tùy chọn'));
    expect(bad, bad.join('')).toEqual([]);
  });

  it('placeholder không phải là một câu trả lời hợp lệ cho chính trường đó', () => {
    // Những giá trị này là đáp án đúng của đa số bản ghi → người dùng tưởng ô đã điền.
    const BLOCKLIST = new Set([
      'viet nam', 'kinh', 'khong', '0', '1', '2020',
      'nguyen van a', 'nguyen thi b', 'vietcombank', 'quan 1',
      'tp ho chi minh', 'phuong ben nghe', '079095012345',
      'hs4012345678901', '8012345678', '0123456789',
    ]);
    const bad = placeholderEntries
      .filter(([, v]) => BLOCKLIST.has(normalize(v)))
      .map(([k, v]) =>
        fail(k, v, 'trông y hệt dữ liệu đã lưu', 'thêm tiền tố "VD: ", bỏ hẳn, hoặc đặt làm defaultValue thật'),
      );
    expect(bad, bad.join('')).toEqual([]);
  });

  it('placeholder không chỉ lặp lại nhãn của chính nó', () => {
    const bad: string[] = [];
    for (const [key, value] of placeholderEntries) {
      if (isSearchString(key, value)) continue;
      if (value.startsWith('Chọn ')) continue;
      const labelKey = key.replace(/Placeholder$/, '');
      const label = strings[labelKey];
      if (!label) continue;
      const nv = normalize(value);
      const nl = normalize(label);
      if (nv === nl || nv === `nhap ${nl}` || nv === `nhap ${nl} `.trim()) {
        bad.push(fail(key, value, `chỉ lặp lại nhãn "${label}"`, 'bỏ hẳn placeholder'));
      }
    }
    expect(bad, bad.join('')).toEqual([]);
  });

  it('placeholder không dài quá 40 ký tự (ô 2 cột trong drawer cắt ~50)', () => {
    const bad = placeholderEntries
      .filter(([k, v]) => v.length > 40 && !isSearchString(k, v))
      .map(([k, v]) => fail(k, v, `dài ${v.length} ký tự`, 'rút còn ≤ 40, phần còn lại đưa xuống hint'));
    expect(bad, bad.join('')).toEqual([]);
  });
});

describe('Quy tắc viết chú thích (hint)', () => {
  it('hint không dài quá 80 ký tự', () => {
    // Một số hint là câu giải thích dài trong dialog/banner, không phải hint dưới ô.
    const LONG_FORM_ALLOWED = new Set([
      'employee.popupBlockedHint',
      'employee.form.createAuthOnEditHint',
      'employee.bulkPassword.noLoginHint',
      'employee.stats.noDataHint',
      'contract.emptyHint',
      'employee.detail.contractsEmptyHint',
      'employee.detail.decisionsComingSoonHint',
      'shared.import.templateGuideIntro',
      // Hint dài dạng banner/panel giải thích, không phải chú thích một dòng dưới ô nhập:
      'employee.rowActions.popupBlockedHint',
      'department.form.parentHint',
      'document.detail.accessChangeHint',
      'announcement.detail.accessChangeHint',
    ]);
    const bad = hintEntries
      .filter(([k, v]) => v.length > 80 && !LONG_FORM_ALLOWED.has(k))
      .map(([k, v]) => fail(k, v, `dài ${v.length} ký tự`, 'rút gọn còn ≤ 80, hoặc thêm vào LONG_FORM_ALLOWED'));
    expect(bad, bad.join('')).toEqual([]);
  });

  it('hint không trùng nội dung với placeholder cùng trường', () => {
    const bad: string[] = [];
    for (const [key, value] of hintEntries) {
      const ph = strings[key.replace(/Hint$/, 'Placeholder')];
      if (ph && normalize(ph) === normalize(value)) {
        bad.push(fail(key, value, 'trùng nội dung với placeholder cùng trường', 'bỏ một trong hai'));
      }
    }
    expect(bad, bad.join('')).toEqual([]);
  });
});

describe('Chuỗi giao diện đi qua txt()', () => {
  it('mọi key txt() dùng trong app đều tồn tại', () => {
    const keys = new Set<string>();
    for (const f of allFiles)
      for (const m of readFileSync(f, 'utf8').matchAll(/txt\('([A-Za-z0-9_.]+)'/g)) keys.add(m[1]);

    const missing = [...keys].filter((k) => {
      const v = txt(k);
      return !v || v === k;
    });
    expect(missing, `Key không tồn tại trong bảng chữ:\n${missing.join('\n')}`).toEqual([]);
  });

  it('components/ui không hard-code chữ tiếng Việt cho placeholder', () => {
    const bad: string[] = [];
    for (const f of walk('components/ui')) {
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/placeholder\s*[=:]\s*(['"])(.*?)\1/g)) {
        const value = m[2];
        if (/[À-ỹ]/.test(value)) {
          bad.push(`\n  ${f}\n    "${value}" → chuyển vào lib/text/ui.ts (ui.field.*) và gọi qua txt()`);
        }
      }
    }
    expect(bad, bad.join('')).toEqual([]);
  });
});
