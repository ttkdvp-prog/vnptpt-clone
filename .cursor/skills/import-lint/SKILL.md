---
description: Fix and prevent ESLint import warnings — @/ path alias, lint:ci gate
alwaysApply: false
---

# Import lint

1. Cross-folder imports use `@/*` — never `../../*`
2. Feature-internal relative imports OK
3. Run `npm run lint:ci` before merge
4. Repair bulk: `node scripts/fix-deep-imports.mjs`
