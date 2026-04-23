# Seehafer Elemente — Claude Drive Workflow System

## Overview

This document defines the full workflow architecture for Claude-assisted employee tasks at Seehafer Elemente. Claude acts as the interface layer — employees trigger a workflow node, Claude reads context from Google Drive, performs the task, and writes the output back to Drive in the desired format.

---

## Connector Architecture

### Native Google Drive MCP (no Composio needed)

The native Drive connector handles all core operations:

| Operation | Tool | Notes |
|---|---|---|
| Read file content | `Google Drive: read_file_content` | Docs, Sheets, PDFs, DOCX |
| Read folder listing | `Google Drive: search_files` | Filter by `parentId` |
| Get file metadata | `Google Drive: get_file_metadata` | Name, ID, mimeType |
| Upload new file | `Google Drive: create_file` | base64 encoded content |
| Create folder | `Google Drive: create_file` | mimeType = `application/vnd.google-apps.folder` |
| Download binary | `Google Drive: download_file_content` | With `exportMimeType` for format conversion |

### Composio (only needed for these operations)

| Operation | Why Composio |
|---|---|
| Rename existing file | Native connector has no update/rename |
| Move file between folders | No move operation in native connector |
| Overwrite/update existing file | Native connector is create-only |

### Claude (claude.ai or Claude Code)

- Reads `_kontext` folder contents at session start
- Reads the target workflow folder (e.g. `angebote_aktiv/[Projekt]`)
- Performs the task (drafting, calculating, summarizing, formatting)
- Generates output in the requested format
- Uploads result to Drive via native connector

---

## Folder Structure

All folders live under the root: **`Seehafer Elemente/`**

```
Seehafer Elemente/
│
├── 01_angebote/
│   ├── angebote_aktiv/
│   │   └── [JAHR_Kunde_Projekt]/         ← one subfolder per deal
│   │       ├── angebot_entwurf.docx
│   │       ├── kalkulation.sheet
│   │       └── korrespondenz/
│   ├── angebote_eingereicht/
│   ├── angebote_archiv/
│   └── angebote_vorlage.docx             ← template
│
├── 02_ausschreibungen/
│   ├── ausschreibungen_eingehend/
│   │   └── [LV-Ref_Bezeichnung]/        ← one subfolder per LV
│   │       ├── lv_original.pdf
│   │       └── kalkulation_entwurf.docx
│   ├── ausschreibungen_bearbeitung/
│   └── ausschreibungen_eingereicht/
│
├── 03_rechnungen/
│   ├── rechnungen_vorlage.docx          ← template
│   ├── rechnungen_offen/
│   ├── rechnungen_bezahlt/
│   └── rechnungen_mahnwesen/
│
├── 04_lieferanten/
│   ├── lieferanten_stammdaten/
│   │   └── [Lieferant_Name].docx        ← contacts, pricing, lead times, notes
│   ├── lieferanten_eingangsrechnungen/
│   └── lieferanten_vertraege/
│
├── 05_leads/
│   └── leads_seehafer.sheet             ← Google Sheet (replaces Airtable)
│
└── _kontext/                           ← always injected · keep under 5k tokens
    ├── briefpapier/
    │   └── briefpapier_seehafer.docx   ← letterhead template
    ├── preislisten/
    │   └── preisliste_aktuell.sheet     ← current pricing
    ├── firmeninfo.docx                   ← company description, certifications, USPs
    └── ansprechpartner.docx             ← team, roles, contact details
```

### File Naming Conventions

| Type | Pattern | Example |
|---|---|---|
| Deal subfolder | `YYR�_Kunde_Kurzbezeichnung` | `2025_MeyerBau_Fenster-EG` |
| LV subfolder | `YYYY-NNN_Auftraggeber_Gewerk` | `2025-041_SBH-Barmbek_Fenster` |
| Outgoing invoice | `RE-YYYY-NNN_Kunde.docx` | `RE-2025-041_MeyerBau.docx` |
| Lieferant stammdaten | `[Lieferant_Name].docx` | `Schüco_GmbH.docx` |

---

## _kontext Folder — What Goes In

Claude loads the full `_kontext` folder at the start of every workflow session. Keep total size under **5,000 tokens** (~3,000 words / 4 A4 pages combined).

