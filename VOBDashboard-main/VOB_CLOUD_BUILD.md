# VOB Cloud Build — Instructions for Claude Code

## Overview

Build a fully cloud-hosted VOB monitoring pipeline for Gruppenwerk. The system scrapes public construction tenders from hamburg.de, matches them intelligently to Gruppenwerk companies, stores results in Supabase (organized per company), and displays them on a Vercel-hosted website. Multiple company leads use the site — each navigates to their own company's section to review relevant tenders, view trends, and export PDFs for Ausschreibung applications.

**Architecture:**
```
User triggers skill in Claude.ai
  → Claude calls Firecrawl API (cloud scraping)
  → Claude analyzes & matches tenders to Gruppenwerk companies
  → Claude pushes structured results to Supabase (per-company organized)
  → Vercel site reads from Supabase and displays results
  → Company leads check their section whenever they want
```

**No local dependencies.** Everything runs in the cloud.

**Users:** Kerim (admin/overview), Axel Seehafer, and individual company leads — each checks their own company's tenders.

---

## Part 1: Supabase Setup

### 1a. Database Schema

```sql
-- ═══════════════════════════════════════════════════
-- COMPANIES — The Gruppenwerk companies we track for
-- ═══════════════════════════════════════════════════
CREATE TABLE companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,             -- "Maler Hantke"
  slug TEXT UNIQUE NOT NULL,             -- "maler-hantke" (used in URLs and storage paths)
  trades TEXT[] NOT NULL,                -- ARRAY['Maler', 'Fassade', 'Anstrich']
  keywords TEXT[] NOT NULL,              -- ARRAY['maler', 'fassade', 'anstrich', 'lackier']
  color TEXT DEFAULT '#1F4E79',          -- Brand color for UI cards
  icon TEXT,                             -- Optional emoji or icon identifier
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed with Gruppenwerk companies
INSERT INTO companies (name, slug, trades, keywords, color) VALUES
  ('Seehafer Elemente', 'seehafer-elemente', ARRAY['Tischler','Fenster','Türen','Innentüren','Holzbau'], ARRAY['tischler','fenster','türen','innentüren','holz','schreiner','möbel','pfosten-riegel','fassade'], '#1F4E79'),
  -- Tischlerei Seehafer removed (outdated name for Seehafer Elemente)
  ('Tischlerei Brink', 'tischlerei-brink', ARRAY['Tischler','Möbelbau','Innenausbau'], ARRAY['tischler','möbel','innenausbau','schreiner'], '#3A7CA5'),
  ('Maler Hantke', 'maler-hantke', ARRAY['Maler','Fassade','Anstrich','Lackierung','Tapezierung','WDVS'], ARRAY['maler','fassade','anstrich','lackier','tapezier','beschichtung','wdvs','wärmedämm','dämmung','putz'], '#E67E22'),
  ('Werner Bau', 'werner-bau', ARRAY['Rohbau','Generalunternehmer','Hochbau','Maurerarbeiten'], ARRAY['rohbau','generalunternehmer','hochbau','maurer','beton','gu-leistung','abbruch'], '#7F8C8D'),
  ('J. Werner Gerüstbau', 'werner-geruestbau', ARRAY['Gerüst','Gerüstbau','Fassadengerüst'], ARRAY['gerüst','gerüstbau','fassadengerüst','einrüstung'], '#95A5A6'),
  ('GroundPassion', 'groundpassion', ARRAY['Immobilienberatung','Asset Management','Investment Advisory'], ARRAY['immobilien','investment','asset management','beratung','real estate'], '#27AE60'),
  ('Mehlig GmbH', 'mehlig', ARRAY['Tischlerarbeiten','Innenausbau','Möbelbau','Objekteinrichtung'], ARRAY['tischler','innenausbau','möbelbau','objekteinrichtung','möbel','schreiner','einrichtung'], '#8E44AD');

-- ═══════════════════════════════════════════════════
-- SCANS — Log of each scraping run (created first, referenced by tenders)
-- ═══════════════════════════════════════════════════
CREATE TABLE vob_scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_date DATE DEFAULT CURRENT_DATE,
  calendar_week INT NOT NULL,
  year INT NOT NULL,
  total_listings INT,
  matched_count INT,
  new_listings INT DEFAULT 0,             -- How many were new vs already known
  report_url TEXT,                        -- Global DOCX report in Supabase Storage
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════
-- TENDERS — Every scraped VOB Ausschreibung
-- ═══════════════════════════════════════════════════
CREATE TABLE vob_tenders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  authority TEXT,                         -- "SBH | Schulbau Hamburg"
  deadline TEXT,                          -- Raw string: "11.03.2026, 10:00 Uhr"
  deadline_date DATE,                     -- Parsed date for sorting/filtering/urgency
  category TEXT,                          -- Extracted trade category
  url TEXT UNIQUE NOT NULL,               -- hamburg.de URL (dedup key)
  status TEXT DEFAULT 'active',           -- 'active' | 'expired' | 'archived'
  scan_id UUID REFERENCES vob_scans(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════
-- MATCHES — Links tenders to companies (many-to-many)
-- ═══════════════════════════════════════════════════
CREATE TABLE vob_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID REFERENCES vob_tenders(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  company_slug TEXT NOT NULL,             -- Denormalized for fast queries
  relevance TEXT DEFAULT 'hoch',          -- "sehr hoch" | "hoch" | "mittel"
  reason TEXT,                            -- Claude's explanation for the match
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tender_id, company_id)           -- One match per company per tender
);

-- ═══════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════
CREATE INDEX idx_tenders_created ON vob_tenders(created_at DESC);
CREATE INDEX idx_tenders_url ON vob_tenders(url);
CREATE INDEX idx_tenders_status ON vob_tenders(status);
CREATE INDEX idx_tenders_deadline ON vob_tenders(deadline_date);
CREATE INDEX idx_matches_company ON vob_matches(company_slug);
CREATE INDEX idx_matches_tender ON vob_matches(tender_id);
CREATE INDEX idx_scans_date ON vob_scans(scan_date DESC);
CREATE INDEX idx_scans_year_week ON vob_scans(year, calendar_week);
```

