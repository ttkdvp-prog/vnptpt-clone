# Providers

Root client shell for auth, data fetching, theme, and toasts.

## Location

- Canonical: [`providers/`](../providers/)

## Mount order

```
app/layout.tsx
└── AppProviders          (providers/app-providers.tsx)
    ├── SessionProvider   (next-auth)     ← Auth.js
    ├── ErrorBoundary
    └── QueryClientProvider               ← TanStack Query
        └── AppShell      (providers/app-shell.tsx)
            ├── ThemeSynchronizer         ← Theme (Zustand → CSS)
            ├── MetadataSynchronizer
            ├── LanguageSynchronizer
            ├── PermissionMatrixSynchronizer
            ├── AuthSessionSynchronizer   ← Auth.js → Zustand auth
            ├── ConfirmDialog             ← global confirm host
            ├── PwaRegister
            ├── Toaster (sonner)          ← toasts
            └── {children}
```

Authenticated chrome (sidebar):

```
app/(app)/layout.tsx → ProtectedRoute → Layout
```

Auth pages (no sidebar): `app/(auth)/layout.tsx`.

## Responsibilities

| Concern | Mechanism |
|---------|-----------|
| Theme | Zustand `useUIStore` + `ThemeSynchronizer` (no separate Theme Context) |
| Auth | `SessionProvider` + `AuthSessionSynchronizer` |
| Query | `QueryClientProvider` + shared stale/gc from `lib/query/query-config` |
| Toast | Sonner `Toaster` in AppShell |

## Import

```ts
import { AppProviders } from '@/providers/app-providers';
import { WithPageSuspense, EmployeePage } from '@/providers/app-shell';
```
