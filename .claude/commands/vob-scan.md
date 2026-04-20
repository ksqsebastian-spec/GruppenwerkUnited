# VOB-Scan: Ausschreibungen crawlen, analysieren und in Werkbank importieren

Dieses Skill crawlt öffentliche Ausschreibungsportale via Firecrawl, analysiert die Ergebnisse mit Claude, matcht sie zu den Werkbank-Unternehmen und importiert sie in die VOB-Datenbank.

## Umgebungsvariablen (müssen in .env.local / Vercel gesetzt sein)

- `FIRECRAWL_API_KEY` – Firecrawl API-Key
- `VOB_IMPORT_SECRET` – Secret für POST /api/vob/import
- `NEXT_PUBLIC_SUPABASE_URL` – nur zur Prüfung ob App erreichbar ist
- `WERKBANK_URL` – z.B. `https://werkbank.gruppenwerk.de` (oder `http://localhost:3000` lokal)

---

## Deine Aufgabe

Führe die folgenden Schritte **in dieser Reihenfolge** aus. Lese zuerst alle Env-Variablen aus der `.env.local`-Datei (Pfad: `.env.local` im Projektstamm), damit du FIRECRAWL_API_KEY, VOB_IMPORT_SECRET und WERKBANK_URL kennst.

---

### Schritt 1 – Env-Variablen auslesen

Lese `.env.local` und extrahiere:
- `FIRECRAWL_API_KEY`
- `VOB_IMPORT_SECRET`
- `WERKBANK_URL` (Fallback: `http://localhost:3000`)

---

### Schritt 2 – Ausschreibungsportale crawlen

Crawle die folgenden Quellen nacheinander via Firecrawl Search API.

**Firecrawl Search-Endpunkt:**
```
POST https://api.firecrawl.dev/v1/search
Authorization: Bearer <FIRECRAWL_API_KEY>
Content-Type: application/json

{
  "query": "<Suchbegriff>",
  "limit": 20,
  "scrapeOptions": { "formats": ["markdown"] }
}
```

**Suchbegriffe (je ein Request):**

| Suchbegriff | Ziel |
|---|---|
| `"Tischlerarbeiten Ausschreibung Hamburg" site:dtvp.de OR site:evergabe.de OR site:vergabe24.de` | Tischler |
| `"Malerarbeiten Ausschreibung Hamburg" site:dtvp.de OR site:evergabe.de OR site:vergabe24.de` | Maler |
| `"Gerüstbau Ausschreibung Hamburg" site:dtvp.de OR site:evergabe.de OR site:vergabe24.de` | Gerüst |
| `"Rohbau Maurerarbeiten Ausschreibung Hamburg" site:dtvp.de OR site:evergabe.de` | Rohbau |
| `"Fenster Türen Ausschreibung Hamburg" site:dtvp.de OR site:evergabe.de OR site:vergabe24.de` | Fenster/Türen |
| `"Innenausbau Tischler Küche Ausschreibung Hamburg" site:dtvp.de OR site:evergabe.de` | Innenausbau |

Sammle alle Ergebnisse in einer Liste. Dedupliziere nach URL.

---

### Schritt 3 – Einzelne Ausschreibungen scrapen

Für jede gefundene URL aus Schritt 2, die noch nicht besucht wurde:

```
POST https://api.firecrawl.dev/v1/scrape
Authorization: Bearer <FIRECRAWL_API_KEY>
Content-Type: application/json

{
  "url": "<url>",
  "formats": ["markdown"],
  "onlyMainContent": true
}
```

Überspringe URLs die:
- Keine Ausschreibungsseite sind (z.B. Startseiten, Login-Seiten)
- Keine deutschen Bautexte enthalten

---

### Schritt 4 – Strukturierte Daten extrahieren

Analysiere den Markdown-Inhalt jeder gescrapten Seite und extrahiere für jede Ausschreibung:

