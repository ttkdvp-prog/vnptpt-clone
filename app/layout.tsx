import type { Metadata, Viewport } from 'next';
import { Suspense, type ReactNode } from 'react';
import { AppProviders } from '@/providers/app-providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Trung tâm hạ tầng',
  description: 'Ứng dụng quản lý ERP',
  icons: {
    icon: [{ url: '/api/pwa-icon/192', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/api/pwa-icon/192', sizes: '192x192', type: 'image/png' }],
  },
  openGraph: {
    title: 'Trung tâm hạ tầng',
    description: 'Ứng dụng quản lý ERP',
    images: ['/api/pwa-icon/512'],
  },
  appleWebApp: {
    capable: true,
    title: 'Trung tâm hạ tầng',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ffffff',
};

const themeBootScript = `
(function() {
  var SANS_FALLBACK = "'Noto Sans', ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'";
  var GOOGLE_FONT_PARAM = {
    Inter: '',
    'Be Vietnam Pro': 'Be+Vietnam+Pro:wght@400;500;600;700',
    Lexend: 'Lexend:wght@400;500;600;700',
    Nunito: 'Nunito:wght@400;600;700',
    'Source Sans 3': 'Source+Sans+3:wght@400;500;600;700',
    Merriweather: 'Merriweather:wght@400;700'
  };
  function quoteFontName(name) {
    name = (name || '').trim();
    return name.indexOf(' ') >= 0 ? "'" + name + "'" : name;
  }
  function applyFontFromState(state) {
    var el = document.documentElement;
    var ff = state && state.fontFamily;
    if (!ff || !(ff in GOOGLE_FONT_PARAM)) ff = 'Inter';
    var param = GOOGLE_FONT_PARAM[ff];
    if (param) {
      var id = 'gfont-' + ff.replace(/\\s+/g, '-');
      if (!document.getElementById(id)) {
        var link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=' + param + '&display=swap';
        document.head.appendChild(link);
      }
    }
    el.style.setProperty('--font-sans', quoteFontName(ff) + ', ' + SANS_FALLBACK);
  }
  try {
    var raw = localStorage.getItem('ui-storage');
    if (!raw) return;
    var data = JSON.parse(raw);
    var state = data && data.state;
    if (!state) return;
    var el = document.documentElement;
    var scheme = state.colorScheme;
    var isDark = scheme === 'dark' || (scheme === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      el.classList.add('dark');
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', '#0f172a');
    } else {
      el.classList.remove('dark');
      var meta2 = document.querySelector('meta[name="theme-color"]');
      if (meta2) meta2.setAttribute('content', '#ffffff');
    }
    var fontSize = state.fontSize;
    if (fontSize) el.dataset.textSize = fontSize;
    applyFontFromState(state);
    var colorMap = {
      blue:'221.2 83.2% 53.3%', violet:'262.1 83.3% 57.8%',
      emerald:'142.1 76.2% 36.3%', rose:'346.8 77.2% 49.8%',
      amber:'37.7 92.1% 50.2%', orange:'24.6 95% 53.1%',
      cyan:'188.7 94.5% 42.7%', slate:'215.4 16.3% 46.9%'
    };
    var pc = state.primaryColor;
    if (pc && colorMap[pc]) {
      var v = colorMap[pc];
      el.style.setProperty('--primary', v);
      el.style.setProperty('--ring', v);
      el.style.setProperty('--secondary-foreground', v);
      el.style.setProperty('--accent-foreground', v);
      el.style.setProperty('--color-primary', 'hsl(' + v + ')');
      el.style.setProperty('--color-ring', 'hsl(' + v + ' / 0.5)');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <Suspense fallback={null}>
          <AppProviders>{children}</AppProviders>
        </Suspense>
      </body>
    </html>
  );
}
