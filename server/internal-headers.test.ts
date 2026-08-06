// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  INTERNAL_PROOF_HEADER,
  INTERNAL_SESSION_HEADERS,
  computeInternalProof,
  stripInternalHeaders,
  verifyInternalProof,
} from './internal-headers';

const ORIGINAL_AUTH_SECRET = process.env.AUTH_SECRET;
const ORIGINAL_JWT_SECRET = process.env.JWT_SECRET;

beforeEach(() => {
  process.env.AUTH_SECRET = 'test-secret-for-internal-proof';
  delete process.env.JWT_SECRET;
});

afterEach(() => {
  if (ORIGINAL_AUTH_SECRET === undefined) delete process.env.AUTH_SECRET;
  else process.env.AUTH_SECRET = ORIGINAL_AUTH_SECRET;
  if (ORIGINAL_JWT_SECRET === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = ORIGINAL_JWT_SECRET;
});

describe('stripInternalHeaders', () => {
  it('xoá mọi header nội bộ do client gửi vào', () => {
    const headers = new Headers({
      'x-aht-employee-id': '1',
      'x-aht-tai-khoan': 'attacker',
      'x-aht-cap-bac': '1',
      [INTERNAL_PROOF_HEADER]: 'deadbeef',
      'content-type': 'application/json',
    });

    stripInternalHeaders(headers);

    for (const name of INTERNAL_SESSION_HEADERS) {
      expect(headers.get(name)).toBeNull();
    }
    expect(headers.get(INTERNAL_PROOF_HEADER)).toBeNull();
    // Không được đụng tới header thường
    expect(headers.get('content-type')).toBe('application/json');
  });

  it('không lỗi khi header không tồn tại', () => {
    const headers = new Headers();
    expect(() => stripInternalHeaders(headers)).not.toThrow();
  });
});

describe('proof nội bộ', () => {
  it('proof tự sinh thì verify được', () => {
    const proof = computeInternalProof();
    expect(proof).toBeTruthy();
    expect(verifyInternalProof(proof as string)).toBe(true);
  });

  it('từ chối proof đoán bừa, rỗng, hoặc undefined', () => {
    expect(verifyInternalProof('deadbeef')).toBe(false);
    expect(verifyInternalProof('')).toBe(false);
    expect(verifyInternalProof(undefined)).toBe(false);
  });

  it('từ chối proof sinh bằng secret khác', () => {
    const proofFromOtherSecret = computeInternalProof();
    process.env.AUTH_SECRET = 'a-completely-different-secret';
    expect(verifyInternalProof(proofFromOtherSecret as string)).toBe(false);
  });

  it('fail closed khi thiếu secret — nhánh header bị vô hiệu hoàn toàn', () => {
    const proof = computeInternalProof() as string;
    delete process.env.AUTH_SECRET;
    delete process.env.JWT_SECRET;
    expect(computeInternalProof()).toBeNull();
    expect(verifyInternalProof(proof)).toBe(false);
  });

  it('proof cùng độ dài nhưng sai vẫn bị từ chối (so sánh hằng thời gian)', () => {
    const proof = computeInternalProof() as string;
    const sameLengthWrong = 'f'.repeat(proof.length);
    expect(sameLengthWrong).toHaveLength(proof.length);
    expect(verifyInternalProof(sameLengthWrong)).toBe(false);
  });
});