### `briefpapier/briefpapier_seehafer.docx`
- Letterhead layout reference (header, footer, logo placement, address block)
- Used when generating any client-facing document (Angebote, Rechnungen, Mahnungen)

### `preislisten/preisliste_aktuell.sheet`
- Current Einheitspreise (EP) per LeistungsPosition
- Material + Lohn split if applicable
- Used for Kakkulation in Angebote and Ausschreibungen

### `firmeninfo.docx`
- Company name, legal form, HRB, USt-IdNr, bank details (IBAN/BIC)
- Key certifications (RAL, Schüco Partner, etc.)
- Standard Leistungsbeschreibung snippets (reusable blocks)

### `ansprechpartner.docx`
- Team roster: name, role, phone, email
- Zuständigkeiten (who handles what)
- Used for signing blocks on documents

---

## Workflow Nodes

Each workflow node below maps to a trigger in your automation UI. The employee clicks the node, fills in any parameters, and Claude executes.

---

### Node 1 — Angebot erstellen

**Trigger:** Employee selects a project folder from `angebote_aktiv/`

**Claude reads:**
- `_kontext/` (all 4 files)
- `angebote_aktiv/[Projekt]/` (existing drafts, correspondence)
- `angebote_vorlage.docx`

**Claude does:**
- Drafts or updates the Angebot document
- Applies Briefpapier layout
- Pulls pricing from Preisliste
- Fills signing block from Ansprechpartner

**Output options (employee chooses):**
- `→ DOCX` upload to `angebote_aktiv/[Projekt]/angebot_entwurf.docx`
- `→ PDF` upload to same folder (export via Drive `download_file_content` with exportMimeType=pdf)
- `→ Google Doc` create native Doc in folder

**Connector path:**
```
Claude → Drive: read(_kontext) → Drive: read(projekt_folder) → Claude generates → Drive: create_file(output)
```

---

### Node 2 — Ausschreibung kalkulieren

**Trigger:** Employee selects an LV subfolder from `ausschreibungen_eingehend/` or `ausschreibungen_bearbeitung/`

**Claude reads:**
- `_kontext/` (all 4 files)
- `[LV-Ref]/lv_original.pdf` (the tender document)

**Claude does:**
- Parses LV positions from the PDF
- Maps positions to Preisliste EPs
- Flags positions with no EP match (manual input needed)
- Generates Kakkulation sheet + Angebotssumme

**Output options:**
- `→ XLSX` Kalkulation spreadsheet
- `→ Google Sheet` native Sheet in LV folder
- `→ DOCX` formatted Kakkulationsübersicht

**Connector path:**
```
Claude → Drive: read(_kontext) → Drive: download_file_content(lv_pdf) → Claude kalkuliert → Drive: create_file(output)
```

---

### Node 3 └ Rechnung erstellen

**Trigger:** Employee provides Auftragsnummer + Leistungsdaten

**Claude reads:**
- `_kontext/` (all 4 files)
- `rechnungen_vorlage.docx`
- (optional) `angebote_archiv/[Projekt]/` for reference pricing

**Claude does:**
- Generates invoice with correct RE-Nummer (sequential)
- Applies Briefpapier + IBAN/BIC from Firmeninfo
- Calculates MwSt, Gesamtbetrag, Zahlungsziel

**Output options:**
- `→ DOCX` → saved to `rechnungen_offen/`
- `→ PDF` → saved to `rechnungen_offen/`

**RE-Nummer logic:** Claude reads `rechnungen_offen/` + `rechnungen_bezahlt/` filenames, finds highest RE-VYYR�MN, increments by 1.

**Connector path:**
```
Claude → Drive: read(_kontext) → Drive: search_files(rechnungen_offen) → Claude generates → Drive: create_file(RE-YYYY-NNN_Kunde.pdf)
```

---

### Node 4 └ Lieferanten-Interaktion

**Trigger:** Employee selects a supplier from `lieferanten_stammdaten/`

**Claude reads:**
- `_kontext/firmeninfo.docx`
- `lieferanten_stammdaten/[Lieferant_Name].docx`
- (optional) `lieferanten_vertraege/[Lieferant]/` for contract terms

