# WERKBANK — Gruppenwerk Intranet Platform

## Product Requirements Document (PRD) for Claude Code

---

## 1. Overview

**WERKBANK** is a password-protected, modular intranet platform for Gruppenwerk — a Hamburg-based holding company managing multiple trade and service subsidiaries. It consolidates all internal tools, dashboards, and client-facing pages into a single Next.js monorepo deployed on Vercel, backed by one shared Supabase database.

**Codename:** WERKBANK (German for "workbench" — the central table where all the tools are)

**Live URL (target):** `werkbank.gruppenwerk.de`

**Repo name:** `werkbank`

---

## 2. Architecture Philosophy

### 2.1 Core Principles

1. **One repo, one deploy, one database.** Every internal tool is a route inside one Next.js app. No more separate repos per project.
2. **Modular by design.** Each tool ("Modul") is a self-contained folder under `src/app/(modules)/`. Adding a new module = adding a new folder. No changes to existing code required.
3. **Shared shell, independent modules.** The layout, auth, navigation, and UI components are shared. Each module owns its own pages, API routes, queries, and types.
4. **Schema-per-module in Supabase.** Each module gets its own Postgres schema (e.g., `vob`, `fuhrpark`, `recruiting`). All schemas live in one Supabase project. The `public` schema is reserved for shared/cross-module tables (e.g., users, settings, audit log).
5. **Progressive complexity.** Start with a simple password gate. Evolve to user accounts with roles. The architecture supports both without rewrites.

### 2.2 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16+ (App Router, RSC) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4 |
| UI Components | shadcn/ui (base-nova style) |
| Charts | Recharts |
| PDF Generation | jsPDF + jspdf-autotable |
| Database | Supabase (PostgreSQL 17) |
| Hosting | Vercel |
| Auth (Phase 1) | Server-side password middleware |
| Auth (Phase 2) | Supabase Auth with role-based access |
| Icons | Lucide React |

### 2.3 Supabase Configuration

- **Organization:** GwDienstleistungROI (Pro plan, $25/month)
- **Project:** `ldmprzkregyicxgdbfsa`
- **Region:** eu-west-1
- **Host:** `db.ldmprzkregyicxgdbfsa.supabase.co`

All schemas must be added to Supabase **Settings → Data API → Exposed schemas** for the PostgREST API to serve them.

---

## 3. Authentication

### 3.1 Phase 1 — Simple Password Gate (Build This First)

Every route is protected by a single shared password via Next.js middleware.

**Password:** `1234test` (stored as `APP_PASSWORD` env var, server-side only)

**How it works:**

```
User visits any page
  → Middleware checks for `werkbank-auth` cookie
  → If missing or invalid → redirect to /login
  → /login page shows a password input
  → On submit → POST /api/auth/login (server-side route)
  → Server compares against process.env.APP_PASSWORD
  → If match → sets httpOnly secure cookie `werkbank-auth`
  → Redirect to requested page
```

**Implementation details:**

- `src/middleware.ts` — checks cookie on every request except `/login`, `/api/auth/login`, and static assets
- `src/app/login/page.tsx` — minimal, clean login page with password input. No username. Gruppenwerk branding.
- `src/app/api/auth/login/route.ts` — validates password server-side, sets httpOnly cookie
- `src/app/api/auth/logout/route.ts` — clears cookie, redirects to /login
- Cookie name: `werkbank-auth`
- Cookie value: a hash of the password + a secret (not the plaintext password)
- Cookie flags: `httpOnly`, `secure`, `sameSite: strict`, `path: /`

**Module-level passwords (future-ready):**
The middleware architecture should support an optional per-module password check. For now, one password for everything. But the middleware should be structured so adding `MODULE_PASSWORD_VOB=xyz` as an env var later is trivial.

### 3.2 Phase 2 — User Accounts with Roles (Future, Do Not Build Yet)

Eventually, WERKBANK will have a user system with:
- Supabase Auth (email/password login)
- Role-based access: `admin`, `company_lead`, `viewer`
- Per-module permissions (e.g., Werner Bau lead can only see VOB tenders for Werner Bau)
- Audit log of user actions

**Do not build any of this now.** But design the module structure so that swapping the password gate for real auth requires only changing the middleware and adding a user context provider — not restructuring every module.

---

## 4. Application Structure