### 1b. Supabase Storage — Per-Company Folders

Create a storage bucket `vob-reports` with the following folder structure:

```
vob-reports/
├── global/                          -- Full weekly reports
│   ├── VOB_Monitor_KW12_2026-03-20.docx
│   └── ...
├── maler-hantke/                    -- Per-company export PDFs
│   ├── VOB_Maler-Hantke_2026-03-20.pdf
│   └── ...
├── seehafer-elemente/
├── tischlerei-brink/
├── werner-geruestbau/
├── mehlig/
├── groundpassion/
├── werner-bau/
└── tischlerei-seehafer/
```

**Bucket settings:**
- **Public:** Yes (download links work without auth)
- **File naming:** `VOB_{CompanySlug}_{YYYY-MM-DD}.pdf` for per-company exports
- **File naming:** `VOB_Monitor_KW{week}_{YYYY-MM-DD}.docx` for global reports

### 1c. Useful Views

```sql
-- Main dashboard view: tenders with their matches and urgency
CREATE VIEW vob_dashboard AS
SELECT
  t.id AS tender_id,
  t.title,
  t.authority,
  t.deadline,
  t.deadline_date,
  t.category,
  t.url,
  t.status,
  t.created_at,
  m.company_slug,
  c.name AS company_name,
  c.color AS company_color,
  m.relevance,
  m.reason,
  s.calendar_week,
  s.year,
  s.scan_date,
  s.report_url,
  CASE
    WHEN t.deadline_date IS NULL THEN 'unknown'
    WHEN t.deadline_date < CURRENT_DATE THEN 'expired'
    WHEN t.deadline_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'urgent'
    WHEN t.deadline_date <= CURRENT_DATE + INTERVAL '14 days' THEN 'soon'
    ELSE 'normal'
  END AS urgency
FROM vob_tenders t
LEFT JOIN vob_matches m ON m.tender_id = t.id
LEFT JOIN companies c ON c.id = m.company_id
LEFT JOIN vob_scans s ON s.id = t.scan_id
ORDER BY t.created_at DESC;

-- Company statistics: counts per company per week
CREATE VIEW company_weekly_stats AS
SELECT
  c.name AS company_name,
  c.slug AS company_slug,
  c.color,
  s.calendar_week,
  s.year,
  s.scan_date,
  COUNT(DISTINCT m.tender_id) AS tender_count
FROM companies c
CROSS JOIN vob_scans s
LEFT JOIN vob_matches m ON m.company_slug = c.slug
  AND m.tender_id IN (
    SELECT id FROM vob_tenders WHERE scan_id = s.id
  )
WHERE c.active = true
GROUP BY c.name, c.slug, c.color, s.calendar_week, s.year, s.scan_date
ORDER BY s.year DESC, s.calendar_week DESC, c.name;

-- Trend data: for sparklines and incline/decline indicators
CREATE VIEW company_trends AS
SELECT
  company_slug,
  company_name,
  color,
  calendar_week,
  year,
  tender_count,
  LAG(tender_count) OVER (PARTITION BY company_slug ORDER BY year, calendar_week) AS prev_week_count,
  tender_count - COALESCE(LAG(tender_count) OVER (PARTITION BY company_slug ORDER BY year, calendar_week), 0) AS week_change
FROM company_weekly_stats;
```