**Claude does:**
- Drafts order, inquiry, complaint, or negotiation email/letter
- Applies Briefpapier header
- References correct contact persons from both files

**Output options:**
- `→ DOCX` formal letter → saved to Drive
- `→ Gmail draft` (via Gmail MCP) ready to send
- `→ plain text` for copy-paste

**Connector path:**
```
Claude → Drive: read(lieferant_stammdaten) → Claude drafts → Drive: create_file(brief.docx) OR Gmail: create_draft
```

---

### Node 5 — B2B Leads

**Trigger:** Employee opens Leads workflow

**Claude reads:**
- `05_leads/leads_seehafer.sheet`

**Claude does:**
- Filters leads by Status, Persona, or city
- Drafts outreach email per lead
- Updates Status column after action

**Output options:**
- `→ Gmail drafts` bulk per lead (Gmail MCP)
- `→ XLSX` filtered export
- `→ updated Sheet` status written back (Composio proxy PATCH only)

**Connector path:**
```
Claude → Drive: read(leads_seehafer.sheet) → Claude filters + drafts → Gmail: create_draft (per lead)
                                                                      → Composio: proxy_execute PATCH (status update)
```

---

## Output Format Reference

| Format | MimeType | How Generated |
|---|---|---|
| PDF | `application/pdf` | Claude generates DOCX → Drive exports via `download_file_content(exportMimeType=application/pdf)` |
| DOCX | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | Generated via `python-docx`, uploaded base64 |
| XLSX | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | Generated via `openpyxl`, uploaded base64 |
| Google Doc | `application/vnd.google-apps.document` | `create_file` with text/plain → auto-converts |
| Google Sheet | `application/vnd.google-apps.spreadsheet` | `create_file` with text/csv → auto-converts |
| Gmail draft | n/a | Gmail MCP: `Gmail: create_draft` |

---

## Session Prompt Template

```
You are an AI assistant for Seehafer Elemente, a Hamburg-based windows and doors company.

Before doing anything else:
1. Read all files in the `_kontext/` folder (briefpapier, preisliste, firmeninfo, ansprechpartner)
2. Read the relevant workflow folder specified below
3. Perform the task
4. Upload output to the specified Drive folder in the requested format

Always:
- Apply Briefpapier layout to all client-facing documents
- Use pricing from Preisliste — flag positions without a match
- Use IBAN, USt-IdNr, and contact details from Firmeninfo/Ansprechpartner
- Name output files per naming conventions above

Never:
- Invent pricing not in the Preisliste
- Use generic placeholders -- always resolve from context files
- Overwrite existing files -- always create new with correct naming

Workflow: [NODE_NAME]
Target folder: [FOLDER_PATH]
Output format: [DOCX / PDF / XLSX / Google Doc / Google Sheet / Gmail draft]
```

---

## Composio vs Native Drive MCP -- Decision Table

| Task | Native Drive MCP | Composio |
|---|---|---|
| Read any file | ✅ `read_file_content` | -- |
| Upload new file / output | ✅ `create_file` | -- |
| Create folder | ✅ `create_file` (folder mimeType) | -- |
| Search folder contents | ✅ `search_files` | -- |
| Download as PDF/DOCX | ✅ `download_file_content` | -- |
| Rename existing file | -- | ✅ `proxy_execute PATCH` |
| Move file to new folder | -- | ✅ `proxy_execute PATCH` |
| Update Sheet cell values | -- | ✅ `proxy_execute PUT` |
| Delete file | -- | ✅ `proxy_execute DELETE` |

---

## Implementation Notes for Claude Code

1. **Always resolve `_kontext` first** before touching any workflow folder. Load all files in parallel where possible.

2. **Use Drive folder IDs, not names** -- maintain a FOLDER_IDS constants dictionary in your implementation.

3. **Output files must be base64-encoded** for upload via native connector:
```python
import base64
with open("output.docx", "rb") as f:
    encoded = base64.b64encode(f.read()).decode("utf-8")
```

4. **PDF export flow**: Upload as Google Doc first --> then export via `download_file_content(exportMimeType="application/pdf")` --> re-upload as PDF.

5. **RE-Nummer logic**: Always scan both `rechnungen_offen/` and `rechnungen_bezahlt/` filenames to find the highest RE-VYY]-NNN before creating a new invoice.