### 4.1 Route Map

```
/                                   → Main Dashboard (Übersicht)
/login                              → Password login page

/(modules)/
├── vob/                            → VOB Tender Monitor
│   ├── page.tsx                    → VOB Dashboard (overview)
│   ├── alle/page.tsx               → All tenders table
│   ├── unternehmen/[slug]/page.tsx → Per-company tender view
│   ├── verlauf/page.tsx            → Scan history
│   └── api/                        → VOB-specific API routes
│
├── roi/                            → GW Dienstleistung ROI Calculator
│   └── page.tsx                    → Interactive ROI dashboard
│
├── recruiting/                     → Seehafer Recruiting Admin
│   └── page.tsx                    → Recruiting management
│
├── affiliate/                      → Seehafer Affiliate Admin
│   └── page.tsx                    → Affiliate/partner management
│
├── fuhrpark/                       → Fleet Management
│   └── page.tsx                    → Vehicle tracking & booking
│
├── reviews/                        → ReviewBot (Google Reviews)
│   └── page.tsx                    → Review management
│
└── [future-module]/                → Drop in new modules here

/kunden/                            → Client-facing pages (separate section)
├── [company-slug]/                 → Per-company client pages
│   └── page.tsx                    → Client portal page
└── ...

/api/
├── auth/login/route.ts
├── auth/logout/route.ts
└── [module-specific routes nested under each module]
```

### 4.2 File Architecture

```
werkbank/
├── AGENTS.md                       ← Claude Code instructions
├── CLAUDE.md                       ← References AGENTS.md
├── README.md
├── next.config.ts
├── package.json
├── tsconfig.json
├── vercel.json
├── .env.local                      ← Local env vars (gitignored)
│
├── src/
│   ├── app/
│   │   ├── layout.tsx              ← Root layout with shell
│   │   ├── page.tsx                ← Main dashboard
│   │   ├── login/
│   │   │   └── page.tsx            ← Login page
│   │   │
│   │   ├── (modules)/              ← Route group (no URL prefix)
│   │   │   ├── layout.tsx          ← Optional shared module layout
│   │   │   ├── vob/                ← VOB module (MIGRATE EXISTING)
│   │   │   │   ├── page.tsx
│   │   │   │   ├── alle/page.tsx
│   │   │   │   ├── unternehmen/[slug]/page.tsx
│   │   │   │   ├── verlauf/page.tsx
│   │   │   │   └── _components/   ← VOB-specific components
│   │   │   │       ├── TrendChart.tsx
│   │   │   │       ├── CompanyCard.tsx
│   │   │   │       └── ...
│   │   │   │
│   │   │   ├── roi/                ← ROI module
│   │   │   ├── recruiting/         ← Recruiting module
│   │   │   ├── affiliate/          ← Affiliate module
│   │   │   ├── fuhrpark/           ← Fleet module
│   │   │   └── reviews/            ← ReviewBot module
│   │   │
│   │   ├── kunden/                 ← Client-facing pages
│   │   │   └── [slug]/page.tsx
│   │   │
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   └── logout/route.ts
│   │   │   └── ... (module APIs can also live inside module folders)
│   │   │
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── ui/                     ← shadcn/ui components (shared)
│   │   │   ├── button.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── card.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/                 ← Shell components
│   │   │   ├── AppShell.tsx        ← Main layout wrapper
│   │   │   ├── Sidebar.tsx         ← Sidebar navigation
│   │   │   ├── Header.tsx          ← Top bar
│   │   │   ├── MobileNav.tsx       ← Mobile navigation
│   │   │   └── ModuleCard.tsx      ← Dashboard module tile
│   │   │
│   │   ├── shared/                 ← Cross-module components
│   │   │   ├── SearchBar.tsx
│   │   │   ├── StatusFilter.tsx
│   │   │   ├── ExportButton.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── ConfirmDialog.tsx
│   │   │
│   │   └── auth/                   ← Auth-related components
│   │       └── LoginForm.tsx
│   │
│   ├── lib/
│   │   ├── supabase.ts             ← Supabase client (anon key)
│   │   ├── supabase-admin.ts       ← Supabase admin client (service role)
│   │   ├── utils.ts                ← Shared utilities
│   │   ├── types.ts                ← Shared types
│   │   ├── constants.ts            ← Module registry, company data
│   │   │
│   │   └── modules/                ← Per-module data layer
│   │       ├── vob/
│   │       │   ├── queries.ts      ← All VOB Supabase queries
│   │       │   ├── types.ts        ← VOB-specific types
│   │       │   └── utils.ts        ← VOB-specific utilities
│   │       ├── fuhrpark/
│   │       │   ├── queries.ts
│   │       │   ├── types.ts
│   │       │   └── utils.ts
│   │       └── ... (one folder per module)
│   │
│   ├── middleware.ts                ← Auth middleware (password gate)
│   │
│   └── hooks/                      ← Shared React hooks
│       └── use-module-context.ts
│
├── public/
│   ├── favicon.ico
│   └── logo.svg                    ← Gruppenwerk / WERKBANK logo
│
└── supabase/
    └── migrations/                 ← SQL migration files for reference
        ├── 001_vob_schema.sql
        ├── 002_fuhrpark_schema.sql
        └── ...
```