### 1d. Row Level Security

```sql
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE vob_tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE vob_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE vob_scans ENABLE ROW LEVEL SECURITY;

-- Public read (site is view-only)
CREATE POLICY "Public read" ON companies FOR SELECT USING (true);
CREATE POLICY "Public read" ON vob_tenders FOR SELECT USING (true);
CREATE POLICY "Public read" ON vob_matches FOR SELECT USING (true);
CREATE POLICY "Public read" ON vob_scans FOR SELECT USING (true);

-- Write via service role (Claude skill via MCP)
CREATE POLICY "Service insert" ON vob_tenders FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update" ON vob_tenders FOR UPDATE USING (true);
CREATE POLICY "Service insert" ON vob_matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Service insert" ON vob_scans FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update" ON vob_scans FOR UPDATE USING (true);
```

### 1e. Auto-Expire Function

```sql
CREATE OR REPLACE FUNCTION expire_old_tenders()
RETURNS void AS $$
BEGIN
  UPDATE vob_tenders
  SET status = 'expired', updated_at = now()
  WHERE status = 'active'
    AND deadline_date IS NOT NULL
    AND deadline_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;
```

---

## Part 2: Next.js Project (Vercel Site)

### 2a. Scaffold

```bash
npx create-next-app@latest vob-monitor --typescript --tailwind --app --src-dir
cd vob-monitor
npm install @supabase/supabase-js
npx shadcn@latest init
npx shadcn@latest add card badge table tabs select separator skeleton button dropdown-menu
npm install recharts
npm install jspdf jspdf-autotable
npm install date-fns
```

### 2b. Environment Variables

`.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=https://vob.gruppenwerk.de
```

### 2c. Project Structure

```
src/
├── app/
│   ├── layout.tsx                     -- Shell with sidebar navigation
│   ├── page.tsx                       -- Dashboard (overview for all companies)
│   ├── unternehmen/
│   │   └── [slug]/
│   │       └── page.tsx               -- Per-company detail page
│   ├── alle/
│   │   └── page.tsx                   -- Full tender list (all companies)
│   ├── verlauf/
│   │   └── page.tsx                   -- Scan history & downloads
│   └── api/
│       └── export/
│           ├── [slug]/
│           │   └── route.ts           -- Per-company PDF export
│           └── tender/
│               └── [id]/
│                   └── route.ts       -- Single tender PDF export
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx                -- Company navigation sidebar
│   │   ├── Header.tsx                 -- Top bar with scan status
│   │   └── MobileNav.tsx              -- Responsive mobile nav
│   ├── dashboard/
│   │   ├── CompanyCard.tsx            -- Company summary card
│   │   ├── StatsOverview.tsx          -- Total numbers bar
│   │   ├── TrendChart.tsx             -- Recharts chart with toggle
│   │   └── TrendToggle.tsx            -- Week/Month/4-week toggle
│   ├── tenders/
│   │   ├── TenderCard.tsx             -- Individual tender display
│   │   ├── TenderTable.tsx            -- Full table view
│   │   ├── TenderDrawer.tsx           -- Slide-over detail panel
│   │   ├── UrgencyBadge.tsx           -- Red/yellow/green deadline badge
│   │   └── NewBadge.tsx               -- "Neu" badge for fresh tenders
│   ├── filters/
│   │   ├── CompanyFilter.tsx
│   │   ├── StatusFilter.tsx
│   │   ├── WeekFilter.tsx
│   │   └── SearchBar.tsx
│   └── export/
│       ├── ExportButton.tsx           -- "PDF exportieren" button
│       └── DownloadReport.tsx         -- Weekly DOCX download
├── lib/
│   ├── supabase.ts
│   ├── queries.ts                     -- All Supabase query functions
│   ├── types.ts                       -- TypeScript types
│   ├── pdf-generator.ts              -- PDF generation logic
│   └── utils.ts                       -- Date parsing, urgency calc
└── styles/
    └── globals.css
```

