# vob-auto: VOB Ausschreibungen scrapen, matchen und in Werkbank importieren

Dieses Skill scrapet ALLE aktuellen Bauleistungs-Ausschreibungen von hamburg.de via Firecrawl,
matcht sie automatisch zu den Gruppenwerk-Unternehmen, importiert sie in die Werkbank-Datenbank
und lädt einen Bericht in Supabase Storage hoch.

**Quelle:** https://www.hamburg.de/politik-und-verwaltung/ausschreibungen/bauleistungen-vob

---

## Schritt 1 – Umgebungsvariablen lesen

Lese die Datei `.env.local` im Projektstamm und extrahiere folgende Werte:

| Variable | Verwendung |
|---|---|
| `FIRECRAWL_API_KEY` | Firecrawl API-Authentifizierung |
| `VOB_IMPORT_SECRET` | Auth für `/api/vob/import` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase-Projekt-URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Storage + REST-Schreibzugriff |
| `WERKBANK_URL` | Werkbank-App-URL (Fallback: `http://localhost:3000`) |

**Abbruchbedingungen:**
- Fehlt `FIRECRAWL_API_KEY` → Abbruch: "FIRECRAWL_API_KEY fehlt in .env.local"
- Fehlt `VOB_IMPORT_SECRET` → Abbruch: "VOB_IMPORT_SECRET fehlt in .env.local"
- Fehlt `SUPABASE_SERVICE_ROLE_KEY` → Abbruch: "SUPABASE_SERVICE_ROLE_KEY fehlt in .env.local"

---

## Schritt 2 – Alle Ausschreibungsseiten scrapen

Hamburg.de zeigt 45 Ausschreibungen über 5 Seiten (10 pro Seite).
Scrape alle 5 Seiten nacheinander via Firecrawl:

```
POST https://api.firecrawl.dev/v1/scrape
Authorization: Bearer <FIRECRAWL_API_KEY>
Content-Type: application/json

{
  "url": "<SEITEN_URL>",
  "formats": ["markdown", "links"],
  "onlyMainContent": true
}
```

**Seiten-URLs zum Scrapen (alle 5 probieren):**
- `https://www.hamburg.de/politik-und-verwaltung/ausschreibungen/bauleistungen-vob`
- Für Seite 2–5: extrahiere Pagination-Links aus dem Markdown der ersten Seite.
  Suche nach Links die auf `bauleistungen-vob` zeigen und Seiten-Parameter enthalten
  (typisch: `?page=2`, `?seite=2`, `/seite-2`, `#seite-2`).
  Falls keine expliziten Pagination-Links gefunden: versuche diese Muster sequentiell:
  - `?page=2` bis `?page=5`
  - `?seite=2` bis `?seite=5`
  - Stoppe bei 404 / leerem Ergebnis.

**Rate-Limiting:** Warte 1 Sekunde zwischen den Requests. Bei HTTP 429: 15 Sekunden warten, erneut versuchen (max. 2 Mal).

Sammle alle gescrapten Seiten-Inhalte in einer Liste.

---

## Schritt 3 – Ausschreibungs-Links extrahieren

Aus den gescrapten Listing-Seiten: extrahiere alle Links die auf individuelle Ausschreibungsseiten zeigen.

**Muster für gültige Ausschreibungs-URLs:**
- Enthält `/bauleistungen-vob/` gefolgt von einem Slug (nicht die Übersichtsseite selbst)
- Beispiel: `https://www.hamburg.de/politik-und-verwaltung/ausschreibungen/bauleistungen-vob/grasweg-72-76-erweiterter-rohbau-1154494`

Relative URLs zu absoluten vervollständigen: `https://www.hamburg.de` + relativer Pfad.

**Dedupliziere nach URL.** Ziel: ~45 eindeutige Ausschreibungs-URLs.

---

## Schritt 4 – Jede Ausschreibung einzeln scrapen

Für jeden extrahierten Link (aus Schritt 3):

```
POST https://api.firecrawl.dev/v1/scrape
Authorization: Bearer <FIRECRAWL_API_KEY>
Content-Type: application/json

{
  "url": "<AUSSCHREIBUNGS_URL>",
  "formats": ["markdown"],
  "onlyMainContent": true
}
```

Warte 0,5 Sekunden zwischen Requests. Bei 429: 15 Sekunden warten, max. 2 Wiederholungen.

---

## Schritt 5 – Strukturierte Daten extrahieren

Analysiere das Markdown jeder gescrapten Ausschreibungsseite und extrahiere:

```
{
  title:         string        // Offizieller Titel, max. 200 Zeichen
  authority:     string|null   // Ausschreibende Stelle / Vergabestelle
  category:      string|null   // Leistungsbereich / Gewerk (z.B. "Rohbauarbeiten", "Tischlerarbeiten")
  deadline:      string|null   // Abgabefrist als lesbarer Text (z.B. "21.04.2026, 10:00 Uhr")
  deadline_date: string|null   // Nur das Datum als ISO-String "YYYY-MM-DD", null wenn unklar
  url:           string        // Original hamburg.de URL
}
```

