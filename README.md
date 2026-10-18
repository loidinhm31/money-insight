# Money Insight

Offline-first personal finance tracker with end-to-end sync, browser deployment, and powerful analytics. Track transactions, manage accounts, analyze spending patterns, and access your financial data across standalone web and embedded (`glean-hub-app`) deployments.

## Quick Start

### Prerequisites
- Node.js 20+ (or 24.x recommended)
- pnpm 10.28.2+

### Web Development
```bash
# Install dependencies
pnpm install --ignore-workspace

# Start dev server (http://localhost:25096)
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test:run

# Type check
pnpm type-check

# Lint
pnpm lint
```

## Features

- **Transaction Management**: Add, edit, delete transactions with full offline support
- **Multi-Account**: Track checking, savings, credit card, and wallet accounts
- **Hierarchical Categories**: Parent groups → child categories with icons (35-icon library)
- **Powerful Reports**: Monthly/yearly spending analysis, pie charts, trend lines, bottleneck detection
- **Budget tracking**: Monthly recurring budgets, cycle usage, over-budget warnings, and queued `notificationEvents` records
- **CSV Import**: Bulk import transactions from spreadsheets
- **Transfer Pairs**: Link related debit/credit transactions (e.g., moving money between accounts)
- **Balance Adjustments**: Manual corrections without affecting expense tracking
- **Themes**: Light, dark, and cyber themes with CSS variables
- **Offline-First**: Full functionality without internet; automatic sync when available
- **Web & Embed**: Standalone web app and embedded package for glean-hub-app

## Architecture Overview

Money Insight is structured as a single browser package (`@money-insight/app`):

```
src/
  ├── adapters/     # Web adapters (IndexedDB, HTTP, shared QmServer auth)
  ├── assets/       # Icons and graphics
  ├── components/   # Atomic design UI components (atoms, molecules, organisms, pages, templates)
  ├── contexts/     # React contexts (Theme, SyncToast)
  ├── embed/        # Embedded entry (MoneyInsightApp, MoneyInsightAppProps)
  ├── hooks/        # React hooks
  ├── lib/          # Business logic, budget calculations, date helpers
  ├── platform/     # Platform provider and interfaces
  ├── services/     # Service layer (ServiceFactory DI)
  ├── shared/       # Shared types, constants, utilities, sync client types
  ├── standalone/   # Standalone web shell (App.tsx)
  ├── stores/       # Zustand stores (spendingStore, categoryGroupStore, debtStore, budgetStore)
  ├── styles/       # Tailwind CSS v4 design system (global.css)
  ├── types/        # TypeScript interfaces and domain types
  └── utils/        # Utilities and logging
```

### Key Technologies
- **Frontend**: React 19 + React Router 7 + Tailwind CSS v4
- **State**: Zustand (spendingStore, categoryGroupStore, debtStore, budgetStore)
- **Database**: IndexedDB via Dexie.js (offline-first), including synced `debts`, `debtSettlements`, `budgets`, and `notificationEvents` tables
- **Sync**: glean-hub-sync-client with checkpoint-based pagination
- **Auth**: JWT + refresh-token rotation via `QmServerAuthAdapter`
- **Styling**: CSS variables (3 themes) + Tailwind CSS v4

### Exports
- `./embed`: `src/embed/index.ts` exporting `MoneyInsightApp`, `MoneyInsightAppProps`, `AuthTokens`
- `./styles`: `src/styles/global.css`
