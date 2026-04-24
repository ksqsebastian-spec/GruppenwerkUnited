-- Seed: Seehafer Elemente – vollständiger Automatisierungs-Workflow-Baum
-- Jeder Knoten hat den korrekten app_type → richtiges Logo + Farbe im Canvas.
-- Kategorie-Knoten (prompt_template = NULL) = Ordner-Ebene
-- Blatt-Knoten (prompt_template befüllt) = kopierbarer Claude-Prompt mit Composio-Hinweisen

DO $$
DECLARE
  v_co TEXT := 'seehafer';

  -- Wurzel-Knoten (Hauptbereiche)
  v_angebote         UUID := gen_random_uuid();
  v_ausschreibungen  UUID := gen_random_uuid();
  v_rechnungen       UUID := gen_random_uuid();
  v_lieferanten      UUID := gen_random_uuid();
  v_leads            UUID := gen_random_uuid();
  v_kontext          UUID := gen_random_uuid();

  -- Kinder: Angebote
  v_angebote_aktiv        UUID := gen_random_uuid();
  v_angebote_eingereicht  UUID := gen_random_uuid();
  v_angebote_archiv       UUID := gen_random_uuid();
  v_angebot_erstellen     UUID := gen_random_uuid();

  -- Kinder: Ausschreibungen
  v_ausschr_eingehend    UUID := gen_random_uuid();
  v_ausschr_bearbeitung  UUID := gen_random_uuid();
  v_ausschr_eingereicht  UUID := gen_random_uuid();
  v_ausschr_kalkulieren  UUID := gen_random_uuid();

  -- Kinder: Rechnungen
  v_re_offen      UUID := gen_random_uuid();
  v_re_bezahlt    UUID := gen_random_uuid();
  v_re_mahnung    UUID := gen_random_uuid();
  v_re_erstellen  UUID := gen_random_uuid();

  -- Kinder: Lieferanten
  v_lief_stamm          UUID := gen_random_uuid();
  v_lief_eingangsre     UUID := gen_random_uuid();
  v_lief_vertraege      UUID := gen_random_uuid();
  v_lief_kontaktieren   UUID := gen_random_uuid();

  -- Kinder: Leads
  v_leads_bearbeiten  UUID := gen_random_uuid();
  v_leads_gmail       UUID := gen_random_uuid();

  -- Kinder: _kontext
  v_kx_briefpapier     UUID := gen_random_uuid();
  v_kx_preislisten     UUID := gen_random_uuid();
  v_kx_firmeninfo      UUID := gen_random_uuid();
  v_kx_ansprechpartner UUID := gen_random_uuid();

