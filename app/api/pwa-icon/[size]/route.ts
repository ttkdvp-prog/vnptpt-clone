import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import {
  getOptimizedImageUrl,
  isDataUrl,
  isHttpImageUrl,
  isUploadsPath,
} from '@/lib/media/image-url';
import { findCompany } from '@/server/repositories/cong-ty';

const ALLOWED_SIZES = new Set([192, 512]);

function parseDataUrl(dataUrl: string): { contentType: string; body: Buffer } | null {
  const match = /^data:([^;,]+)?(;base64)?,([\s\S]*)$/i.exec(dataUrl);
  if (!match) return null;
  const contentType = (match[1] ?? 'image/png').trim() || 'image/png';
  const isBase64 = Boolean(match[2]);
  const payload = match[3] ?? '';
  try {
    const body = isBase64
      ? Buffer.from(payload, 'base64')
      : Buffer.from(decodeURIComponent(payload), 'utf8');
    return { contentType, body };
  } catch {
    return null;
  }
}

type RouteContext = { params: Promise<{ size: string }> };

/**
 * PWA / apple-touch icon sized from Thông tin công ty logo.
 * Cloudinary URLs are transformed; other http(s) /uploads redirect; data URLs are served inline.
 */
export async function GET(request: Request, context: RouteContext): Promise<NextResponse> {
  const { size: sizeRaw } = await context.params;
  const size = Number(sizeRaw);
  if (!ALLOWED_SIZES.has(size)) {
    return NextResponse.json({ error: 'Unsupported size' }, { status: 400 });
  }

  let logo: string | null = null;
  try {
    const row = await findCompany();
    logo = row?.logo ?? null;
  } catch {
    // Fallback to the bundled favicon below when company info is unavailable.
  }

  if (logo && isDataUrl(logo)) {
    const parsed = parseDataUrl(logo);
    if (parsed) {
      return new NextResponse(new Uint8Array(parsed.body), {
        headers: {
          'Content-Type': parsed.contentType,
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }
  }

  if (logo && isHttpImageUrl(logo)) {
    const url = getOptimizedImageUrl(logo, {
      width: size,
      height: size,
      crop: 'fill',
      quality: 'auto',
      format: 'png',
    });
    return NextResponse.redirect(url, 302);
  }

  if (logo && isUploadsPath(logo)) {
    const absolute = new URL(logo, request.url).toString();
    return NextResponse.redirect(absolute, 302);
  }

  try {
    const svgPath = path.join(process.cwd(), 'public', 'favicon.svg');
    const svg = await readFile(svgPath);
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Icon unavailable' }, { status: 404 });
  }
}
