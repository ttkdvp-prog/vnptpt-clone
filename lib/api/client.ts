import { isApi } from '@/lib/data/config';

const TOKEN_KEY = 'aht_api_token';

export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  // Empty = same-origin (Next rewrites / Auth.js / Route Handlers)
  if (raw === '') return '';
  if (raw && raw.length > 0) return raw.replace(/\/$/, '');
  return '';
}

export function getStoredApiToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredApiToken(token: string | null, remember = true): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    if (!token) return;
    if (remember) localStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
}

export function clearStoredApiToken(): void {
  setStoredApiToken(null);
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  if (!isApi()) {
    throw new Error('apiFetch called when NEXT_PUBLIC_DATA_SOURCE is not api');
  }

  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getStoredApiToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    let message = res.statusText || 'API error';
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

/** Tên file từ header `Content-Disposition` (ưu tiên `filename*=UTF-8''…`). */
function parseContentDispositionFilename(header: string | null): string | undefined {
  if (!header) return undefined;
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1].trim());
    } catch {
      /* ignore */
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain?.[1]?.trim();
}

/**
 * Tải file nhị phân (PDF, .docx…) từ API.
 * `apiFetch` luôn `res.json()` nên không dùng được. Phải đi qua đây thay vì `<a href download>`
 * vì auth có thể là Bearer token trong localStorage khi `NEXT_PUBLIC_API_BASE_URL` trỏ cross-origin.
 */
export async function apiFetchBlob(
  path: string,
  init: RequestInit = {},
): Promise<{ blob: Blob; filename?: string }> {
  if (!isApi()) {
    throw new Error('apiFetchBlob called when NEXT_PUBLIC_DATA_SOURCE is not api');
  }

  const headers = new Headers(init.headers);
  const token = getStoredApiToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    let message = res.statusText || 'API error';
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status);
  }

  return {
    blob: await res.blob(),
    filename: parseContentDispositionFilename(res.headers.get('Content-Disposition')),
  };
}
