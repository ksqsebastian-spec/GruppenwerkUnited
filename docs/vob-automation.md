# VOB-Automatisierung – Systemdokumentation

Diese Datei beschreibt wie die VOB-Pipeline funktioniert: von der Supabase-Cron-Trigger-Kette
bis zur Anzeige im Werkbank-Dashboard. Als KI-Assistent nutze diese Datei als Referenz
wenn du mit dem VOB-Modul arbeitest.

---

## Überblick

Hamburg.de veröffentlicht wöchentlich neue Bauleistungs-Ausschreibungen (VOB).
Die Automatisierung scrapet diese, ordnet sie Gruppenwerk-Firmen zu und zeigt sie im Dashboard.

```
Supabase Cron Job
  → POST /api/vob/import (Firecrawl scrapet hamburg.de)
  → Ausschreibungen in DB schreiben
  → Automatisches Matching zu Firmen
  → Bericht in Supabase Storage hochladen
  → Dashboard zeigt neue Ausschreibungen
```

---

## Supabase Cron Job

Der Cron-Job wurde im Supabase Dashboard unter **Database → Cron Jobs** eingerichtet.

**Was er tut:** Sendet einen wöchentlichen HTTP-Request an den Import-Endpunkt,
der dann die Scraping-Pipeline anstößt (via Firecrawl).

**Zeitplan:** Wöchentlich (z.B. montags früh, vor Arbeitsbeginn).

**Achtung:** Der Cron-Job kann den Scraping-Schritt **nicht selbst ausführen** —
Firecrawl wird von der Werkbank-App (Next.js API-Route) aufgerufen, nicht von Supabase direkt.
Supabase triggert nur den Start der Pipeline durch einen HTTP-Call an `/api/vob/import`.

---

## Die Pipeline im Detail

### Schritt 1 — hamburg.de scrapen (Firecrawl)

Die API-Route `POST /api/vob/import` ruft intern Firecrawl auf:

- **Quelle:** `https://www.hamburg.de/politik-und-verwaltung/ausschreibungen/bauleistungen-vob`
- **Umfang:** 5 Seiten × ~10 Ausschreibungen = ~45 Einträge
- **Rate-Limit:** 1s zwischen Seiten, 0,5s zwischen Detailseiten
- **Bei 429:** 15s warten, max. 2 Wiederholungen

**Benötigte Env-Variable:** `FIRECRAWL_API_KEY`

### Schritt 2 — Strukturierte Daten extrahieren

Für jede Ausschreibungsseite werden extrahiert:

| Feld | Beschreibung |
|------|-------------|
| `title` | Offizieller Titel (max. 200 Zeichen) |
| `authority` | Ausschreibende Vergabestelle |
| `category` | Gewerk / Leistungsbereich (z.B. "Rohbauarbeiten") |
| `deadline` | Abgabefrist als lesbarer Text |
| `deadline_date` | ISO-Datum "YYYY-MM-DD" |
| `url` | Original hamburg.de Link |

### Schritt 3 — In Supabase schreiben

**Tabelle `vob.vob_scans`** — 1 Scan-Eintrag pro Ausführung:
```
scan_date, calendar_week, year, total_listings, new_listings
```

**Tabelle `vob.vob_tenders`** — 1 Eintrag pro Ausschreibung:
```
title, authority, category, deadline, deadline_date, url, status, scan_id
```

### Schritt 4 — Automatisches Firmen-Matching

Funktion: `suggestCompanies(category, title, companies)`
Datei: `lib/modules/vob/match-suggest.ts`

**Scoring-Modell:**

| Treffer | Punkte |
|---------|--------|
| Gewerk in `category` | +5 |
| Keyword in `category` | +3 |
| Gewerk in `title` | +2 |
| Keyword in `title` | +1 |

**Schwellenwert:** Score ≥ 2 → Match wird gespeichert in `vob.vob_matches`.

**Umlaut-Normalisierung:** ä→ae, ö→oe, ü→ue, ß→ss (Groß-/Kleinschreibung ignoriert).

**Firmen-Konfiguration** (in `vob.companies`):

| Firma | Gewerke | Keywords |
|-------|---------|----------|
| Tischlerei Brink | Tischlerarbeiten, Schreinerarbeiten, Fenster | Tischler, Schreiner, Fenster, Türen, Holz |
| Malerei Hantke | Malerarbeiten, Tapezierarbeiten, Bodenbelag | Maler, Anstrich, Farbe, Putz, Boden |
| Seehafer Elemente | Fenster- und Türenarbeiten, Glasarbeiten | Fenster, Türen, Glas, Fassade, Elemente |
| Werner Bau | Rohbauarbeiten, Erdarbeiten, Betonarbeiten | Rohbau, Beton, Erdarbeit, Mauerwerk |
| ... | | |

### Schritt 5 — Bericht in Supabase Storage