---

## Part 3: Pages & Features

### 3a. Dashboard — `/` (Übersicht)

The control room for all Gruppenwerk VOB activity.

**Top Stats Bar:**
- Last scan date and time
- Total active Ausschreibungen (big number)
- Total matched across all companies (big number)
- Global DOCX download button

**Company Cards Grid (8 cards):**
Each Gruppenwerk company gets a card showing:
- Company name with brand color accent (left border or top stripe)
- Number of active matched tenders (large, prominent number)
- Trend indicator: ↑ / ↓ / → arrow with count change vs previous period
- Next upcoming deadline (date + "noch X Tage")
- Red urgency dot if any tender is ≤ 7 days
- Click → navigates to `/unternehmen/{slug}`

**Trend Chart:**
- Line or bar chart showing tender counts over time
- **Toggleable timeframes:**
  - "Woche" — week over week (KW vs KW)
  - "Monat" — month over month
  - "4 Wochen" — rolling 4-week average
- One line/bar per company, color-coded from DB
- X-axis: KW numbers or month labels
- Y-axis: Number of matching tenders
- Tooltip on hover showing exact numbers

**Recent Activity Feed:**
- Latest 10 tenders added, showing which companies they matched
- "Neu" badge on tenders from most recent scan
- Click → opens TenderDrawer

### 3b. Company Page — `/unternehmen/[slug]`

What a company lead bookmarks. Their dedicated view.

**Header:**
- Company name with colored accent
- Trades listed as small badges
- Active tender count (large number)
- Trend sparkline (mini chart, last 8 weeks)
- "PDF exportieren" button

**Tender List (default: card view, toggle to table):**
Each tender shows:
- Title (linked to hamburg.de)
- Authority (Auftraggeber)
- Deadline with urgency color:
  - 🔴 ≤ 7 days
  - 🟡 8–14 days
  - 🟢 > 14 days
  - ⚫ Expired
- Category / Gewerk
- Relevance badge (sehr hoch / hoch / mittel)
- Claude's match reason
- "Neu" badge if from last scan
- Click → TenderDrawer

**Filters:**
- Status: Aktiv / Abgelaufen / Alle
- Urgency: Dringend / Bald / Alle
- Calendar week selector
- Free text search

**Empty state:** "Aktuell keine passenden Ausschreibungen. Nächster Scan: [date]"

### 3c. Tender Drawer (Slide-Over Panel)

Slides in from the right when clicking any tender, anywhere on the site.

Contents:
- Full title
- Authority
- Deadline with countdown ("noch X Tage")
- Category
- URL → "Auf hamburg.de öffnen" button (opens new tab)
- All matched companies (with relevance badges)
- Claude's match reasoning (full text)
- "PDF exportieren" button (single tender)
- "Schließen" button or click outside to dismiss

Width: 420px desktop, full-screen overlay on mobile.

### 3d. All Tenders — `/alle`

Full table of every scraped tender.

- Sortable columns: Title, Auftraggeber, Frist, Gewerk, Status
- Matched rows: colored left border in company color
- Multi-match rows: multiple company badges
- Unmatched rows: subdued (lighter text, no color)
- Filters: company, status, urgency, KW, search
- Pagination: 50 per page