BEGIN

  -- ============================================================
  -- WURZEL-KNOTEN (parent_id = NULL)
  -- ============================================================
  INSERT INTO automation_nodes
    (id, company, parent_id, title, description, app_type, position)
  VALUES
    (v_angebote,        v_co, NULL, '01 · Angebote',        'Angebotsprozess von Entwurf bis Archiv', 'gdrive', 0),
    (v_ausschreibungen, v_co, NULL, '02 · Ausschreibungen', 'LV-Bearbeitung und Kalkulation',         'gdrive', 1),
    (v_rechnungen,      v_co, NULL, '03 · Rechnungen',      'Ausgangsrechnungen und Mahnwesen',       'pdf',    2),
    (v_lieferanten,     v_co, NULL, '04 · Lieferanten',     'Stammdaten, Eingangsrechnungen, Verträge','gdrive', 3),
    (v_leads,           v_co, NULL, '05 · B2B Leads',       'Lead-Verwaltung und Outreach per Gmail', 'sheets', 4),
    (v_kontext,         v_co, NULL, '_kontext',              'Immer geladene Basisdateien: Briefpapier, Preisliste, Firmeninfo, Ansprechpartner', 'gdrive', 5);

  -- ============================================================
  -- 01 · ANGEBOTE
  -- ============================================================
  INSERT INTO automation_nodes
    (id, company, parent_id, title, description, app_type, gdrive_path, prompt_template, position)
  VALUES
    (v_angebote_aktiv, v_co, v_angebote,
     'angebote_aktiv', 'Laufende Projekte – ein Unterordner pro Deal',
     'gdrive', 'Seehafer Elemente/01_angebote/angebote_aktiv/', NULL, 0),

    (v_angebote_eingereicht, v_co, v_angebote,
     'angebote_eingereicht', 'Eingereichte Angebote – warten auf Entscheidung',
     'gdrive', 'Seehafer Elemente/01_angebote/angebote_eingereicht/', NULL, 1),

    (v_angebote_archiv, v_co, v_angebote,
     'angebote_archiv', 'Abgeschlossene, angenommene oder abgelehnte Angebote. Referenz für Preisfindung und ähnliche Projekte.',
     'gdrive', 'Seehafer Elemente/01_angebote/angebote_archiv/', NULL, 2),

    (v_angebot_erstellen, v_co, v_angebote,
     'Angebot erstellen', 'Claude liest Kontext + Projektordner und generiert das Angebotsdokument',
     'claude', 'Seehafer Elemente/01_angebote/angebote_aktiv/',
$$Du bist ein KI-Assistent für Seehafer Elemente, ein Hamburger Fenster- und Türen-Unternehmen.

VOR DEM START – lese alle _kontext-Dateien parallel via Google Drive (native Connector):
• _kontext/briefpapier/briefpapier_seehafer.docx  → Briefpapier-Layout (Header, Footer, Adressblock)
• _kontext/preislisten/preisliste_aktuell.sheet    → Einheitspreise (EP) je Leistungsposition
• _kontext/firmeninfo.docx                         → USt-IdNr, IBAN/BIC, Zertifizierungen, Leistungsbausteine
• _kontext/ansprechpartner.docx                    → Team, Rollen, Kontaktdaten, Unterschriften-Block

Dann lese den Projektordner (vom Nutzer angegeben):
• 01_angebote/angebote_aktiv/[JAHR_Kunde_Projekt]/
  – vorhandene Entwürfe, Korrespondenz, Kalkulationsblätter

ERSTELLE das Angebot:
1. Wende Briefpapier-Layout an (Firmenlogo oben rechts, Adressblock links, Footer mit IBAN)
2. Übernehme Preise exakt aus der Preisliste – markiere jede Position ohne EP-Treffer mit [EP FEHLT – bitte prüfen]
3. Trage IBAN, BIC, USt-IdNr und Ansprechpartner aus den Kontext-Dateien ein – keine Platzhalter
4. Dateiname: angebot_entwurf_v{N}.docx  (N = nächste Versionsnummer im Ordner)

HOCHLADEN via Google Drive (native Connector):
• DOCX  → Google Drive: create_file(name=..., mimeType=application/vnd.openxmlformats-officedocument.wordprocessingml.document, content=<base64>, parentId=PROJEKT_FOLDER_ID)
• PDF   → zuerst als Google Doc hochladen, dann: Google Drive: download_file_content(fileId=..., exportMimeType=application/pdf) → erneut create_file als PDF

VERSCHIEBEN nach "eingereicht" (nur via Composio, da native Connector kein Move kennt):
• Composio: proxy_execute PATCH /drive/v3/files/{fileId}?addParents={EINGEREICHT_FOLDER_ID}&removeParents={AKTIV_FOLDER_ID}

NIEMALS: Preise erfinden · Platzhalter stehenlassen · Bestehende Datei überschreiben (immer neue Version anlegen)$$, 3);

  -- ============================================================
  -- 02 · AUSSCHREIBUNGEN
  -- ============================================================
  INSERT INTO automation_nodes
    (id, company, parent_id, title, description, app_type, gdrive_path, prompt_template, position)
  VALUES
    (v_ausschr_eingehend, v_co, v_ausschreibungen,
     'ausschreibungen_eingehend', 'Neu eingegangene Leistungsverzeichnisse',
     'gdrive', 'Seehafer Elemente/02_ausschreibungen/ausschreibungen_eingehend/', NULL, 0),

    (v_ausschr_bearbeitung, v_co, v_ausschreibungen,
     'ausschreibungen_bearbeitung', 'LVs in aktiver Kalkulation',
     'gdrive', 'Seehafer Elemente/02_ausschreibungen/ausschreibungen_bearbeitung/', NULL, 1),

    (v_ausschr_eingereicht, v_co, v_ausschreibungen,
     'ausschreibungen_eingereicht', 'Fertig kalkulierte und eingereichte Angebote',
     'gdrive', 'Seehafer Elemente/02_ausschreibungen/ausschreibungen_eingereicht/', NULL, 2),

    (v_ausschr_kalkulieren, v_co, v_ausschreibungen,
     'Ausschreibung kalkulieren', 'Claude parst das LV-PDF und mappt Positionen auf die Preisliste',
     'claude', 'Seehafer Elemente/02_ausschreibungen/',
$$Du bist ein KI-Assistent für Seehafer Elemente.

VOR DEM START – lese alle _kontext-Dateien (insb. preisliste_aktuell.sheet).

Dann lese das LV-Dokument via Google Drive:
• Google Drive: download_file_content(fileId=LV_PDF_ID, exportMimeType=application/pdf)
  Pfad: 02_ausschreibungen/ausschreibungen_eingehend/[LV-Ref_Bezeichnung]/lv_original.pdf

KALKULATION:
1. Parse alle Leistungspositionen (OZ, Kurztext, Einheit, Menge) aus dem LV-PDF
2. Weise jeder Position den Einheitspreis (EP) aus der Preisliste zu
3. Berechne GP = EP × Menge; summiere zur Angebotssumme (netto)
4. Markiere Positionen ohne EP-Treffer explizit: [EP FEHLT – manuelle Eingabe nötig]
5. Füge Deckungsbeitrags-Zeile hinzu (Zuschlag-% aus firmeninfo.docx, falls vorhanden)

AUSGABE (Nutzer wählt Format):
• Google Sheet → Google Drive: create_file(mimeType=application/vnd.google-apps.spreadsheet, content=<CSV-base64>)
• XLSX         → erzeuge via openpyxl, base64-kodieren, create_file mit mimeType xlsx
• DOCX         → formatierte Kalkulations-Übersicht als Word-Dokument

Dateiname: kalkulation_{LV-Ref}_{Datum}.{ext}  → in denselben LV-Unterordner hochladen

IN BEARBEITUNG verschieben via Composio:
• Composio: proxy_execute PATCH /drive/v3/files/{fileId}?addParents={BEARBEITUNG_FOLDER_ID}&removeParents={EINGEHEND_FOLDER_ID}

NIEMALS: EPs erfinden. Fehlende Positionen immer explizit kennzeichnen.$$, 3);

  -- ============================================================
  -- 03 · RECHNUNGEN
  -- ============================================================
  INSERT INTO automation_nodes
    (id, company, parent_id, title, description, app_type, gdrive_path, prompt_template, position)
  VALUES
    (v_re_offen, v_co, v_rechnungen,
     'rechnungen_offen', 'Offene Ausgangsrechnungen – noch nicht bezahlt',
     'pdf', 'Seehafer Elemente/03_rechnungen/rechnungen_offen/', NULL, 0),

    (v_re_bezahlt, v_co, v_rechnungen,
     'rechnungen_bezahlt', 'Bezahlte Rechnungen – abgeschlossen',
     'pdf', 'Seehafer Elemente/03_rechnungen/rechnungen_bezahlt/', NULL, 1),

    (v_re_mahnung, v_co, v_rechnungen,
     'rechnungen_mahnwesen', 'Überfällige Rechnungen – Mahnstufen 1–3',
     'pdf', 'Seehafer Elemente/03_rechnungen/rechnungen_mahnwesen/', NULL, 2),

    (v_re_erstellen, v_co, v_rechnungen,
     'Rechnung erstellen', 'Claude ermittelt die nächste RE-Nummer und generiert die Rechnung',
     'claude', 'Seehafer Elemente/03_rechnungen/',
$$Du bist ein KI-Assistent für Seehafer Elemente.

VOR DEM START – lese alle _kontext-Dateien (insb. firmeninfo.docx für IBAN, USt-IdNr, Briefpapier).

RE-NUMMER ermitteln (immer zuerst!):
• Google Drive: search_files(query='name contains "RE-" and "{JAHR}"', parentId=OFFEN_FOLDER_ID)
• Google Drive: search_files(query='name contains "RE-" and "{JAHR}"', parentId=BEZAHLT_FOLDER_ID)
• Beide Ordner durchsuchen → höchste RE-YYYY-NNN finden → NNN + 1

RECHNUNG erstellen:
1. RE-Nummer: RE-{JAHR}-{NNN:03d}  (z.B. RE-2025-042)
2. Briefpapier-Layout mit Firmenlogo und vollständigem Adressblock
3. IBAN, BIC, USt-IdNr exakt aus firmeninfo.docx übernehmen
4. Leistungspositionen: EP × Menge = GP; Summe netto; + 19 % MwSt; Gesamtbetrag brutto
5. Zahlungsziel: Standardmäßig 14 Tage nach Rechnungsdatum (anpassbar)
6. Unterschrifts-Block: Namen + Rolle aus ansprechpartner.docx

HOCHLADEN in rechnungen_offen/ via Google Drive:
• DOCX → create_file(name=RE-{JAHR}-{NNN}_{Kunde}.docx, parentId=OFFEN_FOLDER_ID)
• PDF  → als Google Doc hochladen → download_file_content(exportMimeType=pdf) → create_file als PDF

NACH ZAHLUNGSEINGANG – verschieben via Composio:
• Composio: proxy_execute PATCH /drive/v3/files/{fileId}?addParents={BEZAHLT_FOLDER_ID}&removeParents={OFFEN_FOLDER_ID}

BEI ÜBERFÄLLIGKEIT – verschieben via Composio:
• Composio: proxy_execute PATCH /drive/v3/files/{fileId}?addParents={MAHNUNG_FOLDER_ID}&removeParents={OFFEN_FOLDER_ID}

NIEMALS: RE-Nummer doppelt vergeben. Immer beide Ordner prüfen, bevor eine neue Nummer vergeben wird.$$, 3);

  -- ============================================================
  -- 04 · LIEFERANTEN
  -- ============================================================
  INSERT INTO automation_nodes
    (id, company, parent_id, title, description, app_type, gdrive_path, prompt_template, position)
  VALUES
    (v_lief_stamm, v_co, v_lieferanten,
     'lieferanten_stammdaten', 'Kontaktdaten, Konditionen, Lieferzeiten, Notizen je Lieferant',
     'gdrive', 'Seehafer Elemente/04_lieferanten/lieferanten_stammdaten/', NULL, 0),

    (v_lief_eingangsre, v_co, v_lieferanten,
     'lieferanten_eingangsrechnungen', 'Eingehende Rechnungen von Lieferanten',
     'gdrive', 'Seehafer Elemente/04_lieferanten/lieferanten_eingangsrechnungen/', NULL, 1),

    (v_lief_vertraege, v_co, v_lieferanten,
     'lieferanten_vertraege', 'Rahmenverträge und Konditionen',
     'gdrive', 'Seehafer Elemente/04_lieferanten/lieferanten_vertraege/', NULL, 2),

    (v_lief_kontaktieren, v_co, v_lieferanten,
     'Lieferant kontaktieren', 'Brief oder Gmail-Entwurf auf Basis der Stammdaten erstellen',
     'email', 'Seehafer Elemente/04_lieferanten/',
$$Du bist ein KI-Assistent für Seehafer Elemente.

VOR DEM START – lese:
• _kontext/firmeninfo.docx              → Absender-Adresse, USt-IdNr, Briefpapier-Layout
• _kontext/ansprechpartner.docx         → wer unterschreibt / zuständig ist
• 04_lieferanten/lieferanten_stammdaten/{Lieferant_Name}.docx  → Kontaktperson, Adresse, Konditionen
• (optional) 04_lieferanten/lieferanten_vertraege/{Lieferant}/ → Vertragsbedingungen

Wähle die Kontaktform (Nutzer gibt vor):
A. Anfrage / Bestellung → formeller Brief mit vollständigem Briefpapier-Layout
B. Mängelrüge / Beschwerde → sachlicher, dokumentierter Brief mit Bezug auf Lieferschein/RE-Nr.
C. Preisverhandlung → Argumentation auf Basis bestehender Konditionen aus den Stammdaten

AUSGABE:
• Brief als DOCX → Google Drive: create_file() in 04_lieferanten/korrespondenz/{Lieferant}_{Datum}.docx
• Gmail-Entwurf  → Gmail MCP: Gmail.create_draft(to=<E-Mail aus Stammdaten>, subject=..., body=<Brieftext ohne Briefkopf>)

NIEMALS: Kontaktdaten erfinden – ausschließlich aus der Stammdatendatei verwenden.$$, 3);

  -- ============================================================
  -- 05 · B2B LEADS
  -- ============================================================
  INSERT INTO automation_nodes
    (id, company, parent_id, title, description, app_type, gdrive_path, prompt_template, position)
  VALUES
    (v_leads_bearbeiten, v_co, v_leads,
     'Leads filtern & Entwürfe erstellen', 'Claude filtert das Leads-Sheet und generiert personalisierte Gmail-Entwürfe',
     'claude', 'Seehafer Elemente/05_leads/',
$$Du bist ein KI-Assistent für Seehafer Elemente.

Lese die Leads-Tabelle via Google Drive:
• Google Drive: read_file_content(fileId=LEADS_SHEET_ID)
  Pfad: 05_leads/leads_seehafer.sheet

FILTERN (Nutzer gibt Kriterien vor):
• Status = "neu" oder "wieder aufnehmen"
• Persona (z.B. Bauleiter, Architekt, Generalunternehmer)
• PLZ-Gebiet / Stadt

FÜR JEDEN GEFILTERTEN LEAD:
1. Erstelle einen individualisierten Gmail-Entwurf via Gmail MCP:
   Gmail.create_draft(
     to      = <E-Mail aus Sheet>,
     subject = "Fenster & Türen für [Firma] – Seehafer Elemente stellt sich vor",
     body    = <personalisierter Text mit Firmenname, Ansprechpartner-Name und passendem USP aus firmeninfo.docx>
   )
2. Verweise nicht auf generische Floskeln – beziehe dich auf die Branche/Projektgröße des Leads

STATUS-UPDATE nach Entwurf-Erstellung via Composio:
• Composio: proxy_execute PUT /sheets/v4/spreadsheets/{spreadsheetId}/values/{range}
  body: { "values": [["Entwurf erstellt"]] }

Leads-Daten sind vertraulich – keine Namen oder Kontaktdaten außerhalb von Gmail-Entwürfen verwenden.$$, 0),

    (v_leads_gmail, v_co, v_leads,
     'Gmail-Entwürfe versenden', 'Entwürfe in Gmail prüfen und manuell absenden',
     'email', 'Seehafer Elemente/05_leads/', NULL, 1);

  -- ============================================================
  -- _KONTEXT-ORDNER (Basis-Dateien die bei jedem Workflow geladen werden)
  -- ============================================================
  INSERT INTO automation_nodes
    (id, company, parent_id, title, description, app_type, gdrive_path, position)
  VALUES
    (v_kx_briefpapier, v_co, v_kontext,
     'briefpapier', 'Briefpapier-Layout: Header, Footer, Logoposition, Adressblock',
     'word', 'Seehafer Elemente/_kontext/briefpapier/briefpapier_seehafer.docx', 0),

    (v_kx_preislisten, v_co, v_kontext,
     'preislisten', 'Aktuelle Einheitspreise (EP) je Leistungsposition – Basis für alle Kalkulationen',
     'sheets', 'Seehafer Elemente/_kontext/preislisten/preisliste_aktuell.sheet', 1),

    (v_kx_firmeninfo, v_co, v_kontext,
     'firmeninfo', 'Firmenname, HRB, USt-IdNr, IBAN/BIC, Zertifizierungen, Leistungsbausteine',
     'word', 'Seehafer Elemente/_kontext/firmeninfo.docx', 2),

    (v_kx_ansprechpartner, v_co, v_kontext,
     'ansprechpartner', 'Team, Rollen, Telefon, E-Mail, Zuständigkeiten – für Unterschrifts-Blöcke',
     'word', 'Seehafer Elemente/_kontext/ansprechpartner.docx', 3);

END $$;