**Extraktionsregeln:**
- `category`: Suche nach Feldern wie "Leistungsbereich", "Art der Leistung", "Vergabegegenstand".
  Häufige Werte: Rohbauarbeiten, Tischlerarbeiten, Malerarbeiten, Gerüstbauarbeiten,
  Fenster- und Türenarbeiten, Metallbau, Bodenbelag, Elektroarbeiten, etc.
- `deadline_date`: Konvertiere "21.04.2026" → "2026-04-21". Ignoriere Uhrzeiten.
- Überspringe Einträge ohne `title` oder `url`.

---

## Schritt 6 – Scan-Metadaten berechnen

```
scan_date:      heutiges Datum als "YYYY-MM-DD"
calendar_week:  aktuelle ISO-8601 Kalenderwoche (1–53)
year:           aktuelles Jahr
total_listings: Anzahl der eindeutigen URLs aus Schritt 3
new_listings:   Anzahl der erfolgreich extrahierten Ausschreibungen aus Schritt 5
```

---

## Schritt 7 – In Werkbank importieren

```
POST <WERKBANK_URL>/api/vob/import
x-import-secret: <VOB_IMPORT_SECRET>
Content-Type: application/json

{
  "scan": {
    "scan_date": "...",
    "calendar_week": ...,
    "year": ...,
    "total_listings": ...,
    "new_listings": ...
  },
  "tenders": [ ...alle extrahierten Ausschreibungen... ]
}
```

Speichere aus der Response: `scan_id`, `tenders_inserted`, `matches_inserted`, die `errors`-Liste.

**Fehlerbehandlung:**
- HTTP 401 → "VOB_IMPORT_SECRET stimmt nicht. Env-Variable prüfen."
- HTTP 500 → Vollständige Fehlerantwort ausgeben, Abbruch.

---

## Schritt 8 – Bericht generieren und in Supabase Storage hochladen

### 8a – Berichtsinhalt erstellen

Generiere einen Bericht mit folgendem Format (als Markdown-String):

```
# VOB-Scan Bericht – KW<calendar_week>/<year>

**Datum:** <scan_date>
**Quelle:** hamburg.de/bauleistungen-vob
**Gesamt gefunden:** <total_listings>
**Importiert:** <tenders_inserted>
**Matches (Unternehmens-Zuordnungen):** <matches_inserted>

---

## Ausschreibungen nach Unternehmen

### Tischlerei Brink
<Liste der gematchten Ausschreibungen mit Titel, Vergabestelle, Frist>

### Malerei Hantke
<...>

### Seehafer Elemente
<...>

### Werner Bau
<...>

### Werner Gerüstbau
<...>

### Tischlerei Mehlig
<...>

---

## Alle Ausschreibungen

| Titel | Vergabestelle | Kategorie | Frist | URL |
|-------|---------------|-----------|-------|-----|
<eine Zeile je Ausschreibung>

---

*Erstellt: <scan_date> | Werkbank VOB-Auto*
```

Fülle die Unternehmens-Abschnitte basierend auf den `errors`-Feldern und
dem allgemeinen Wissen über welche Tenders zu welchen Companies gematcht wurden.
Wenn du die Match-Zuordnungen nicht explizit aus der API-Response kennst,
liste alle importierten Ausschreibungen mit ihren Kategorien auf.

### 8b – Dateinamen berechnen

```
filename: vob-bericht-<scan_date>.md
```

### 8c – In Supabase Storage hochladen

```
POST <NEXT_PUBLIC_SUPABASE_URL>/storage/v1/object/documents/vob-reports/<filename>
Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
Content-Type: text/markdown; charset=utf-8
x-upsert: true

<Berichtsinhalt>
```

Bei Erfolg (HTTP 200/201): Berechne die öffentliche URL:
```
report_url = <NEXT_PUBLIC_SUPABASE_URL>/storage/v1/object/public/documents/vob-reports/<filename>
```

Bei Fehler (z.B. Bucket nicht vorhanden): Warnung ausgeben, aber Scan bleibt gültig.

### 8d – Scan mit report_url aktualisieren

```
PATCH <WERKBANK_URL>/api/vob/scans/<scan_id>
x-import-secret: <VOB_IMPORT_SECRET>
Content-Type: application/json

{ "report_url": "<report_url>" }
```

---

## Schritt 9 – Zusammenfassung ausgeben

```
╔══════════════════════════════════════════════╗
║  VOB-Scan abgeschlossen  ✓                   ║
╠══════════════════════════════════════════════╣
║  Quelle:       hamburg.de (5 Seiten)         ║
║  Gefunden:     X Ausschreibungen             ║
║  Importiert:   X  |  Übersprungen: X         ║
║  Matches:      X Unternehmens-Zuordnungen    ║
║  Bericht:      <report_url oder "nicht hochgeladen"> ║
╠══════════════════════════════════════════════╣
║  Unternehmen                                 ║
║  Tischlerei Brink      → X Ausschreibungen   ║
║  Malerei Hantke        → X Ausschreibungen   ║
║  Werner Bau            → X Ausschreibungen   ║
║  Werner Gerüstbau      → X Ausschreibungen   ║
║  Seehafer Elemente     → X Ausschreibungen   ║
║  Tischlerei Mehlig     → X Ausschreibungen   ║
╚══════════════════════════════════════════════╝
```

Falls es Fehler gab: darunter als Liste ausgeben.