---

## 5. Main Dashboard (`/`)

The landing page after login. Shows all available tools organized by category.

### 5.1 Layout

**Header:** "WERKBANK" logo + last login info + logout button

**Two sections:**

#### Section 1: "Werkzeuge" (Tools — ubiquitous, company-independent)

Grid of module cards. Each card shows:
- Module icon (from Lucide)
- Module name
- One-line description
- Status indicator (active/coming soon)
- Click → navigates to the module

**Initial ubiquitous tools:**

| Module | Icon | Route | Description | Status |
|---|---|---|---|---|
| VOB Monitor | `FileSearch` | `/vob` | Ausschreibungen überwachen | Active |
| ROI Rechner | `Calculator` | `/roi` | Dienstleistungs-ROI berechnen | Active |
| Fuhrpark | `Truck` | `/fuhrpark` | Fahrzeugverwaltung | Active |

#### Section 2: "Unternehmen" (Company-bound tools)

Grouped by company. Each company is a collapsible section or a filterable card grid.

**Sorting/filtering:** User can filter by company using a dropdown or toggle chips.

**Company-bound tools (initial):**

| Company | Module | Icon | Route | Description |
|---|---|---|---|---|
| Seehafer Elemente | Recruiting | `Users` | `/recruiting` | Bewerbermanagement |
| Seehafer Elemente | Affiliate | `Link` | `/affiliate` | Partner-Programm |
| All companies | Reviews | `Star` | `/reviews` | Google Bewertungen |

#### Section 3: "Kunden Seiten" (Client Pages)

A separate category showing links to client-facing pages. These are built separately but accessible from the dashboard.

Each entry shows:
- Company name
- Client page URL
- Status badge (live / in development)
- External link icon (opens in new tab or same app depending on setup)

### 5.2 Design

- Clean, minimal, monochrome with company accent colors
- Grid layout: 3-4 columns on desktop, 1-2 on mobile
- Cards: white bg, subtle border, hover effect, company color left accent for company-bound tools
- No clutter. Each card is exactly: icon, name, description, arrow.

---

## 6. Module Registry

Central configuration file that defines all modules. This is the single source of truth for the sidebar, dashboard, and routing.

