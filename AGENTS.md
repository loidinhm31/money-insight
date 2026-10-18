# AGENTS.md

This file provides guidance to AI coding agents and developers working with code in this repository.

## Overview

Money Insight is a personal finance tracking app with offline-first sync. It is built as a single browser package (`@money-insight/app`) that runs both as a standalone web app and embedded in `glean-hub-app`.

## Build & Development Commands

```bash
pnpm dev            # Web dev server (port 25096)
pnpm build          # Typecheck & build production bundle with Vite
pnpm lint           # Lint source with ESLint
pnpm test           # Run tests in watch mode (vitest)
pnpm test:run       # Run tests once
pnpm type-check     # TypeScript type checking (tsc --noEmit)
```

## Architecture

### Package Structure

```
src/
  adapters/         # Web data & sync adapters (Dexie IndexedDB, shared QmServer auth)
  assets/           # Icons and assets
  components/       # UI components (atoms, molecules, organisms, pages, templates)
  contexts/         # React contexts (Theme, SyncToast)
  embed/            # Embedded entry (MoneyInsightApp, MoneyInsightAppProps, AuthTokens)
  hooks/            # React hooks
  lib/              # Business logic, budget calculations, date helpers
  platform/         # Platform provider and interfaces
  services/         # Service layer (ServiceFactory DI)
  shared/           # Types, constants, utilities, sync client types
  standalone/       # Standalone browser shell (App.tsx)
  stores/           # Zustand stores (spendingStore, categoryGroupStore, debtStore, budgetStore)
  styles/           # Tailwind CSS v4 design system (global.css)
  types/            # TypeScript interfaces and domain types
  utils/            # Utility helpers and logging
```

### Service Architecture

Services are injected via `ServiceFactory` (`src/adapters/factory/ServiceFactory.ts`) using setter functions:

```typescript
setTransactionService(new IndexedDBTransactionAdapter());
setAuthService(new QmServerAuthAdapter());
```

**Data Services** - IndexedDB via Dexie (`src/adapters/web/`):

- `IndexedDBTransactionAdapter`, `IndexedDBCategoryAdapter`, `IndexedDBAccountAdapter`, `IndexedDBDebtAdapter`, `IndexedDBBudgetAdapter`, etc.
- Debt domain service contract in `src/adapters/factory/interfaces/IDebtService.ts`; thin service wrappers in `src/services/debtService.ts`
- Database schema in `src/adapters/web/database.ts` (versions 1–5 preserved)

**Service Wiring**

- `MoneyInsightApp` initializes all IndexedDB adapters, injects them via setters, and passes the resolved service set through `PlatformProvider`.
- `PlatformContext` exposes transaction, category, categoryGroup, account, statistics, debt, budget, dashboardPreferences, notificationEvent, auth, and sync services.

### Key Conventions

- **Module Exports**:
  - `./embed`: `src/embed/index.ts`
  - `./styles`: `src/styles/global.css`
- **Imports**: All internal imports within the package use relative paths.
- **Port**: Standalone dev server runs on port 25096 (strictPort: true).
- **Embedded Mode**: `MoneyInsightApp` accepts `authTokens`, `embedded`, `useRouter`, `basePath`, `registerLogoutCleanup`. When `useRouter=false`, it renders without `BrowserRouter` to integrate seamlessly into host router.
