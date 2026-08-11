import type { MetadataRoute } from 'next';
import { findCompany } from '@/server/repositories/cong-ty';

const FALLBACK_NAME = 'Trung tâm hạ tầng';
const FALLBACK_DESCRIPTION = 'Ứng dụng quản lý ERP';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let name = FALLBACK_NAME;
  let description = FALLBACK_DESCRIPTION;

  try {
    const row = await findCompany();
    const appName = row?.ten_ung_dung?.trim();
    if (appName) name = appName;
    const appDescription = row?.mo_ta_ung_dung?.trim();
    if (appDescription) description = appDescription;
  } catch {
    // Build / missing DB — keep fallbacks
  }

  const shortName = name.length > 12 ? name.slice(0, 12) : name;

  return {
    name,
    short_name: shortName,
    description,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      {
        src: '/api/pwa-icon/192?v=vnpt1',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/api/pwa-icon/512?v=vnpt1',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/api/pwa-icon/192?v=vnpt1',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