```typescript
// src/lib/constants.ts

export interface ModuleConfig {
  id: string                        // Unique identifier
  name: string                      // Display name
  description: string               // One-line description
  route: string                     // Base route path
  icon: string                      // Lucide icon name
  category: 'tool' | 'company'     // Ubiquitous or company-bound
  company?: string                  // Company slug (if company-bound)
  companyName?: string              // Company display name
  companyColor?: string             // Company accent color
  schema?: string                   // Supabase schema name
  status: 'active' | 'coming_soon' | 'disabled'
}

export const MODULES: ModuleConfig[] = [
  // === Ubiquitous Tools ===
  {
    id: 'vob',
    name: 'VOB Monitor',
    description: 'Ausschreibungen überwachen & zuordnen',
    route: '/vob',
    icon: 'FileSearch',
    category: 'tool',
    schema: 'vob',
    status: 'active',
  },
  {
    id: 'roi',
    name: 'ROI Rechner',
    description: 'Dienstleistungs-ROI berechnen',
    route: '/roi',
    icon: 'Calculator',
    category: 'tool',
    status: 'active',
  },
  {
    id: 'fuhrpark',
    name: 'Fuhrpark',
    description: 'Fahrzeuge verwalten & buchen',
    route: '/fuhrpark',
    icon: 'Truck',
    category: 'tool',
    schema: 'fuhrpark',
    status: 'active',
  },
  // === Company-bound Tools ===
  {
    id: 'recruiting',
    name: 'Recruiting',
    description: 'Bewerbermanagement',
    route: '/recruiting',
    icon: 'Users',
    category: 'company',
    company: 'seehafer-elemente',
    companyName: 'Seehafer Elemente',
    companyColor: '#1F4E79',
    schema: 'recruiting',
    status: 'active',
  },
  {
    id: 'affiliate',
    name: 'Affiliate',
    description: 'Partner-Programm verwalten',
    route: '/affiliate',
    icon: 'Link',
    category: 'company',
    company: 'seehafer-elemente',
    companyName: 'Seehafer Elemente',
    companyColor: '#1F4E79',
    schema: 'affiliate',
    status: 'active',
  },
  {
    id: 'reviews',
    name: 'Reviews',
    description: 'Google Bewertungen verwalten',
    route: '/reviews',
    icon: 'Star',
    category: 'company',
    company: 'all',
    companyName: 'Alle Unternehmen',
    companyColor: '#171717',
    schema: 'reviewbot',
    status: 'active',
  },
]

// Gruppenwerk companies (for filtering, display, etc.)
export const COMPANIES = [
  { slug: 'seehafer-elemente', name: 'Seehafer Elemente', color: '#1F4E79' },
  { slug: 'tischlerei-brink', name: 'Tischlerei Brink', color: '#3A7CA5' },
  { slug: 'maler-hantke', name: 'Maler Hantke', color: '#E67E22' },
  { slug: 'werner-bau', name: 'Werner Bau', color: '#7F8C8D' },
  { slug: 'werner-geruestbau', name: 'J. Werner Gerüstbau', color: '#95A5A6' },
  { slug: 'mehlig', name: 'Mehlig GmbH', color: '#8E44AD' },
  { slug: 'gruppenwerk-bsi', name: 'Gruppenwerk BSI', color: '#34495E' },
  { slug: 'groundpassion', name: 'GroundPassion', color: '#27AE60' },
] as const
```

**To add a new module:**
1. Add an entry to `MODULES` in `constants.ts`
2. Create a folder under `src/app/(modules)/[module-id]/`
3. Create a folder under `src/lib/modules/[module-id]/` for queries/types
4. If needed, create a new Supabase schema and add it to exposed schemas
5. Done. The sidebar and dashboard render automatically from the registry.

---

## 7. Sidebar Navigation

The sidebar is auto-generated from the `MODULES` registry.

### Structure:

```
┌─────────────────────────┐
│ ⚙ WERKBANK              │  ← Logo/brand
├─────────────────────────┤
│ 🏠 Dashboard             │  ← Always first
├─────────────────────────┤
│ WERKZEUGE                │  ← Section header
│  📋 VOB Monitor          │
│  🧮 ROI Rechner          │
│  🚚 Fuhrpark             │
├─────────────────────────┤
│ SEEHAFER ELEMENTE        │  ← Company header
│  ● Recruiting            │  ← Color dot
│  ● Affiliate             │
├─────────────────────────┤
│ ALLE UNTERNEHMEN         │
│  ● Reviews               │
├─────────────────────────┤
│ KUNDEN                   │  ← Section header
│  → Kundenseiten          │  ← Link to /kunden
├─────────────────────────┤
│ ← Abmelden              │  ← Logout
└─────────────────────────┘
```

- Desktop: 240px fixed left sidebar
- Mobile: Sheet/drawer triggered by floating menu button
- Active state: bg highlight, bold text
- Coming soon modules: grayed out, "(bald)" suffix

---

## 8. Supabase Database Architecture

### 8.1 Schemas

| Schema | Module | Status |
|---|---|---|
| `public` | Shared tables (users, settings, audit) | Reserved for Phase 2 |
| `vob` | VOB Monitor | Tables created, needs data |
| `fuhrpark` | Fleet Management | Schema created, tables TBD |
| `recruiting` | Seehafer Recruiting | Schema created, tables TBD |
| `affiliate` | Seehafer Affiliate | Schema created, tables TBD |
| `reviewbot` | ReviewBot | Schema created, tables TBD |