### 3e. History — `/verlauf`

Timeline of all past scans.

- Each entry: date, KW, total count, matched count, new count
- Download button for global DOCX
- Per-company match counts for that scan
- Expandable rows: click to see which tenders were added
- Table or timeline layout

### 3f. PDF Export

**This is critical.** The PDF is what company leads use to actually apply for tenders.

**Per-Company PDF** (from company page or drawer → `/api/export/[slug]`):

Contents:
- **Header:** Company name, export date, "VOB Ausschreibungen — Übersicht für [Company]"
- **Per tender block:**
  - Full title
  - Auftraggeber
  - Abgabefrist — large, prominent, with urgency note ("DRINGEND: noch 3 Tage")
  - Gewerk / Kategorie
  - Relevanz + Claude's match reason
  - Direkt-Link to hamburg.de (as clickable URL text)
  - QR code for the hamburg.de link (works when printed)
- **Summary table at end:** total count, by urgency, next deadline
- **Footer:** "Generiert am [date] — VOB Monitor Gruppenwerk"

Implementation: API route generates PDF server-side using `jspdf` + `jspdf-autotable`. Returns as `Content-Disposition: attachment` download.

**Single-Tender PDF** (from drawer → `/api/export/tender/[id]`):
Same format, just one tender.

---

## Part 4: Design System

### Colors
```css
:root {
  --brand-primary: #1F4E79;
  --brand-dark: #163A5C;
  --brand-light: #D6E4F0;

  --urgent: #C62828;      /* ≤ 7 days */
  --soon: #F9A825;        /* 8-14 days */
  --normal: #2E7D32;      /* > 14 days */
  --expired: #9E9E9E;

  --bg-primary: #FFFFFF;
  --bg-secondary: #F8FAFC;
  --border: #E2E8F0;
  --text-primary: #1E293B;
  --text-secondary: #64748B;
  --text-muted: #94A3B8;
}
```

Company colors come from the `companies.color` DB column and are applied dynamically.

### Layout
- **Desktop:** 240px sidebar + main content (max-width 1200px)
- **Mobile:** Bottom tab nav or hamburger
- **Sidebar:** Gruppenwerk logo → "Übersicht" → "Alle Ausschreibungen" → divider → company list (with count badges) → divider → "Verlauf"

### Components
- Cards: rounded-lg, subtle shadow, white bg
- Badges: pill shape, color per urgency or company
- Tables: clean, minimal borders, alternating rows, hover
- Drawer: full-height right panel, overlay on mobile
- Charts: Recharts, brand colors, clean grid, tooltips

### German UI
All labels in German. Key terms:
- Übersicht, Alle Ausschreibungen, Verlauf
- PDF exportieren, Bericht herunterladen
- Aktiv, Abgelaufen, Dringend, Bald, Neu
- Woche, Monat, 4 Wochen
- Auftraggeber, Abgabefrist, Gewerk, Relevanz

---

## Part 5: Data Fetching

```typescript
// src/lib/queries.ts
import { supabase } from './supabase'

export async function getDashboardData() {
  const [
    { data: companies },
    { data: latestScan },
    { data: recentTenders },
    { data: trends }
  ] = await Promise.all([
    supabase.from('companies').select('*').eq('active', true).order('name'),
    supabase.from('vob_scans').select('*').order('scan_date', { ascending: false }).limit(1).single(),
    supabase.from('vob_dashboard').select('*').not('company_slug', 'is', null).order('created_at', { ascending: false }).limit(20),
    supabase.from('company_trends').select('*').order('year', { ascending: false }).order('calendar_week', { ascending: false }).limit(80)
  ])
  return { companies, latestScan, recentTenders, trends }
}

export async function getCompanyTenders(slug: string, status?: string) {
  let query = supabase
    .from('vob_dashboard')
    .select('*')
    .eq('company_slug', slug)
    .order('deadline_date', { ascending: true })

  if (status === 'active') query = query.eq('status', 'active')
  if (status === 'expired') query = query.eq('status', 'expired')

  return (await query).data
}

export async function getCompanyStats(slug: string) {
  const { data } = await supabase
    .from('company_weekly_stats')
    .select('*')
    .eq('company_slug', slug)
    .order('year', { ascending: false })
    .order('calendar_week', { ascending: false })
    .limit(52)
  return data
}
```