```typescript
{
  title: string,           // Titel der Ausschreibung, z.B. "Tischlerarbeiten – Neubau Kita"
  authority: string|null,  // Ausschreibende Stelle, z.B. "Bezirksamt Hamburg-Nord"
  category: string|null,   // Gewerk/Leistungsbereich, z.B. "Tischlerarbeiten"
  deadline: string|null,   // Frist als lesbarer Text, z.B. "15.05.2026"
  deadline_date: string|null, // ISO-Datum der Frist, z.B. "2026-05-15" (null wenn unklar)
  url: string              // Original-URL der Ausschreibung
}
```

**Regeln für die Extraktion:**
- `title`: Nimm den offiziellen Titel. Kürze auf max. 200 Zeichen.
- `authority`: Die ausschreibende Behörde / das Amt / der Auftraggeber.
- `category`: Das Gewerk / die Leistungsart. Wenn mehrere, nehme das Hauptgewerk.
- `deadline_date`: Nur befüllen wenn ein klares Datum erkennbar ist (TT.MM.JJJJ oder ISO). Sonst null.
- Überspringe Ausschreibungen ohne erkennbaren Titel oder URL.
- Maximal 50 Ausschreibungen pro Scan.

---

### Schritt 5 – Scan-Metadaten berechnen

Berechne:
- `scan_date`: Heutiges Datum als ISO-String (`YYYY-MM-DD`)
- `calendar_week`: Aktuelle Kalenderwoche (ISO-8601)
- `year`: Aktuelles Jahr
- `total_listings`: Anzahl der gefundenen URLs nach Deduplizierung
- `new_listings`: Anzahl der erfolgreich extrahierten Ausschreibungen

---

### Schritt 6 – Import in Werkbank

Rufe den Import-Endpunkt auf:

```
POST <WERKBANK_URL>/api/vob/import
x-import-secret: <VOB_IMPORT_SECRET>
Content-Type: application/json

{
  "scan": {
    "scan_date": "<YYYY-MM-DD>",
    "calendar_week": <KW>,
    "year": <JAHR>,
    "total_listings": <N>,
    "new_listings": <N>
  },
  "tenders": [
    {
      "title": "...",
      "authority": "...",
      "category": "...",
      "deadline": "...",
      "deadline_date": "...",
      "url": "..."
    }
  ]
}
```

---

### Schritt 7 – Ergebnis ausgeben

Gib eine übersichtliche Zusammenfassung aus:

```
VOB-Scan abgeschlossen ✓

Portale gecrawlt:  6 Suchbegriffe
URLs gefunden:     X
Ausschreibungen:   X importiert, X übersprungen
Matches:           X Unternehmenszuordnungen

Unternehmen mit Treffern:
  Tischlerei Brink      → X Ausschreibungen
  Malerei Hantke        → X Ausschreibungen
  Werner Bau            → X Ausschreibungen
  Werner Gerüstbau      → X Ausschreibungen
  Seehafer Elemente     → X Ausschreibungen
  Tischlerei Mehlig     → X Ausschreibungen

Fehler: X (Details unten falls vorhanden)
```

---

## Fehlerbehandlung

- **FIRECRAWL_API_KEY fehlt:** Abbrechen mit: "FIRECRAWL_API_KEY ist nicht in .env.local gesetzt. Bitte eintragen und erneut ausführen."
- **VOB_IMPORT_SECRET fehlt:** Abbrechen mit: "VOB_IMPORT_SECRET ist nicht in .env.local gesetzt."
- **Firecrawl gibt 429 zurück:** 10 Sekunden warten, dann erneut versuchen (max. 2 Versuche).
- **Import-API gibt 401 zurück:** "VOB_IMPORT_SECRET stimmt nicht überein. Bitte Env-Variable prüfen."
- **Import-API gibt 500 zurück:** Vollständige Fehlerantwort ausgeben.
- **Keine Ausschreibungen gefunden:** Warnung ausgeben, aber keinen leeren Scan importieren.