### 8.2 VOB Schema (Already Built)

Tables: `companies`, `vob_scans`, `vob_tenders`, `vob_matches`, `vob_dashboard`, `company_trends`, `company_weekly_stats`

See existing VOB code for full schema. Companies table is seeded with 8 Gruppenwerk subsidiaries.

### 8.3 Schema Setup Pattern

Every new module follows this pattern:

```sql
-- 1. Create schema
CREATE SCHEMA IF NOT EXISTS [module_name];

-- 2. Grant permissions
GRANT USAGE ON SCHEMA [module_name] TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA [module_name] TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA [module_name] TO authenticated, service_role;

-- 3. Future table permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA [module_name]
  GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA [module_name]
  GRANT ALL ON TABLES TO authenticated, service_role;

-- 4. Add to Supabase Data API → Exposed schemas
```

### 8.4 Supabase Client Pattern

```typescript
// Shared client — src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Per-module queries always specify schema:
// src/lib/modules/vob/queries.ts
export async function getCompanies() {
  const { data } = await supabase
    .schema('vob')
    .from('companies')
    .select('*')
    .eq('active', true)
    .order('name')
  return data ?? []
}
```

---

## 9. Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ldmprzkregyicxgdbfsa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Auth (Phase 1)
APP_PASSWORD=1234test
AUTH_SECRET=<random-32-char-string-for-cookie-signing>

# App
NEXT_PUBLIC_APP_URL=https://werkbank.gruppenwerk.de
```

---

## 10. Module Migration Plan

### 10.1 VOB Monitor (Priority 1 — Migrate First)

The VOB module is fully built. Migration steps:
1. Copy all VOB components from existing repo into `src/app/(modules)/vob/`
2. Move VOB-specific components to `src/app/(modules)/vob/_components/`
3. Move queries to `src/lib/modules/vob/queries.ts`
4. Move types to `src/lib/modules/vob/types.ts`
5. Move utilities to `src/lib/modules/vob/utils.ts`
6. Update imports to use the new paths
7. Remove standalone sidebar/layout (replaced by shared shell)
8. Verify all `.schema('vob')` calls work

**Key files to migrate from existing vob-dashboard repo:**
- `src/lib/queries.ts` → `src/lib/modules/vob/queries.ts`
- `src/lib/types.ts` → `src/lib/modules/vob/types.ts`
- `src/lib/utils.ts` → keep shared utils in `src/lib/utils.ts`, move VOB-specific to module
- `src/lib/match-suggest.ts` → `src/lib/modules/vob/match-suggest.ts`
- `src/lib/pdf-generator.ts` → `src/lib/modules/vob/pdf-generator.ts`
- `src/lib/supabase.ts` → `src/lib/supabase.ts` (shared)
- `src/lib/supabase-admin.ts` → `src/lib/supabase-admin.ts` (shared)
- All page components under `src/app/` → `src/app/(modules)/vob/`
- All API routes → `src/app/(modules)/vob/api/` or `src/app/api/vob/`
- VOB-specific components → `src/app/(modules)/vob/_components/`

### 10.2 ROI Calculator (Priority 2)

The Das Flywheel ROI dashboard. Currently a standalone static HTML page.
- If it's pure HTML/JS, convert to a React component
- Route: `/roi`
- No Supabase schema needed (client-side only calculations)

### 10.3 Remaining Modules (Priority 3+)

Build as needed. Each follows the module scaffold pattern:

```
src/app/(modules)/[id]/
├── page.tsx              ← Main page (can be a placeholder)
├── _components/          ← Module-specific components
└── api/                  ← Module-specific API routes (if needed)

