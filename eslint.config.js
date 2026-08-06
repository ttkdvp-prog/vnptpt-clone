import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    // `.next-*/**` phủ mọi distDir song song sinh bởi NEXT_DIST_DIR (.next-review,
    // .next-duplicate, ...). Thiếu nó là `lint:ci` đỏ hàng trăm lỗi từ build output
    // của phiên làm việc khác — không phải lỗi source.
    ignores: [
      'dist/**',
      '.next/**',
      '.next-*/**',
      'node_modules/**',
      '*.min.js',
      '.npm-cache/**',
      '.cursor/**',
    ],
  },
  // Script Node (không dùng globals browser như file TSX)
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        React: 'readonly',
        JSX: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        window: 'readonly',
        document: 'readonly',
        import: 'readonly',
        module: 'readonly',
        require: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        FormData: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        AbortController: 'readonly',
        ResizeObserver: 'readonly',
        IntersectionObserver: 'readonly',
        MutationObserver: 'readonly',
        performance: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        history: 'readonly',
        CustomEvent: 'readonly',
        Event: 'readonly',
        MouseEvent: 'readonly',
        KeyboardEvent: 'readonly',
        HTMLElement: 'readonly',
        Element: 'readonly',
        Node: 'readonly',
        NodeList: 'readonly',
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    settings: {
      react: { version: '19.0' },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...Object.fromEntries(
        Object.entries(jsxA11y.configs.recommended.rules || {}).map(([k, v]) => [k, v === 'error' ? 'warn' : v]),
      ),
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/display-name': 'off',
      'no-useless-assignment': 'warn',
      'prefer-const': 'warn',
      'no-case-declarations': 'warn',
      'react-hooks/rules-of-hooks': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/incompatible-library': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/purity': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/label-has-associated-control': 'warn',
      'jsx-a11y/no-autofocus': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/no-noninteractive-element-interactions': 'warn',
      'jsx-a11y/interactive-supports-focus': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../../*', '../../../*', '../../../../*', '../../../../../*'],
              message: 'Use @/ path alias for cross-folder imports (avoid relative paths with ../..).',
            },
          ],
        },
      ],
      'no-restricted-syntax': 'off',
      'no-constant-binary-expression': 'warn',
    },
  },
  // Client / feature layers must not touch Prisma or server internals
  {
    files: [
      'features/**/*.{ts,tsx}',
      'components/**/*.{ts,tsx}',
      'views/**/*.{ts,tsx}',
      'hooks/**/*.{ts,tsx}',
      'store/**/*.{ts,tsx}',
      'providers/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@prisma/client',
              message:
                'Do not import Prisma from client layers. Use feature services → API → server/repositories.',
            },
            {
              name: '@/server/db',
              message:
                'Do not import Prisma client from client layers. Use feature services → API → server/repositories.',
            },
          ],
          patterns: [
            {
              group: ['../../*', '../../../*', '../../../../*', '../../../../../*'],
              message: 'Use @/ path alias for cross-folder imports (avoid relative paths with ../..).',
            },
            {
              group: ['@/server', '@/server/*'],
              message:
                'Client layers must not import @/server. Use feature services → HTTP API instead.',
            },
          ],
        },
      ],
    },
  },
  // Chữ gợi ý / chú thích phải đi qua txt() để bảng chữ và hàng rào
  // `lib/text/__tests__/placeholder-copy.test.ts` kiểm soát được.
  // Quy tắc nội dung: docs/UI-CONVENTIONS.md § Quy tắc viết chữ gợi ý.
  {
    // `app/**` thêm vào — trước đây chỉ features/components/views nên placeholder
    // hard-code trong route file (app router) lọt qua không bị chặn.
    files: ['features/**/*.tsx', 'components/**/*.tsx', 'views/**/*.tsx', 'app/**/*.tsx'],
    // Test dùng chuỗi literal làm fixture — đó chính là thứ đang được kiểm chứng.
    ignores: ['**/__tests__/**', '**/*.test.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXAttribute[name.name="placeholder"] > Literal[value=/[À-ỹ]/]',
          message:
            'Không hard-code chữ gợi ý tiếng Việt. Khai báo trong features/**/text.ts (hoặc lib/text/ui.ts) rồi gọi txt(). Xem docs/UI-CONVENTIONS.md § Quy tắc viết chữ gợi ý.',
        },
        {
          selector: 'JSXAttribute[name.name="hint"] > Literal[value=/[À-ỹ]/]',
          message:
            'Không hard-code chú thích tiếng Việt. Khai báo trong features/**/text.ts rồi gọi txt(). Xem docs/UI-CONVENTIONS.md § Quy tắc viết chữ gợi ý.',
        },
        {
          // Trước đây chỉ bắt `Literal` con trực tiếp — template literal
          // (`placeholder={\`Tối thiểu ${n} ký tự\`}`) lọt qua vì nó là
          // JSXExpressionContainer > TemplateLiteral > TemplateElement, không
          // phải Literal trực tiếp. Descendant selector bắt luôn trường hợp này.
          selector: 'JSXAttribute[name.name="placeholder"] TemplateElement[value.raw=/[À-ỹ]/]',
          message:
            'Không hard-code chữ gợi ý tiếng Việt (kể cả trong template literal). Khai báo trong features/**/text.ts rồi gọi txt(). Xem docs/UI-CONVENTIONS.md § Quy tắc viết chữ gợi ý.',
        },
        {
          selector: 'JSXAttribute[name.name="hint"] TemplateElement[value.raw=/[À-ỹ]/]',
          message:
            'Không hard-code chú thích tiếng Việt (kể cả trong template literal). Khai báo trong features/**/text.ts rồi gọi txt(). Xem docs/UI-CONVENTIONS.md § Quy tắc viết chữ gợi ý.',
        },
      ],
    },
  },
  // Ngăn tái tạo bản sao chuỗi class form-control đã gom về
  // lib/constants/form-control.ts (FORM_CONTROL_BASE) — xem D3 trong kế hoạch Phase 5.
  {
    files: ['features/**/*.tsx', 'components/**/*.tsx', 'views/**/*.tsx', 'app/**/*.tsx'],
    ignores: ['**/__tests__/**', '**/*.test.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'Literal[value=/rounded-lg border border-(border|input) bg-background (px-3 py-2 text-xs|pl-3 pr-10 py-2 text-xs)/]',
          message:
            'Đừng lặp lại chuỗi class form-control. Dùng FORM_CONTROL_BASE (và FORM_CONTROL_PLACEHOLDER/FORM_CONTROL_ERROR nếu cần) từ lib/constants/form-control.ts.',
        },
      ],
    },
  },
];
