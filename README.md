# Werkbank – Unified Business Platform

A modular SaaS platform consolidating multiple internal tools into one unified application. Built with Next.js 16, Supabase, and TypeScript.

## Modules

| Module | Route | Description |
|--------|-------|-------------|
| VOB | `/vob` | VOB tender and document management |
| ROI | `/roi` | ROI calculator and business analytics |
| Fuhrpark | `/fuhrpark` | Fleet management (vehicles, damages, appointments) |
| Recruiting | `/recruiting` | Employee referral program management |
| Affiliate | `/affiliate` | Affiliate partner (Handwerker) referral management |
| Reviews | `/reviews` | Customer review management |

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode, no `any`)
- **Database:** Supabase (PostgreSQL + Row Level Security)
- **Auth:** Supabase Auth with SSR session management
- **Styling:** Tailwind CSS + shadcn/ui
- **Forms:** React Hook Form + Zod validation
- **Data fetching:** TanStack Query
- **Testing:** Vitest (unit) + Playwright (E2E)

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd GruppenwerkUnited
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Fill in your Supabase project values
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
  (modules)/          # Protected module pages (requires auth)
    fuhrpark/         # Fleet management
    recruiting/       # Recruiting module
    affiliate/        # Affiliate module
    roi/              # ROI calculator
    vob/              # VOB dashboard
  kunden/             # Public referral portal (no auth required)
    recruiting/       # Employee referral form
    affiliate/        # Affiliate referral form
  api/                # API routes
    recruiting/       # Recruiting API endpoints
    affiliate/        # Affiliate API endpoints
    cron/             # Scheduled jobs
    webhooks/         # Supabase webhook receivers
    health/           # Health check

components/
  layout/             # App shell, sidebar, header, module sub-navigation
  shared/             # Reusable components (EmptyState, ErrorState, etc.)
  ui/                 # shadcn/ui base components

lib/
  supabase/           # Supabase client setup (browser, server, admin, middleware)
  modules/            # Module-specific logic (auth, validators, utils)
    recruiting/
    affiliate/
    vob/
    roi/
  database/           # Database query functions (Fuhrpark module)
  validations/        # Zod schemas for all forms
  audit.ts            # Shared audit logging
  rate-limit.ts       # Shared in-memory rate limiter
  api-guards.ts       # Shared CSRF / origin validation
  env.ts              # Environment variable validation
  modules.ts          # Module registry – single source of truth for all modules

types/
  index.ts            # Fuhrpark domain types
  shared.ts           # Cross-module types (PaginatedResponse, AuditLogEntry, etc.)
  recruiting/         # Recruiting-specific types
  affiliate/          # Affiliate-specific types

hooks/                # Custom React hooks (TanStack Query wrappers)
supabase/migrations/  # Database migrations
__tests__/
  unit/               # Vitest unit tests
  e2e/                # Playwright end-to-end tests
```

## Adding a New Module

1. Register in `lib/modules.ts`:

```typescript
{
  id: 'my-module',
  name: 'Mein Modul',
  description: 'Kurze Beschreibung',
  route: '/my-module',
  icon: 'MyIcon',
  category: 'tool',
}
```

2. Create the page at `app/(modules)/my-module/page.tsx`

3. If the module needs tab navigation, create `app/(modules)/my-module/layout.tsx`:

```typescript
import { ModuleSubnav, type ModuleNavItem } from '@/components/layout/module-subnav';

const NAV_ITEMS: ModuleNavItem[] = [
  { href: '/my-module', label: 'Dashboard', icon: LayoutDashboard, exact: true },
];

export default function MyModuleLayout({ children }) {
  return <ModuleSubnav navItems={NAV_ITEMS}>{children}</ModuleSubnav>;
}
```

The module automatically appears in the sidebar and dashboard — no other changes needed.

## Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Production build
npm run lint             # ESLint
npm run test:unit        # Vitest unit tests
npm run test:unit:watch  # Vitest in watch mode
npm run test             # Playwright E2E tests (requires running server)
```

## Security

- All admin API routes require `requireAdmin()` — validates Supabase JWT + `app_metadata.is_admin`
- All mutating routes validate CSRF origin via `validateOrigin()`
- Public referral endpoints are rate-limited (20 req/hour per IP)
- Webhook signatures validated with HMAC-SHA256
- All user input validated with Zod before DB writes
- Security headers set in `next.config.js` (X-Frame-Options, CSP, etc.)

## Environment Variables

See `.env.example` for required variables.