src/lib/modules/[id]/
├── queries.ts            ← Supabase queries
├── types.ts              ← TypeScript types
└── utils.ts              ← Module-specific utilities
```

---

## 11. Design System

### 11.1 Colors

```css
:root {
  /* Brand */
  --werkbank-primary: #171717;      /* Near-black */
  --werkbank-accent: #1F4E79;       /* Gruppenwerk blue */

  /* Neutral (monochrome palette) */
  --neutral-50: #fafafa;
  --neutral-100: #f5f5f5;
  --neutral-200: #e5e5e5;
  --neutral-300: #d4d4d4;
  --neutral-400: #a3a3a3;
  --neutral-500: #737373;
  --neutral-600: #525252;
  --neutral-700: #404040;
  --neutral-800: #262626;
  --neutral-900: #171717;

  /* Status */
  --urgent: #C62828;
  --warning: #F9A825;
  --success: #2E7D32;
  --muted: #9E9E9E;
}
```

Company colors come from the `COMPANIES` constant and are applied dynamically via `style={{ borderColor: company.color }}` etc.

### 11.2 Typography

- Font: Geist Sans (loaded via next/font/local)
- Mono: Geist Mono (for code/tabular data)
- Sizes: 10px labels, 11px secondary, 12px body, 13px emphasis, 14-18px headings
- German UI language throughout

### 11.3 Component Style

- Cards: `rounded-xl border border-neutral-200/60 bg-white`
- Badges: pill shape, colored per status/urgency
- Tables: clean, minimal borders, hover rows
- Buttons: small, outlined for secondary, filled black for primary
- Overall feel: clean, professional, tool-like. Not flashy. Think Linear or Vercel dashboard.

---

## 12. Kunden Seiten (Client Pages)

### 12.1 Concept

Client-facing pages live under `/kunden/[company-slug]`. These are **separately designed** from the internal tools — they may have their own branding, layout, and even be publicly accessible (with their own password if needed).

### 12.2 Architecture

```
src/app/kunden/
├── layout.tsx              ← Client pages layout (different from internal)
├── [slug]/
│   └── page.tsx            ← Dynamic client page per company
└── ...
```

The internal dashboard links to these pages. The client pages themselves are built independently — they do NOT use the WERKBANK shell (sidebar, header, etc.). They have their own layout, potentially their own branding, and their own auth if needed.

### 12.3 Phase 1

Just show links on the dashboard. The actual client pages will be built separately when needed. The `/kunden` route can start as a simple directory page listing all companies with "Coming soon" badges.

---

## 13. API Route Convention

Module-specific API routes can live in two places:

**Option A (co-located):** Inside the module folder
```
src/app/(modules)/vob/api/tenders/delete/route.ts
```

**Option B (centralized):** Under the global API folder with module prefix
```
src/app/api/vob/tenders/delete/route.ts
```

**Use Option B** for consistency. All API routes under `/api/[module]/...`. This keeps the API surface predictable and avoids route group complications with API routes.

---

## 14. Adding a New Module — Checklist

When building a new module, follow these steps:

### Step 1: Register
Add the module to `MODULES` in `src/lib/constants.ts`.

### Step 2: Database (if needed)
Create a Supabase schema:
```sql
CREATE SCHEMA IF NOT EXISTS [name];
GRANT USAGE ON SCHEMA [name] TO anon, authenticated, service_role;
-- ... (see schema setup pattern above)
```
Add it to Supabase Data API → Exposed schemas.

### Step 3: Data Layer
Create `src/lib/modules/[name]/queries.ts`, `types.ts`, `utils.ts`.

### Step 4: Pages
Create `src/app/(modules)/[name]/page.tsx` and sub-pages.

### Step 5: Components
Create `src/app/(modules)/[name]/_components/` for module-specific UI.

### Step 6: API Routes
Create `src/app/api/[name]/...` if the module needs server-side logic.

### Step 7: Test
The module should appear in the sidebar and dashboard automatically.

---

## 15. Build Order for Claude Code

### Phase 1: Shell + Auth + Dashboard
1. `npx create-next-app@latest werkbank --typescript --tailwind --app --src-dir`
2. Install dependencies: `@supabase/supabase-js`, `lucide-react`, shadcn/ui components
3. Set up middleware with password protection
4. Build login page
5. Build AppShell (sidebar, header, mobile nav)
6. Build main dashboard with module cards from registry
7. Build `/kunden` placeholder page
8. Deploy to Vercel, set env vars, verify auth works

### Phase 2: Migrate VOB Module
1. Copy all VOB code into the module structure
2. Adapt imports and remove standalone layout
3. Verify all pages work under `/vob/...`
4. Verify Supabase queries work with `.schema('vob')`
5. Test VOB scan data flow end-to-end

### Phase 3: Migrate ROI Module
1. Convert existing ROI HTML dashboard to React component
2. Place under `/roi`
3. No Supabase needed

### Phase 4: Build Remaining Module Placeholders
1. Create placeholder pages for `/recruiting`, `/affiliate`, `/fuhrpark`, `/reviews`
2. Each shows an empty state: "Dieses Modul wird gerade entwickelt."
3. Full functionality will be built later per-module

---

## 16. Claude Code Instructions (AGENTS.md)

Include this as `AGENTS.md` in the repo root:

```markdown
# WERKBANK — Claude Code Instructions