ISR on all pages: `export const revalidate = 300` (5 minutes).

---

## Part 6: Deploy

### Git
```bash
cd vob-monitor
git init && git add . && git commit -m "VOB Monitor v1"
git remote add origin https://github.com/YOUR_USER/vob-monitor.git
git push -u origin main
```

### Vercel
1. vercel.com → New Project → Import repo
2. Add env vars (Supabase URL + anon key)
3. Deploy — every `git push` auto-deploys after this

### Domain (optional)
`vob.gruppenwerk.de` in Vercel settings.

---

## Part 7: Testing Checklist

### Supabase
- [ ] Tables: `companies`, `vob_tenders`, `vob_matches`, `vob_scans`
- [ ] Views: `vob_dashboard`, `company_weekly_stats`, `company_trends`
- [ ] RLS: public read via anon key works
- [ ] Storage: `vob-reports` bucket with per-company folders
- [ ] Company seed data correct (8 companies)
- [ ] `expire_old_tenders()` function works

### Dashboard
- [ ] Loads with empty state
- [ ] 8 company cards render
- [ ] Trend chart renders (empty + with data)
- [ ] Trend toggle: Woche / Monat / 4 Wochen
- [ ] Stats bar correct
- [ ] Recent feed shows latest tenders

### Company Pages
- [ ] All 8 `/unternehmen/{slug}` pages load
- [ ] Urgency badges correct (red/yellow/green/grey)
- [ ] "Neu" badges on last-scan tenders
- [ ] Filters work (status, urgency, KW, search)
- [ ] Card ↔ table toggle
- [ ] Empty state correct
- [ ] TenderDrawer opens with full details

### All Tenders
- [ ] Table renders all tenders
- [ ] Sorting on all columns
- [ ] Matched rows colored, unmatched subdued
- [ ] Pagination works

### History
- [ ] Lists all past scans
- [ ] DOCX downloads work
- [ ] Per-company counts visible

### PDF Export
- [ ] Per-company PDF generates and downloads
- [ ] Contains: title, authority, deadline, link, QR code, relevance, reason
- [ ] Single-tender PDF works from drawer
- [ ] Prints cleanly

### Integration
- [ ] VOB skill run → data appears on site
- [ ] New tenders get "Neu" badge
- [ ] Expired tenders auto-transition
- [ ] DOCX download from Storage works

### Responsive
- [ ] Mobile layout on all pages
- [ ] Sidebar → mobile nav
- [ ] Drawer → full-screen on mobile
- [ ] Cards stack vertically

---

## Part 8: Company Reference

Source of truth is the `companies` table. For reference:

| Company | Slug | Core Trades |
|---------|------|------------|
| Seehafer Elemente | seehafer-elemente | Tischler, Fenster, Türen, Holzbau |
| Tischlerei Brink | tischlerei-brink | Tischler, Möbelbau, Innenausbau |
| Maler Hantke | maler-hantke | Maler, Fassade, Anstrich, WDVS |
| Werner Bau | werner-bau | Rohbau, GU, Hochbau |
| J. Werner Gerüstbau | werner-geruestbau | Gerüst, Gerüstbau |
| GroundPassion | groundpassion | Immobilienberatung, Asset Management, Investment Advisory |
| Mehlig GmbH | mehlig | Tischlerarbeiten, Innenausbau, Möbelbau, Objekteinrichtung |

---

## Notes

- **Matching is LLM-based.** Claude reads each tender and uses judgment. Keywords are fallback reference only.
- **DOCX report generator** (`generate_report.js`) stays in the skill. Uploaded to Supabase Storage.
- **Gmail draft** optional. Website replaces email for most users.
- **Apple Notes** dropped entirely. Website is the notification.
- **No auth on site** (yet). View-only, no sensitive data. Add Vercel password protection later if needed.
- **Supabase MCP** handles all writes. No API keys beyond Claude.ai config.