- **Bucket:** `documents`
- **Pfad:** `vob-reports/vob-bericht-<scan_date>.md`
- **Format:** Markdown — gruppiert nach Firma, dann Gesamttabelle aller Ausschreibungen

Danach wird `vob.vob_scans.report_url` mit dem Storage-Link aktualisiert.

---

## Datenbank-Struktur

**Schema:** `vob` (eigenes PostgreSQL-Schema, nicht `public`)

```
vob.companies       — Firmen-Konfiguration (Gewerke, Keywords)
vob.vob_scans       — Scan-Protokolle (1 pro Woche)
vob.vob_tenders     — Ausschreibungen
vob.vob_matches     — Zuordnungen Ausschreibung ↔ Firma
```

**Views (für Dashboard-Abfragen):**
```
vob_dashboard       — Ausschreibungen + Firma + Dringlichkeit (urgent/soon/normal/expired)
company_weekly_stats — Ausschreibungen pro Firma pro Woche
company_trends       — Vergleich Vorwoche / aktuelle Woche
```

**Dringlichkeits-Logik:**
- `urgent` — Frist ≤ 7 Tage
- `soon` — Frist ≤ 14 Tage
- `normal` — Frist > 14 Tage
- `expired` — Frist überschritten

---

## API-Endpunkte

| Endpunkt | Methode | Auth | Zweck |
|----------|---------|------|-------|
| `/api/vob/import` | POST | `x-import-secret` Header | Ausschreibungen importieren + matchen |
| `/api/vob/dashboard` | GET | — | Alle Dashboard-Daten |
| `/api/vob/tenders` | GET | — | Paginierte Ausschreibungsliste |
| `/api/vob/companies` | GET | — | Firmenliste |
| `/api/vob/scans` | GET | — | Scan-Verlauf |
| `/api/vob/scans/[id]` | PATCH | `x-import-secret` | Scan aktualisieren (report_url) |
| `/api/vob/stats` | GET | — | KPI-Zahlen |

**Auth:** `x-import-secret: <VOB_IMPORT_SECRET>` (Env-Variable)

---

## Manuellen Scan ausführen

Wenn du einen Scan manuell anstoßen musst (z.B. zum Testen oder Nachimportieren):

```
/vob-auto
```

Das Skill in `.claude/commands/vob-scan.md` führt die komplette Pipeline aus:
Scraping → Extraktion → Import → Bericht. Dauert ca. 3–5 Minuten.

**Voraussetzungen:**
- `.env.local` enthält `FIRECRAWL_API_KEY`, `VOB_IMPORT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`
- `WERKBANK_URL` zeigt auf die laufende App (Vercel-URL oder localhost:3000)

---

## Fehlerdiagnose

**"Keine neuen Ausschreibungen"**
→ hamburg.de hat diese Woche noch nicht aktualisiert, oder der Scan lief bereits.
→ Prüfe `vob.vob_scans` ob ein aktueller Eintrag existiert.

**Matching funktioniert nicht**
→ Prüfe `vob.companies` ob die Firma `active = true` hat.
→ Prüfe ob Gewerke/Keywords zum `category`-Feld der Ausschreibung passen.
→ Scoring-Schwellenwert ist 2 — bei Bedarf in `match-suggest.ts` anpassen.

**Import schlägt fehl**
→ HTTP 401: `VOB_IMPORT_SECRET` stimmt nicht.
→ HTTP 500: Prüfe Supabase-Logs, wahrscheinlich Schema-Problem.

**Bericht wird nicht hochgeladen**
→ Storage-Bucket `documents` muss existieren und öffentlich lesbar sein.
→ `SUPABASE_SERVICE_ROLE_KEY` muss Storage-Schreibrechte haben.

---

## Umgebungsvariablen (Übersicht)

| Variable | Wo gesetzt | Zweck |
|----------|-----------|-------|
| `FIRECRAWL_API_KEY` | Vercel + `.env.local` | Scraper-Auth |
| `VOB_IMPORT_SECRET` | Vercel + `.env.local` | Import-API absichern |
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + `.env.local` | Supabase-Projekt |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel + `.env.local` | DB + Storage Schreibzugriff |
| `WERKBANK_URL` | Vercel | App-URL für interne API-Calls |

---

## Wichtige Dateien

```
.claude/commands/vob-scan.md         Skill-Definition für manuellen Scan
app/api/vob/import/route.ts          Import-Endpunkt (Scraping + Matching + DB)
app/api/vob/dashboard/route.ts       Dashboard-Daten
lib/modules/vob/match-suggest.ts     Matching-Algorithmus
lib/modules/vob/queries.ts           Supabase-Abfragen
lib/modules/vob/types.ts             TypeScript-Typen
supabase/migrations/012_vob_schema.sql  Datenbankschema
app/(modules)/vob/page.tsx           Dashboard-UI
app/(modules)/vob/unternehmen/[slug]/page.tsx  Firmen-Detailseite
```