## What is this?
WERKBANK is Gruppenwerk's internal platform (intranet). One monorepo, one Vercel deploy, one Supabase project. All internal tools are "modules" under `src/app/(modules)/`.

## Architecture Rules
1. Every module is a folder under `src/app/(modules)/[id]/`
2. Module data logic goes in `src/lib/modules/[id]/`
3. Shared components go in `src/components/`
4. Module-specific components go in the module's `_components/` folder
5. API routes go under `src/app/api/[module]/`
6. New modules must be registered in `src/lib/constants.ts` MODULES array
7. All Supabase queries MUST use `.schema('[schema-name]')` — never use the `public` schema for module data
8. UI language is German
9. Use shadcn/ui components, Tailwind CSS, Lucide icons
10. Keep everything minimal and clean — Linear/Vercel dashboard aesthetic

## Supabase
- Project: ldmprzkregyicxgdbfsa (eu-west-1)
- One project, multiple schemas (vob, fuhrpark, recruiting, affiliate, reviewbot)
- Exposed schemas must be configured in Supabase Data API settings
- Service role key for writes, anon key for reads

## Auth
- Phase 1: Server-side password gate via middleware
- Password in env var APP_PASSWORD (never NEXT_PUBLIC_)
- Cookie: werkbank-auth (httpOnly, secure, sameSite strict)

## Existing Modules
- VOB: Fully built, migrate from vob-dashboard repo
- ROI: Static dashboard, convert to React component
- Others: Placeholder pages only for now

## Style Guide
- Font sizes: 10-11px labels, 12px body, 13px emphasis, 14-18px headings
- Cards: rounded-xl, white bg, subtle border
- Colors: monochrome + company accent colors from constants.ts
- All UI text in German
```

---

## 17. Dependencies

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.99.x",
    "class-variance-authority": "^0.7.x",
    "clsx": "^2.x",
    "date-fns": "^4.x",
    "jspdf": "^4.x",
    "jspdf-autotable": "^5.x",
    "lucide-react": "^0.577.x",
    "next": "16.x",
    "react": "19.x",
    "react-dom": "19.x",
    "recharts": "^3.x",
    "tailwind-merge": "^3.x",
    "tw-animate-css": "^1.x"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

shadcn/ui components to install:
```bash
npx shadcn@latest init
npx shadcn@latest add card badge table tabs select separator skeleton button dropdown-menu sheet
```

---

## 18. Deployment

- **Platform:** Vercel
- **Team:** Sebastian Seehafer's projects (`team_IkXAb5ZHH2WhuIMbTItSe39r`)
- **Project name:** `werkbank`
- **Domain:** `werkbank.gruppenwerk.de` (configure after first deploy)
- **Region:** Auto (Vercel Edge, closest to eu-west-1 Supabase)
- **Build command:** `next build`
- **Output directory:** `.next`
- **Node.js version:** 20.x or 24.x

### Env vars to set in Vercel:
| Key | Type |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Plaintext |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Encrypted |
| `SUPABASE_SERVICE_ROLE_KEY` | Encrypted |
| `APP_PASSWORD` | Encrypted |
| `AUTH_SECRET` | Encrypted |

---

## 19. Success Criteria

### MVP (Phase 1 complete when):
- [ ] Login page works with password `1234test`
- [ ] Main dashboard shows module cards organized by Werkzeuge / Unternehmen / Kunden
- [ ] Sidebar navigation auto-generated from module registry
- [ ] VOB module fully functional under `/vob/...`
- [ ] ROI calculator accessible under `/roi`
- [ ] Placeholder pages for all other modules
- [ ] Mobile responsive
- [ ] Deployed on Vercel with custom domain
- [ ] All old Vercel projects can be archived

### Future (not part of this build):
- [ ] User accounts with Supabase Auth
- [ ] Role-based access control
- [ ] Per-module permissions
- [ ] Audit logging
- [ ] Real-time notifications
- [ ] Module-level analytics
