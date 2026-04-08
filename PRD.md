# PRD: Fuhrpark Management Web App

**Version:** 1.0  
**Datum:** 30. Januar 2025  
**Autor:** Axel (Gruppenwerk)  
**Status:** Final Draft

---

## Inhaltsverzeichnis

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Ziele & Erfolgskriterien](#3-ziele--erfolgskriterien)
4. [Nutzer & Personas](#4-nutzer--personas)
5. [Funktionale Anforderungen](#5-funktionale-anforderungen)
6. [Nicht-funktionale Anforderungen](#6-nicht-funktionale-anforderungen)
7. [Datenmodell](#7-datenmodell)
8. [Tech Stack](#8-tech-stack)
9. [Architektur](#9-architektur)
10. [UI/UX Spezifikation](#10-uiux-spezifikation)
11. [API-Design](#11-api-design)
12. [Security](#12-security)
13. [Testing](#13-testing)
14. [Deployment](#14-deployment)
15. [Projektstruktur](#15-projektstruktur)
16. [Anhang](#16-anhang)

---

## 1. Executive Summary

### 1.1 Projektziel

Entwicklung einer web-basierten Fuhrpark-Management-Anwendung als kostengünstiger Ersatz für Avrios. Die App verwaltet ~50 Firmenfahrzeuge über mehrere Gesellschaften der Gruppenwerk-Holding.

### 1.2 Kernprinzip

> **"Avrios-Ersatz für 5% des Preises und 20% der Features – aber diese 20% perfekt und idiotensicher."**

### 1.3 Scope-Übersicht

**IN SCOPE:**
- Fahrzeugverwaltung mit Stammdaten
- Fahrerverwaltung mit Fahrzeug-Zuordnung
- Dokumenten-Upload und -Verwaltung
- Termin-/Kalender-System für Prüfungen
- Schadensmanagement mit Foto-Upload
- Kostenerfassung und -übersicht
- Kilometerstand-Historie
- CSV-Import und -Export
- Webhook-Integration für n8n

**OUT OF SCOPE:**
- Fahrtenbuch/Arbeitszeiterfassung
- Führerscheinkontrolle (wird händisch gemacht)
- GPS-Tracking
- Tankkarten-Integration
- Komplexe Automatisierungen (→ n8n)
- Revisionssichere Buchführung
- Multi-Tenant/Mandantenfähigkeit mit Berechtigungen

### 1.4 Budget & Kosten

| Posten | Monatliche Kosten |
|--------|-------------------|
| Vercel Pro | $20 |
| Supabase Pro | $25 |
| Domain (jährlich) | ~€10/Jahr |
| **Gesamt** | **~$45-50/Monat** |

---

## 2. Problem Statement

### 2.1 Ausgangssituation

Die Gruppenwerk-Holding verwaltet aktuell ~50 Fahrzeuge über mehrere Gesellschaften (Werner Bau, Gerüstbau, Seehafer, Maler Hantke, Groundpassion, Networking). Die Fuhrparkverwaltung erfolgt zentral durch eine Verantwortliche.

### 2.2 Aktuelles Problem

Die bestehende Lösung (Avrios) ist funktional ausreichend, jedoch:
- **Zu teuer** für den tatsächlichen Nutzungsumfang
- **Zu komplex** – viele Features werden nicht benötigt
- Die Hauptnutzerin hat **geringe technische Affinität** (1/10)

### 2.3 Gewünschte Lösung

Eine maßgeschneiderte, einfache Web-App die:
- Nur die tatsächlich benötigten Features enthält
- Extrem einfach zu bedienen ist
- Deutlich günstiger als Avrios ist (~$50 vs. mehrere hundert Euro)
- Erweiterbar bleibt für zukünftige Anforderungen

---

## 3. Ziele & Erfolgskriterien

### 3.1 Primäre Ziele

| Priorität | Ziel | Messbar durch |
|-----------|------|---------------|
| 1 | Datenübersicht schaffen | Alle 50 Fahrzeuge mit vollständigen Daten erfasst |
| 2 | Nie wieder Termine verpassen | Null verpasste TÜV/Inspektionen nach Go-Live |
| 3 | Dokumente schnell finden | < 30 Sekunden bis zum gesuchten Dokument |
| 4 | Idiotensichere Bedienung | Nutzerin braucht keine Schulung |

### 3.2 Erfolgskriterien (6-Monats-Review)

- [ ] Alle Fahrzeuge im System erfasst
- [ ] Alle relevanten Dokumente hochgeladen
- [ ] Keine verpassten Prüfungstermine
- [ ] Nutzerin arbeitet selbstständig ohne Support
- [ ] Monatliche Kosten < €50

---

## 4. Nutzer & Personas

### 4.1 Primäre Nutzerin: Fuhrpark-Verantwortliche

| Attribut | Wert |
|----------|------|
| Rolle | Fuhrpark-Verantwortliche (zentral für alle Firmen) |
| Technische Affinität | 1/10 |
| Genutzte Tools | Excel (schleppend), Outlook |
| Arbeitsgerät | Desktop (primär) |
| Häufigkeit | Täglich, kurze Sessions |

**Bedürfnisse:**
- Klare, einfache Oberfläche
- Keine versteckten Funktionen
- Sofortige Rückmeldung bei Aktionen
- Deutsche Sprache durchgehend
- Große, gut lesbare Elemente

**Frustrationen:**
- Komplexe Software mit vielen Optionen
- Unklare Fehlermeldungen
- Daten die "verschwinden"
- Englische Fachbegriffe

### 4.2 Sekundäre Nutzer: Geschäftsführung

| Attribut | Wert |
|----------|------|
| Rolle | GF der Gruppenwerk-Gesellschaften |
| Zugriff | Bei Bedarf (selten) |
| Bedürfnis | Schnelle Übersicht, Export-Funktion |

**Nutzung:**
- Gelegentliche Einsicht in Gesamtübersicht
- CSV-Export für eigene Auswertungen
- Keine aktive Datenpflege

### 4.3 Authentifizierung

- **Ein geteilter Account** für alle Nutzer
- Starkes Passwort, geteilt mit allen Berechtigten
- Keine Rollen/Berechtigungsstufen nötig
- Session-Dauer: 7 Tage (verlängerbar auf 30)

---

## 5. Funktionale Anforderungen

### 5.1 Übersicht Module

```
┌─────────────────────────────────────────────────────────────┐
│                        FUHRPARK APP                         │
├─────────────┬─────────────┬─────────────┬──────────────────┤
│  Dashboard  │  Fahrzeuge  │   Fahrer    │     Termine      │
├─────────────┼─────────────┼─────────────┼──────────────────┤
│   Schäden   │   Kosten    │ Einstellungen│                 │
└─────────────┴─────────────┴─────────────┴──────────────────┘
```

---

### 5.2 Modul: Dashboard

**Zweck:** Zentrale Übersicht beim App-Start

**Inhalte:**

| Bereich | Beschreibung |
|---------|--------------|
| Warnungen | Überfällige Termine, TÜV < 30 Tage (rot/gelb) |
| Nächste Termine | Die kommenden 5-10 Termine chronologisch |
| Schnellzahlen | Anzahl Fahrzeuge, offene Schäden, Kosten diesen Monat |
| Schnellaktionen | Buttons: "Neues Fahrzeug", "Schaden melden", "Kosten erfassen" |

**Wireframe:**

```
┌─────────────────────────────────────────────────────────────┐
│ DASHBOARD                                                   │
├─────────────────────────────────────────────────────────────┤
│ ⚠️ WARNUNGEN (3)                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔴 HH-WB 123 – TÜV überfällig seit 5 Tagen              │ │
│ │ 🟡 HH-WB 456 – TÜV fällig in 12 Tagen                   │ │
│ │ 🟡 HH-GR 789 – Inspektion fällig in 20 Tagen            │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ 📅 NÄCHSTE TERMINE                                          │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 15.02. │ HH-WB 456  │ TÜV/HU        │ [Details]        │ │
│ │ 01.03. │ HH-GR 789  │ Inspektion    │ [Details]        │ │
│ │ 15.03. │ HH-MH 321  │ Versicherung  │ [Details]        │ │
│ └─────────────────────────────────────────────────────────┘ │
├───────────────┬───────────────┬─────────────────────────────┤
│ 🚗 Fahrzeuge  │ 🔧 Offene     │ 💰 Kosten                   │
│     52        │ Schäden: 3    │ Januar: €2.450              │
├───────────────┴───────────────┴─────────────────────────────┤
│ SCHNELLAKTIONEN                                             │
│ [+ Fahrzeug]  [+ Schaden melden]  [+ Kosten erfassen]       │
└─────────────────────────────────────────────────────────────┘
```

---

### 5.3 Modul: Fahrzeugverwaltung

**Zweck:** Zentrale Verwaltung aller Fahrzeug-Stammdaten

#### 5.3.1 Fahrzeug-Liste

**Funktionen:**
- Tabellarische Übersicht aller Fahrzeuge
- Sortierung nach jeder Spalte
- Filter nach: Firma, Status, Kraftstoffart
- Suchfeld für Kennzeichen/Marke/Modell
- Pagination bei vielen Einträgen

**Sichtbare Spalten:**

| Spalte | Beschreibung |
|--------|--------------|
| Kennzeichen | HH-WB 123 |
| Marke/Modell | Mercedes Sprinter |
| Firma | Werner Bau |
| Nächster Termin | TÜV: 15.06.2025 |
| Status | 🟢 Aktiv / 🔴 Archiviert |
| Aktionen | [Ansehen] [Bearbeiten] |

**Wireframe:**

```
┌─────────────────────────────────────────────────────────────┐
│ FAHRZEUGE                                    [+ Neu] [CSV]  │
├─────────────────────────────────────────────────────────────┤
│ 🔍 [Suche...        ]  Firma: [Alle ▾]  Status: [Alle ▾]   │
├─────────────────────────────────────────────────────────────┤
│ Kennzeichen │ Fahrzeug        │ Firma      │ TÜV      │     │
├─────────────┼─────────────────┼────────────┼──────────┼─────┤
│ HH-WB 123   │ Mercedes Sprinter│ Werner Bau │ 15.06.25│ [→] │
│ HH-WB 456   │ VW Transporter  │ Werner Bau │ 01.03.25│ [→] │
│ HH-GR 789   │ Ford Transit    │ Gerüstbau  │ 20.08.25│ [→] │
├─────────────────────────────────────────────────────────────┤
│ Zeige 1-20 von 52                        [<] 1 2 3 [>]      │
└─────────────────────────────────────────────────────────────┘
```

#### 5.3.2 Fahrzeug-Detail

**Zweck:** Alle Informationen zu einem Fahrzeug auf einer Seite

**Tabs/Bereiche:**

| Tab | Inhalt |
|-----|--------|
| Übersicht | Stammdaten, Status, Foto |
| Dokumente | Alle verknüpften Dokumente |
| Termine | Alle Termine dieses Fahrzeugs |
| Schäden | Schadenshistorie |
| Kosten | Kostenhistorie |
| Fahrer | Zugeordnete Fahrer |
| Kilometer | Kilometerstand-Verlauf |

**Wireframe Detail-Ansicht:**

```
┌─────────────────────────────────────────────────────────────┐
│ ← Zurück     FAHRZEUG: HH-WB 123            [Bearbeiten]    │
├─────────────────────────────────────────────────────────────┤
│ [Übersicht] [Dokumente] [Termine] [Schäden] [Kosten] [KM]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐   MERCEDES SPRINTER 316 CDI               │
│  │              │                                           │
│  │    [FOTO]    │   Firma:        Werner Bau                │
│  │              │   Baujahr:      2021                      │
│  └──────────────┘   Kraftstoff:   Diesel                    │
│                     Kilometerstand: 87.500 km               │
│                     Status:       🟢 Aktiv                  │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  DETAILS                                                    │
│  Fahrgestellnr:   WDB9066351S123456                        │
│  Anschaffung:     15.03.2021                               │
│  Kaufpreis:       €45.000                                  │
│  Leasing:         Ja                                        │
│  Versicherung:    Allianz (VS-123456789)                   │
│  TÜV fällig:      15.06.2025 (in 137 Tagen)                │
│                                                             │
│  FAHRER                                                     │
│  👤 Thomas Müller (Hauptfahrer)                             │
│  👤 Stefan Schmidt                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 5.3.3 Fahrzeug-Formular (Neu/Bearbeiten)

**Felder:**

| Feld | Typ | Pflicht | Validierung |
|------|-----|---------|-------------|
| Kennzeichen | Text | Ja | Format: XX-XX 1234 |
| Marke | Text | Ja | Min. 2 Zeichen |
| Modell | Text | Ja | Min. 2 Zeichen |
| Baujahr | Zahl | Ja | 1990-aktuelles Jahr |
| Fahrgestellnummer (VIN) | Text | Nein | 17 Zeichen wenn angegeben |
| Kraftstoffart | Dropdown | Ja | diesel, benzin, elektro, hybrid_benzin, hybrid_diesel, gas |
| Anschaffungsdatum | Datum | Nein | Nicht in Zukunft |
| Anschaffungspreis | Zahl | Nein | > 0 |
| Kilometerstand | Zahl | Ja | >= 0 |
| Leasing | Checkbox | Nein | - |
| Versicherungsnummer | Text | Nein | - |
| Versicherungsgesellschaft | Text | Nein | - |
| TÜV fällig | Datum | Nein | - |
| Firma | Dropdown | Ja | Aus Firmen-Liste |
| Status | Dropdown | Ja | aktiv, archiviert |
| Notizen | Textarea | Nein | Max. 2000 Zeichen |

**Auto-Save:** Formular speichert alle 10 Sekunden automatisch lokal (LocalStorage). Bei Browser-Absturz bleiben Daten erhalten.

---

### 5.4 Modul: Fahrerverwaltung

**Zweck:** Verwaltung aller Fahrer und Zuordnung zu Fahrzeugen

#### 5.4.1 Fahrer-Liste

Analog zu Fahrzeug-Liste mit Spalten:
- Name
- Firma
- Telefon
- Zugeordnete Fahrzeuge (Anzahl)
- Status

#### 5.4.2 Fahrer-Formular

**Felder:**

| Feld | Typ | Pflicht | Validierung |
|------|-----|---------|-------------|
| Vorname | Text | Ja | Min. 2 Zeichen |
| Nachname | Text | Ja | Min. 2 Zeichen |
| E-Mail | Text | Nein | Gültiges E-Mail-Format |
| Telefon | Text | Nein | - |
| Führerscheinklasse | Text | Nein | z.B. "B, BE, C1" |
| Führerschein gültig bis | Datum | Nein | - |
| Firma | Dropdown | Ja | Aus Firmen-Liste |
| Status | Dropdown | Ja | aktiv, archiviert |
| Notizen | Textarea | Nein | Max. 2000 Zeichen |

#### 5.4.3 Fahrzeug-Fahrer-Zuordnung

**Funktionsweise:**
- Ein Fahrer kann mehreren Fahrzeugen zugeordnet sein
- Ein Fahrzeug kann mehrere Fahrer haben
- Ein Fahrer kann als "Hauptfahrer" markiert werden
- Zuordnung über Tags in der Fahrzeug- oder Fahrer-Detailansicht

---

### 5.5 Modul: Terminverwaltung

**Zweck:** Tracking aller wiederkehrenden Termine und Fristen

#### 5.5.1 Termin-Typen (Standard)

| Typ | Standard-Intervall | Farbe |
|-----|-------------------|-------|
| TÜV/HU | 24 Monate | Rot |
| Inspektion | 12 Monate | Blau |
| Versicherung | 12 Monate | Grün |
| Leasingende | Einmalig | Orange |
| Reifenwechsel | 6 Monate | Grau |
| Sonstiges | - | Lila |

#### 5.5.2 Ansichten

**Listen-Ansicht (Standard):**

```
┌─────────────────────────────────────────────────────────────┐
│ TERMINE                          [Liste ✓] [Kalender]  [+]  │
├─────────────────────────────────────────────────────────────┤
│ Filter: [Alle Typen ▾] [Alle Fahrzeuge ▾] [Alle Status ▾]  │
├─────────────────────────────────────────────────────────────┤
│ 🔴 ÜBERFÄLLIG                                               │
│ ├─ 25.01.25 │ HH-WB 123 │ TÜV/HU │ 5 Tage überfällig       │
├─────────────────────────────────────────────────────────────┤
│ 🟡 DEMNÄCHST (< 30 Tage)                                    │
│ ├─ 15.02.25 │ HH-WB 456 │ TÜV/HU │ in 16 Tagen             │
│ ├─ 28.02.25 │ HH-GR 789 │ Inspektion │ in 29 Tagen         │
├─────────────────────────────────────────────────────────────┤
│ 🟢 GEPLANT                                                  │
│ ├─ 15.03.25 │ HH-MH 321 │ Versicherung │ in 44 Tagen       │
│ ├─ 01.04.25 │ HH-WB 123 │ Inspektion │ in 61 Tagen         │
└─────────────────────────────────────────────────────────────┘
```

**Kalender-Ansicht:**

```
┌─────────────────────────────────────────────────────────────┐
│ TERMINE                          [Liste] [Kalender ✓]  [+]  │
├─────────────────────────────────────────────────────────────┤
│              ◀  FEBRUAR 2025  ▶                             │
├─────┬─────┬─────┬─────┬─────┬─────┬─────────────────────────┤
│ Mo  │ Di  │ Mi  │ Do  │ Fr  │ Sa  │ So                      │
├─────┼─────┼─────┼─────┼─────┼─────┼─────────────────────────┤
│     │     │     │     │     │  1  │  2                      │
├─────┼─────┼─────┼─────┼─────┼─────┼─────────────────────────┤
│  3  │  4  │  5  │  6  │  7  │  8  │  9                      │
├─────┼─────┼─────┼─────┼─────┼─────┼─────────────────────────┤
│ 10  │ 11  │ 12  │ 13  │ 14  │ 🔴15│ 16                      │
│     │     │     │     │     │ TÜV │                         │
├─────┼─────┼─────┼─────┼─────┼─────┼─────────────────────────┤
│ 17  │ 18  │ 19  │ 20  │ 21  │ 22  │ 23                      │
├─────┼─────┼─────┼─────┼─────┼─────┼─────────────────────────┤
│ 24  │ 25  │ 26  │ 27  │ 🔵28│     │                         │
│     │     │     │     │ Insp│     │                         │
└─────┴─────┴─────┴─────┴─────┴─────┴─────────────────────────┘
```

#### 5.5.3 Termin-Formular

**Felder:**

| Feld | Typ | Pflicht |
|------|-----|---------|
| Fahrzeug | Dropdown | Ja |
| Termin-Typ | Dropdown | Ja |
| Fälligkeitsdatum | Datum | Ja |
| Erledigt am | Datum | Nein |
| Status | Dropdown | Ja (pending/completed/overdue) |
| Notizen | Textarea | Nein |

#### 5.5.4 Automatische Status-Berechnung

```
Wenn Fälligkeitsdatum < Heute UND Status != "completed":
    → Status = "overdue" (überfällig)
    → Anzeige in rot

Wenn Fälligkeitsdatum < Heute + 30 Tage:
    → Anzeige in gelb (Warnung)

Wenn Fälligkeitsdatum < Heute + 14 Tage:
    → Anzeige in orange (dringend)
```

---

### 5.6 Modul: Schadensmanagement

**Zweck:** Erfassung und Tracking aller Fahrzeugschäden

#### 5.6.1 Schaden-Status-Workflow

```
[Gemeldet] → [Freigegeben] → [In Reparatur] → [Abgeschlossen]
    │              │               │                │
    ▼              ▼               ▼                ▼
 reported      approved        in_repair        completed
```

#### 5.6.2 Schaden-Liste

```
┌─────────────────────────────────────────────────────────────┐
│ SCHÄDEN                                              [+ Neu]│
├─────────────────────────────────────────────────────────────┤
│ Filter: [Alle Status ▾] [Alle Fahrzeuge ▾]                 │
├─────────────────────────────────────────────────────────────┤
│ Datum    │ Fahrzeug   │ Art        │ Kosten   │ Status     │
├──────────┼────────────┼────────────┼──────────┼────────────┤
│ 28.01.25 │ HH-WB 123  │ Unfall     │ €3.200   │ 🔵 In Rep. │
│ 15.01.25 │ HH-GR 456  │ Parkschaden│ €850     │ 🟢 Erledigt│
│ 02.01.25 │ HH-WB 789  │ Steinschlag│ €350     │ 🟢 Erledigt│
└─────────────────────────────────────────────────────────────┘
```

#### 5.6.3 Schaden-Formular

**Felder:**

| Feld | Typ | Pflicht |
|------|-----|---------|
| Fahrzeug | Dropdown | Ja |
| Schadensart | Dropdown | Ja |
| Schadensdatum | Datum | Ja |
| Beschreibung | Textarea | Ja |
| Ort | Text | Nein |
| Geschätzte Kosten | Zahl | Nein |
| Tatsächliche Kosten | Zahl | Nein |
| Versicherungsfall | Checkbox | Nein |
| Schadensnummer (Versicherung) | Text | Nein |
| Status | Dropdown | Ja |
| Gemeldet von | Text | Ja |
| Fotos | Datei-Upload (mehrfach) | Nein |
| Notizen | Textarea | Nein |

#### 5.6.4 Schadensarten (Standard)

- Unfall (selbstverschuldet)
- Unfall (fremdverschuldet)
- Vandalismus
- Parkschaden
- Steinschlag
- Verschleiß
- Sonstiges

---

### 5.7 Modul: Kostenerfassung

**Zweck:** Tracking aller fahrzeugbezogenen Kosten

#### 5.7.1 Kosten-Liste

```
┌─────────────────────────────────────────────────────────────┐
│ KOSTEN                                               [+ Neu]│
├─────────────────────────────────────────────────────────────┤
│ ZUSAMMENFASSUNG JANUAR 2025                                 │
│ ┌─────────────┬─────────────┬─────────────┬───────────────┐ │
│ │ Tanken      │ Wartung     │ Reparatur   │ Gesamt        │ │
│ │ €1.250      │ €450        │ €750        │ €2.450        │ │
│ └─────────────┴─────────────┴─────────────┴───────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Filter: [Alle Typen ▾] [Alle Fahrzeuge ▾] [Januar 2025 ▾]  │
├─────────────────────────────────────────────────────────────┤
│ Datum    │ Fahrzeug   │ Art        │ Betrag   │ km-Stand   │
├──────────┼────────────┼────────────┼──────────┼────────────┤
│ 28.01.25 │ HH-WB 123  │ Tanken     │ €95,50   │ 87.500     │
│ 25.01.25 │ HH-WB 456  │ Inspektion │ €450,00  │ 62.300     │
│ 20.01.25 │ HH-GR 789  │ Reifen     │ €680,00  │ 45.200     │
└─────────────────────────────────────────────────────────────┘
```

#### 5.7.2 Kosten-Formular

**Felder:**

| Feld | Typ | Pflicht |
|------|-----|---------|
| Fahrzeug | Dropdown | Ja |
| Kostenart | Dropdown | Ja |
| Datum | Datum | Ja |
| Betrag (€) | Zahl | Ja |
| Beschreibung | Text | Nein |
| Kilometerstand | Zahl | Nein (aber empfohlen) |
| Beleg | Datei-Upload | Nein |
| Notizen | Textarea | Nein |

**Hinweis:** Wenn Kilometerstand angegeben, wird automatisch ein Eintrag in der Kilometerstand-Historie erstellt.

#### 5.7.3 Kostenarten (Standard)

- Tanken
- Inspektion/Wartung
- Reparatur (nicht Unfall)
- Reifen
- Versicherung
- Steuer/Abgaben
- Waschen/Pflege
- Parkgebühren
- Sonstiges

---

### 5.8 Modul: Dokumentenverwaltung

**Zweck:** Upload und Verwaltung aller fahrzeugbezogenen Dokumente

#### 5.8.1 Dokument-Upload

**Anforderungen:**
- Maximale Dateigröße: 10 MB
- Erlaubte Formate: PDF, JPG, PNG, WEBP
- Drag & Drop Unterstützung
- Mehrfach-Upload möglich

#### 5.8.2 Dokumenttypen (Standard)

- Fahrzeugschein
- Versicherungspolice
- Leasingvertrag
- TÜV-Bericht
- Inspektionsbericht
- Rechnung
- Sonstiges

#### 5.8.3 Dokument-Anzeige

```
┌─────────────────────────────────────────────────────────────┐
│ DOKUMENTE - HH-WB 123                             [+ Upload]│
├─────────────────────────────────────────────────────────────┤
│ Filter: [Alle Typen ▾]                                     │
├─────────────────────────────────────────────────────────────┤
│ 📄 Fahrzeugschein.pdf          │ Fahrzeugschein  │ [⬇️][🗑️]│
│    Hochgeladen: 15.01.2025     │                 │         │
├─────────────────────────────────────────────────────────────┤
│ 📄 TÜV-Bericht-2024.pdf        │ TÜV-Bericht     │ [⬇️][🗑️]│
│    Hochgeladen: 20.06.2024     │                 │         │
├─────────────────────────────────────────────────────────────┤
│ 📄 Versicherung-2025.pdf       │ Versicherung    │ [⬇️][🗑️]│
│    Hochgeladen: 02.01.2025     │                 │         │
└─────────────────────────────────────────────────────────────┘
```

---

### 5.9 Modul: Einstellungen

**Zweck:** Verwaltung von Stammdaten und System-Einstellungen

#### 5.9.1 Bereiche

| Bereich | Inhalt |
|---------|--------|
| Firmen | CRUD für Firmen-Liste |
| Dokumenttypen | CRUD für Dokumentkategorien |
| Termintypen | CRUD für Terminkategorien |
| Schadensarten | CRUD für Schadenskategorien |
| Kostenarten | CRUD für Kostenkategorien |
| Datenexport | CSV-Export aller Daten |
| Datenimport | CSV-Import für Fahrzeuge |

#### 5.9.2 CSV-Export

**Funktion:** Ein-Klick-Export aller Daten

**Ausgabe:**
- `fahrzeuge.csv`
- `fahrer.csv`
- `termine.csv`
- `schaeden.csv`
- `kosten.csv`
- `dokumente.csv` (Metadaten, nicht Dateien)

**Format:** ZIP-Archiv mit allen CSVs

#### 5.9.3 CSV-Import

**Funktion:** Initiale Datenmigration und laufender Import

**Unterstützt:**
- Fahrzeuge (primär)
- Fahrer

**Ablauf:**
1. CSV-Datei hochladen
2. Spalten-Zuordnung prüfen
3. Validierung mit Fehleranzeige
4. Import bestätigen
5. Ergebnis-Zusammenfassung

---

### 5.10 Kilometerstand-Tracking

**Zweck:** Historie der Kilometerstände für Auswertungen

#### 5.10.1 Automatische Erfassung

Kilometerstand wird automatisch gespeichert bei:
- Kosteneintrag (wenn km angegeben)
- Schadensmeldung (wenn km angegeben)
- Manueller Eintrag

#### 5.10.2 Anzeige im Fahrzeug-Detail

```
┌─────────────────────────────────────────────────────────────┐
│ KILOMETERSTAND - HH-WB 123                                  │
├─────────────────────────────────────────────────────────────┤
│ Aktuell: 87.500 km                                         │
│ Durchschnitt: ~1.500 km/Monat                              │
├─────────────────────────────────────────────────────────────┤
│         ▲                                                   │
│ 90.000 ─┤                                        ●          │
│         │                                   ●               │
│ 85.000 ─┤                              ●                    │
│         │                         ●                         │
│ 80.000 ─┤                    ●                              │
│         │               ●                                   │
│ 75.000 ─┤          ●                                        │
│         └────┬────┬────┬────┬────┬────┬────►               │
│            Jul Aug Sep Okt Nov Dez Jan                      │
├─────────────────────────────────────────────────────────────┤
│ HISTORIE                                                    │
│ 30.01.25 │ 87.500 km │ Kosteneintrag                       │
│ 15.01.25 │ 86.200 km │ Kosteneintrag                       │
│ 02.01.25 │ 85.100 km │ Manuell                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Nicht-funktionale Anforderungen

### 6.1 Performance

| Metrik | Zielwert |
|--------|----------|
| Seitenladezeit | < 2 Sekunden |
| Time to Interactive | < 3 Sekunden |
| Datenbankabfragen | < 500ms |
| Datei-Upload (10 MB) | < 10 Sekunden |

### 6.2 Verfügbarkeit

| Metrik | Zielwert |
|--------|----------|
| Uptime | 99% (Vercel Standard) |
| Geplante Wartung | Außerhalb Geschäftszeiten |

### 6.3 Skalierbarkeit

| Metrik | Aktuell | Kapazität |
|--------|---------|-----------|
| Fahrzeuge | ~50 | 500+ |
| Dokumente | ~200 | 10.000+ |
| Gleichzeitige Nutzer | 1-3 | 20+ |

### 6.4 Benutzerfreundlichkeit

| Anforderung | Umsetzung |
|-------------|-----------|
| Sprache | Deutsch (komplett) |
| Zielgruppe | Technische Affinität 1/10 |
| Lernkurve | Keine Schulung nötig |
| Feedback | Sofortige Rückmeldung bei allen Aktionen |
| Fehlermeldungen | Klar, verständlich, handlungsorientiert |
| Auto-Save | Formulare speichern automatisch lokal |

### 6.5 Browser-Unterstützung

| Browser | Version |
|---------|---------|
| Chrome | Letzte 2 Versionen |
| Firefox | Letzte 2 Versionen |
| Safari | Letzte 2 Versionen |
| Edge | Letzte 2 Versionen |

---

## 7. Datenmodell

### 7.1 Entity-Relationship-Diagramm

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  companies  │       │  vehicles   │       │   drivers   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │◄──┐   │ id (PK)     │   ┌──►│ id (PK)     │
│ name        │   │   │ license_plt │   │   │ first_name  │
│ created_at  │   │   │ brand       │   │   │ last_name   │
└─────────────┘   │   │ model       │   │   │ email       │
                  │   │ year        │   │   │ phone       │
                  │   │ vin         │   │   │ license_cls │
                  │   │ fuel_type   │   │   │ license_exp │
                  ├───│ company_id  │   │   │ company_id  │──┐
                  │   │ ...         │   │   │ status      │  │
                  │   └─────────────┘   │   └─────────────┘  │
                  │          │          │                    │
                  │          │          │                    │
                  │          ▼          │                    │
                  │   ┌─────────────────┴───┐               │
                  │   │  vehicle_drivers    │               │
                  │   ├─────────────────────┤               │
                  │   │ id (PK)             │               │
                  │   │ vehicle_id (FK)     │               │
                  │   │ driver_id (FK)      │               │
                  │   │ is_primary          │               │
                  │   │ assigned_at         │               │
                  │   └─────────────────────┘               │
                  │                                         │
                  │                                         │
                  │   ┌─────────────┐                       │
                  │   │  documents  │                       │
                  │   ├─────────────┤                       │
                  │   │ id (PK)     │                       │
                  │   │ vehicle_id  │───────────────────────┤
                  │   │ doc_type_id │───┐                   │
                  │   │ name        │   │                   │
                  │   │ file_path   │   │                   │
                  │   │ file_size   │   │                   │
                  │   │ mime_type   │   │                   │
                  │   │ uploaded_at │   │                   │
                  │   └─────────────┘   │                   │
                  │                     ▼                   │
                  │          ┌─────────────────┐            │
                  │          │ document_types  │            │
                  │          ├─────────────────┤            │
                  │          │ id (PK)         │            │
                  │          │ name            │            │
                  │          │ description     │            │
                  │          └─────────────────┘            │
                  │                                         │
                  │   ┌─────────────┐                       │
                  │   │appointments │                       │
                  │   ├─────────────┤                       │
                  │   │ id (PK)     │                       │
                  │   │ vehicle_id  │───────────────────────┤
                  │   │ apt_type_id │───┐                   │
                  │   │ due_date    │   │                   │
                  │   │ completed_dt│   │                   │
                  │   │ status      │   │                   │
                  │   │ notes       │   │                   │
                  │   └─────────────┘   │                   │
                  │                     ▼                   │
                  │        ┌───────────────────┐            │
                  │        │ appointment_types │            │
                  │        ├───────────────────┤            │
                  │        │ id (PK)           │            │
                  │        │ name              │            │
                  │        │ interval_months   │            │
                  │        │ color             │            │
                  │        └───────────────────┘            │
                  │                                         │
                  │   ┌─────────────┐                       │
                  │   │   damages   │                       │
                  │   ├─────────────┤                       │
                  │   │ id (PK)     │                       │
                  │   │ vehicle_id  │───────────────────────┤
                  │   │ dmg_type_id │───┐                   │
                  │   │ date        │   │                   │
                  │   │ description │   │                   │
                  │   │ location    │   │                   │
                  │   │ cost_est    │   │                   │
                  │   │ actual_cost │   │                   │
                  │   │ insurance   │   │                   │
                  │   │ claim_no    │   │                   │
                  │   │ status      │   │                   │
                  │   │ reported_by │   │                   │
                  │   └─────────────┘   │                   │
                  │          │          ▼                   │
                  │          │  ┌───────────────┐           │
                  │          │  │ damage_types  │           │
                  │          │  ├───────────────┤           │
                  │          │  │ id (PK)       │           │
                  │          │  │ name          │           │
                  │          │  └───────────────┘           │
                  │          │                              │
                  │          ▼                              │
                  │  ┌───────────────┐                      │
                  │  │ damage_images │                      │
                  │  ├───────────────┤                      │
                  │  │ id (PK)       │                      │
                  │  │ damage_id(FK) │                      │
                  │  │ file_path     │                      │
                  │  │ uploaded_at   │                      │
                  │  └───────────────┘                      │
                  │                                         │
                  │   ┌─────────────┐                       │
                  │   │    costs    │                       │
                  │   ├─────────────┤                       │
                  │   │ id (PK)     │                       │
                  │   │ vehicle_id  │───────────────────────┤
                  │   │ cost_type_id│───┐                   │
                  │   │ date        │   │                   │
                  │   │ amount      │   │                   │
                  │   │ description │   │                   │
                  │   │ mileage     │   │                   │
                  │   │ receipt_path│   │                   │
                  │   └─────────────┘   │                   │
                  │                     ▼                   │
                  │          ┌─────────────────┐            │
                  │          │   cost_types    │            │
                  │          ├─────────────────┤            │
                  │          │ id (PK)         │            │
                  │          │ name            │            │
                  │          │ icon            │            │
                  │          └─────────────────┘            │
                  │                                         │
                  │   ┌─────────────┐                       │
                  │   │mileage_logs │                       │
                  │   ├─────────────┤                       │
                  │   │ id (PK)     │                       │
                  │   │ vehicle_id  │───────────────────────┘
                  │   │ mileage     │
                  │   │ recorded_at │
                  │   │ source      │
                  │   │ notes       │
                  │   └─────────────┘
                  │
                  └───────────────────────────────────────────
```

### 7.2 Tabellen-Definitionen

#### 7.2.1 companies

```sql
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 7.2.2 vehicles

```sql
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_plate VARCHAR(20) NOT NULL UNIQUE,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    vin VARCHAR(17),
    fuel_type VARCHAR(20) NOT NULL,
    purchase_date DATE,
    purchase_price DECIMAL(10,2),
    mileage INTEGER NOT NULL DEFAULT 0,
    is_leased BOOLEAN DEFAULT FALSE,
    insurance_number VARCHAR(100),
    insurance_company VARCHAR(100),
    tuv_due_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    company_id UUID NOT NULL REFERENCES companies(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enum-ähnliche Constraints
ALTER TABLE vehicles ADD CONSTRAINT chk_fuel_type 
    CHECK (fuel_type IN ('diesel', 'benzin', 'elektro', 'hybrid_benzin', 'hybrid_diesel', 'gas'));
    
ALTER TABLE vehicles ADD CONSTRAINT chk_status 
    CHECK (status IN ('active', 'archived'));
```

#### 7.2.3 drivers

```sql
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    license_class VARCHAR(50),
    license_expiry DATE,
    company_id UUID NOT NULL REFERENCES companies(id),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 7.2.4 vehicle_drivers

```sql
CREATE TABLE vehicle_drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(vehicle_id, driver_id)
);
```

#### 7.2.5 document_types

```sql
CREATE TABLE document_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Standard-Daten
INSERT INTO document_types (name, description) VALUES
    ('Fahrzeugschein', 'Zulassungsbescheinigung Teil I'),
    ('Versicherungspolice', 'Kfz-Versicherungsunterlagen'),
    ('Leasingvertrag', 'Leasingvertrag und Konditionen'),
    ('TÜV-Bericht', 'Hauptuntersuchung / HU-Bericht'),
    ('Inspektionsbericht', 'Werkstatt-Inspektionsbericht'),
    ('Rechnung', 'Allgemeine Rechnungen'),
    ('Sonstiges', 'Sonstige Dokumente');
```

#### 7.2.6 documents

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    document_type_id UUID NOT NULL REFERENCES document_types(id),
    name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    notes TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 7.2.7 appointment_types

```sql
CREATE TABLE appointment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    default_interval_months INTEGER,
    color VARCHAR(7) DEFAULT '#6B7280',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Standard-Daten
INSERT INTO appointment_types (name, default_interval_months, color) VALUES
    ('TÜV/HU', 24, '#EF4444'),
    ('Inspektion', 12, '#3B82F6'),
    ('Versicherung', 12, '#10B981'),
    ('Leasingende', NULL, '#F97316'),
    ('Reifenwechsel', 6, '#6B7280'),
    ('Sonstiges', NULL, '#8B5CF6');
```

#### 7.2.8 appointments

```sql
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    appointment_type_id UUID NOT NULL REFERENCES appointment_types(id),
    due_date DATE NOT NULL,
    completed_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE appointments ADD CONSTRAINT chk_appointment_status 
    CHECK (status IN ('pending', 'completed', 'overdue'));
```

#### 7.2.9 damage_types

```sql
CREATE TABLE damage_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Standard-Daten
INSERT INTO damage_types (name) VALUES
    ('Unfall (selbstverschuldet)'),
    ('Unfall (fremdverschuldet)'),
    ('Vandalismus'),
    ('Parkschaden'),
    ('Steinschlag'),
    ('Verschleiß'),
    ('Sonstiges');
```

#### 7.2.10 damages

```sql
CREATE TABLE damages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    damage_type_id UUID NOT NULL REFERENCES damage_types(id),
    date DATE NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255),
    cost_estimate DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    insurance_claim BOOLEAN DEFAULT FALSE,
    insurance_claim_number VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'reported',
    reported_by VARCHAR(255) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE damages ADD CONSTRAINT chk_damage_status 
    CHECK (status IN ('reported', 'approved', 'in_repair', 'completed'));
```

#### 7.2.11 damage_images

```sql
CREATE TABLE damage_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    damage_id UUID NOT NULL REFERENCES damages(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 7.2.12 cost_types

```sql
CREATE TABLE cost_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Standard-Daten
INSERT INTO cost_types (name, icon) VALUES
    ('Tanken', 'fuel'),
    ('Inspektion/Wartung', 'wrench'),
    ('Reparatur', 'tool'),
    ('Reifen', 'circle'),
    ('Versicherung', 'shield'),
    ('Steuer/Abgaben', 'receipt'),
    ('Waschen/Pflege', 'droplet'),
    ('Parkgebühren', 'parking'),
    ('Sonstiges', 'more-horizontal');
```

#### 7.2.13 costs

```sql
CREATE TABLE costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    cost_type_id UUID NOT NULL REFERENCES cost_types(id),
    date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    mileage_at_cost INTEGER,
    receipt_path TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 7.2.14 mileage_logs

```sql
CREATE TABLE mileage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    mileage INTEGER NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source VARCHAR(20) NOT NULL DEFAULT 'manual',
    notes TEXT
);

ALTER TABLE mileage_logs ADD CONSTRAINT chk_mileage_source 
    CHECK (source IN ('manual', 'cost_entry', 'damage_report'));
```

### 7.3 Indizes

```sql
-- Performance-Indizes
CREATE INDEX idx_vehicles_company ON vehicles(company_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_appointments_due_date ON appointments(due_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_damages_vehicle ON damages(vehicle_id);
CREATE INDEX idx_damages_status ON damages(status);
CREATE INDEX idx_costs_vehicle ON costs(vehicle_id);
CREATE INDEX idx_costs_date ON costs(date);
CREATE INDEX idx_mileage_vehicle ON mileage_logs(vehicle_id);
```

---

## 8. Tech Stack

### 8.1 Übersicht

| Kategorie | Technologie | Version | Zweck |
|-----------|-------------|---------|-------|
| Framework | Next.js | 14+ | App Router, Full-Stack |
| Sprache | TypeScript | 5+ | Type-Safety |
| Datenbank | PostgreSQL | 15+ | Via Supabase |
| Backend | Supabase | Latest | Auth, DB, Storage |
| UI | shadcn/ui | Latest | Komponenten-Bibliothek |
| Styling | Tailwind CSS | 3+ | Utility-CSS |
| Icons | Lucide React | Latest | Icon-Set |
| Formulare | React Hook Form | 7+ | Form-Management |
| Validierung | Zod | 3+ | Schema-Validierung |
| Tabellen | TanStack Table | 8+ | Data Tables |
| State | TanStack Query | 5+ | Server State |
| Datum | date-fns | 3+ | Datum-Funktionen |
| Kalender | react-day-picker | 8+ | Kalender-UI |
| Toasts | Sonner | 1+ | Benachrichtigungen |
| Testing | Playwright | Latest | E2E-Tests |
| Hosting | Vercel | - | Deployment |

### 8.2 Abhängigkeiten (package.json)

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@supabase/supabase-js": "^2.0.0",
    "@supabase/ssr": "^0.1.0",
    "@tanstack/react-query": "^5.0.0",
    "@tanstack/react-table": "^8.0.0",
    "react-hook-form": "^7.0.0",
    "@hookform/resolvers": "^3.0.0",
    "zod": "^3.0.0",
    "date-fns": "^3.0.0",
    "react-day-picker": "^8.0.0",
    "lucide-react": "^0.300.0",
    "sonner": "^1.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "tailwindcss": "^3.0.0",
    "postcss": "^8.0.0",
    "autoprefixer": "^10.0.0",
    "@playwright/test": "^1.40.0",
    "supabase": "^1.0.0"
  }
}
```

---

## 9. Architektur

### 9.1 System-Übersicht

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       VERCEL (Hosting)                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Next.js App                            │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │  │
│  │  │   Pages     │  │ Components  │  │  API Routes     │   │  │
│  │  │  (App Dir)  │  │   (UI)      │  │  (Webhooks)     │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                │                                 │
│                         Cron Jobs                                │
│                    (Termin-Prüfung täglich)                     │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SUPABASE                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │    Auth     │  │  Database   │  │       Storage           │  │
│  │  (Login)    │  │ (PostgreSQL)│  │  (Dokumente/Fotos)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                          │                                       │
│                   Database Webhooks                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                        n8n (Extern)                             │
│              Automatisierungen & Benachrichtigungen             │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Datenfluss

```
NUTZER-AKTION                    APP-REAKTION
──────────────                   ────────────
Klickt "Speichern"
        │
        ▼
Formular-Validierung (Zod)
        │
        ├── Fehler? → Zeige Fehlermeldung
        │
        ▼
Supabase Client sendet Daten
        │
        ▼
Supabase speichert in PostgreSQL
        │
        ├── Trigger: Webhook an n8n (optional)
        │
        ▼
TanStack Query invalidiert Cache
        │
        ▼
UI aktualisiert automatisch
        │
        ▼
Toast: "Erfolgreich gespeichert"
```

### 9.3 Event-System für n8n

```
/lib/events/
├── index.ts          # Event-Dispatcher
├── types.ts          # Event-Definitionen
└── handlers/
    ├── damage-events.ts
    ├── appointment-events.ts
    └── vehicle-events.ts

/lib/webhooks/
├── config.ts         # Aktive Events konfigurieren
└── sender.ts         # Webhook-Versand
```

**Event-Typen:**

```typescript
// /lib/events/types.ts
export type AppEvent =
  // Schäden
  | "damage.created"
  | "damage.updated"
  | "damage.status_changed"
  
  // Termine
  | "appointment.created"
  | "appointment.due_soon"      // 30 Tage
  | "appointment.due_urgent"    // 14 Tage
  | "appointment.overdue"
  | "appointment.completed"
  
  // Fahrzeuge
  | "vehicle.created"
  | "vehicle.archived"
  
  // Reports
  | "report.daily"
  | "report.weekly"
  | "report.monthly";
```

**Webhook-Konfiguration:**

```typescript
// /lib/webhooks/config.ts
export const webhookConfig = {
  endpoints: {
    damage: process.env.N8N_WEBHOOK_DAMAGE,
    appointments: process.env.N8N_WEBHOOK_APPOINTMENTS,
    daily_report: process.env.N8N_WEBHOOK_DAILY_REPORT,
  },
  
  enabled: {
    "damage.created": true,
    "damage.status_changed": true,
    "appointment.due_soon": true,
    "appointment.due_urgent": true,
    "appointment.overdue": true,
    "report.daily": false,  // Später aktivierbar
  }
};
```

### 9.4 Cron-Jobs

**Vercel Cron für tägliche Termin-Prüfung:**

```typescript
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/check-appointments",
      "schedule": "0 7 * * *"  // Täglich um 7:00 Uhr
    }
  ]
}
```

**Job-Logik:**

```
07:00 Uhr täglich:
├── Lade alle Termine mit Status != "completed"
├── Prüfe Fälligkeitsdatum:
│   ├── < Heute → Status = "overdue", Event: appointment.overdue
│   ├── < Heute + 14 Tage → Event: appointment.due_urgent
│   └── < Heute + 30 Tage → Event: appointment.due_soon
└── Events an n8n senden (falls konfiguriert)
```

---

## 10. UI/UX Spezifikation

### 10.1 Design-Prinzipien

| Prinzip | Umsetzung |
|---------|-----------|
| **Einfachheit** | Maximal 3 Klicks zu jeder Funktion |
| **Klarheit** | Große, gut lesbare Texte (min. 16px) |
| **Konsistenz** | Gleiche Aktionen immer am gleichen Ort |
| **Feedback** | Sofortige Rückmeldung bei jeder Aktion |
| **Fehlertoleranz** | Auto-Save, Bestätigungsdialoge bei Löschungen |

### 10.2 Farbschema

| Farbe | Hex | Verwendung |
|-------|-----|------------|
| Primary | #3B82F6 | Buttons, Links |
| Success | #10B981 | Erfolgsmeldungen, "Erledigt" |
| Warning | #F59E0B | Warnungen, "Demnächst fällig" |
| Danger | #EF4444 | Fehler, "Überfällig" |
| Neutral | #6B7280 | Text, Borders |
| Background | #F9FAFB | Seitenhintergrund |
| Card | #FFFFFF | Karten, Formulare |

### 10.3 Layout-Struktur

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER                                                          │
│ Logo                                           [Benutzer] [Logout]│
├────────────┬────────────────────────────────────────────────────┤
│            │                                                    │
│  SIDEBAR   │              MAIN CONTENT                          │
│            │                                                    │
│ Dashboard  │  ┌──────────────────────────────────────────────┐  │
│ Fahrzeuge  │  │ PAGE HEADER                         [Actions]│  │
│ Fahrer     │  ├──────────────────────────────────────────────┤  │
│ Termine    │  │                                              │  │
│ Schäden    │  │                                              │  │
│ Kosten     │  │              PAGE CONTENT                    │  │
│ ────────── │  │                                              │  │
│ Einstellungen│ │                                              │  │
│            │  │                                              │  │
│            │  └──────────────────────────────────────────────┘  │
│            │                                                    │
└────────────┴────────────────────────────────────────────────────┘
```

### 10.4 Komponenten-Spezifikation

#### 10.4.1 Buttons

| Typ | Verwendung | Stil |
|-----|------------|------|
| Primary | Hauptaktion (Speichern) | Blau, gefüllt |
| Secondary | Nebenaktionen (Abbrechen) | Grau, Outline |
| Danger | Löschaktionen | Rot, gefüllt |
| Ghost | Toolbar-Aktionen | Transparent |

**Größen:**
- Default: Höhe 40px, Padding 16px
- Large: Höhe 48px, Padding 24px (für Hauptaktionen)

#### 10.4.2 Formulare

- Labels immer oberhalb des Feldes
- Pflichtfelder mit * markiert
- Fehler direkt unter dem Feld (rot)
- Hilfetext in Grau unter dem Feld
- Submit-Button immer rechts unten
- Abbrechen-Button links neben Submit

#### 10.4.3 Tabellen

- Sortierbare Spalten mit Icon
- Pagination unten (20 Einträge pro Seite)
- Filter oberhalb der Tabelle
- Aktionen in letzter Spalte (Icons)
- Hover-Effekt auf Zeilen
- Klickbare Zeilen öffnen Detail

#### 10.4.4 Toasts/Benachrichtigungen

| Typ | Farbe | Dauer | Beispiel |
|-----|-------|-------|----------|
| Erfolg | Grün | 3 Sek | "Fahrzeug gespeichert" |
| Fehler | Rot | 5 Sek | "Speichern fehlgeschlagen" |
| Warnung | Gelb | 4 Sek | "Pflichtfeld fehlt" |
| Info | Blau | 3 Sek | "Daten werden geladen" |

### 10.5 Responsive Design

| Breakpoint | Verhalten |
|------------|-----------|
| Desktop (>1024px) | Sidebar + Content |
| Tablet (768-1024px) | Collapsible Sidebar |
| Mobile (<768px) | Bottom Navigation (nicht primär unterstützt) |

**Hinweis:** Primärer Fokus auf Desktop. Mobile funktional, aber nicht optimiert.

---

## 11. API-Design

### 11.1 Supabase Client-Nutzung

Die App nutzt den Supabase Client direkt (kein REST-API-Layer).

**Beispiel: Fahrzeuge laden**

```typescript
// /hooks/use-vehicles.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

export function useVehicles(filters?: VehicleFilters) {
  return useQuery({
    queryKey: ['vehicles', filters],
    queryFn: async () => {
      let query = supabase
        .from('vehicles')
        .select(`
          *,
          company:companies(name),
          appointments(due_date, status, appointment_type:appointment_types(name))
        `)
        .order('license_plate');
      
      if (filters?.companyId) {
        query = query.eq('company_id', filters.companyId);
      }
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });
}
```

### 11.2 API-Routes (nur für Webhooks & Cron)

| Endpunkt | Methode | Zweck |
|----------|---------|-------|
| `/api/webhooks/n8n` | POST | Empfängt n8n-Anfragen |
| `/api/cron/check-appointments` | GET | Tägliche Termin-Prüfung |

### 11.3 Webhook-Payloads

**Event: damage.created**

```json
{
  "event": "damage.created",
  "timestamp": "2025-01-30T10:30:00Z",
  "data": {
    "damage_id": "uuid",
    "vehicle": {
      "id": "uuid",
      "license_plate": "HH-WB 123",
      "brand": "Mercedes",
      "model": "Sprinter"
    },
    "damage_type": "Unfall (selbstverschuldet)",
    "date": "2025-01-28",
    "description": "Auffahrunfall auf A7",
    "cost_estimate": 3500,
    "reported_by": "Thomas Müller"
  }
}
```

**Event: appointment.due_urgent**

```json
{
  "event": "appointment.due_urgent",
  "timestamp": "2025-01-30T07:00:00Z",
  "data": {
    "appointment_id": "uuid",
    "vehicle": {
      "id": "uuid",
      "license_plate": "HH-WB 456",
      "brand": "VW",
      "model": "Transporter"
    },
    "appointment_type": "TÜV/HU",
    "due_date": "2025-02-12",
    "days_until_due": 13
  }
}
```

---

## 12. Security

### 12.1 Authentifizierung

| Aspekt | Lösung |
|--------|--------|
| Methode | Supabase Auth (E-Mail/Passwort) |
| Account | Ein geteilter Account für alle Nutzer |
| Session-Dauer | 7 Tage (Cookie-basiert) |
| Verlängerung | Automatisch bei Aktivität |

### 12.2 Autorisierung

```sql
-- Row Level Security: Eingeloggte Nutzer dürfen alles
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can do everything" ON vehicles
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Gleiche Policy für alle anderen Tabellen
```

### 12.3 Datenschutz

| Bereich | Maßnahme |
|---------|----------|
| Transport | HTTPS (Vercel automatisch) |
| Datenbank | Verschlüsselung at rest (Supabase) |
| Dateien | Private Bucket (nicht öffentlich) |
| Passwörter | Gehasht mit bcrypt (Supabase) |

### 12.4 Datei-Upload-Sicherheit

```typescript
// /lib/validations/file-upload.ts
export const fileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, 'Datei zu groß (max. 10 MB)')
    .refine(
      (file) => ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'Ungültiges Format (nur PDF, JPG, PNG, WEBP)'
    )
});
```

### 12.5 API-Sicherheit

| Endpunkt | Schutz |
|----------|--------|
| Alle App-Seiten | Session-Check via Middleware |
| `/api/webhooks/n8n` | Secret-Token im Header |
| `/api/cron/*` | Vercel Cron-Secret |

**Middleware:**

```typescript
// /middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const supabase = createServerClient(/* ... */);
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}
```

---

## 13. Testing

### 13.1 Strategie

| Test-Art | Anzahl | Tools | Priorität |
|----------|--------|-------|-----------|
| E2E-Tests | ~5 | Playwright | Hoch |
| Unit-Tests | Optional | Vitest | Niedrig |

### 13.2 E2E-Test-Szenarien

| # | Szenario | Schritte |
|---|----------|----------|
| 1 | Login | Seite öffnen → Anmelden → Dashboard sichtbar |
| 2 | Fahrzeug anlegen | Formular öffnen → Ausfüllen → Speichern → In Liste |
| 3 | Schaden melden | Formular → Foto hochladen → Speichern |
| 4 | Dokument hochladen | Fahrzeug öffnen → Upload → Dokument sichtbar |
| 5 | CSV-Export | Einstellungen → Export → Datei herunterladen |

### 13.3 Test-Datei-Struktur

```
/__tests__/
└── e2e/
    ├── login.spec.ts
    ├── vehicle-crud.spec.ts
    ├── damage-report.spec.ts
    ├── document-upload.spec.ts
    └── csv-export.spec.ts
```

### 13.4 CI/CD-Integration

```yaml
# .github/workflows/test.yml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
```

---

## 14. Deployment

### 14.1 Umgebungen

| Umgebung | URL | Zweck |
|----------|-----|-------|
| Production | fuhrpark.example.de | Live-System |
| Preview | *.vercel.app | Test bei Pull Requests |
| Local | localhost:3000 | Entwicklung |

### 14.2 Umgebungsvariablen

```bash
# .env.local (Entwicklung)
# .env (Vercel Production)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# n8n Webhooks
N8N_WEBHOOK_DAMAGE=https://n8n.example.de/webhook/damage
N8N_WEBHOOK_APPOINTMENTS=https://n8n.example.de/webhook/appointments
N8N_WEBHOOK_SECRET=geheimes-token

# Cron
CRON_SECRET=vercel-cron-secret
```

### 14.3 Deployment-Prozess

```
Code-Änderung
    │
    ▼
Push zu GitHub
    │
    ▼
GitHub Actions: E2E-Tests
    │
    ├── Fehlgeschlagen → Deployment gestoppt
    │
    ▼
Tests erfolgreich
    │
    ▼
Vercel Build
    │
    ▼
Preview-URL erstellt (bei PR)
    │
    ▼
Merge zu main
    │
    ▼
Production-Deployment
```

### 14.4 Rollback

Bei Problemen:
1. Vercel Dashboard öffnen
2. Vorheriges Deployment wählen
3. "Promote to Production" klicken

---

## 15. Projektstruktur

```
/fuhrpark-app
│
├── /app                           # Next.js App Router
│   ├── layout.tsx                 # Root Layout
│   ├── page.tsx                   # Dashboard
│   ├── /login
│   │   └── page.tsx
│   ├── /vehicles
│   │   ├── page.tsx               # Liste
│   │   ├── /new
│   │   │   └── page.tsx           # Neu
│   │   └── /[id]
│   │       ├── page.tsx           # Detail
│   │       └── /edit
│   │           └── page.tsx       # Bearbeiten
│   ├── /drivers
│   │   ├── page.tsx
│   │   ├── /new
│   │   │   └── page.tsx
│   │   └── /[id]
│   │       ├── page.tsx
│   │       └── /edit
│   │           └── page.tsx
│   ├── /appointments
│   │   ├── page.tsx               # Liste + Kalender
│   │   └── /new
│   │       └── page.tsx
│   ├── /damages
│   │   ├── page.tsx
│   │   ├── /new
│   │   │   └── page.tsx
│   │   └── /[id]
│   │       └── page.tsx
│   ├── /costs
│   │   ├── page.tsx
│   │   └── /new
│   │       └── page.tsx
│   ├── /settings
│   │   ├── page.tsx
│   │   ├── /companies
│   │   │   └── page.tsx
│   │   └── /types
│   │       └── page.tsx
│   └── /api
│       ├── /webhooks
│       │   └── /n8n
│       │       └── route.ts
│       └── /cron
│           └── /check-appointments
│               └── route.ts
│
├── /components
│   ├── /ui                        # shadcn Komponenten
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── table.tsx
│   │   ├── calendar.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── form.tsx
│   │   ├── select.tsx
│   │   ├── textarea.tsx
│   │   ├── toast.tsx
│   │   └── ...
│   │
│   ├── /vehicles
│   │   ├── vehicle-form.tsx
│   │   ├── vehicle-table.tsx
│   │   ├── vehicle-card.tsx
│   │   ├── vehicle-status-badge.tsx
│   │   └── vehicle-filters.tsx
│   │
│   ├── /drivers
│   │   ├── driver-form.tsx
│   │   ├── driver-table.tsx
│   │   ├── driver-card.tsx
│   │   └── driver-select.tsx
│   │
│   ├── /appointments
│   │   ├── appointment-form.tsx
│   │   ├── appointment-table.tsx
│   │   ├── appointment-calendar.tsx
│   │   └── appointment-card.tsx
│   │
│   ├── /damages
│   │   ├── damage-form.tsx
│   │   ├── damage-table.tsx
│   │   ├── damage-status-badge.tsx
│   │   └── damage-image-upload.tsx
│   │
│   ├── /costs
│   │   ├── cost-form.tsx
│   │   ├── cost-table.tsx
│   │   └── cost-summary.tsx
│   │
│   ├── /documents
│   │   ├── document-upload.tsx
│   │   ├── document-list.tsx
│   │   └── document-preview.tsx
│   │
│   ├── /layout
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   ├── navigation.tsx
│   │   └── page-header.tsx
│   │
│   └── /shared
│       ├── data-table.tsx
│       ├── file-upload.tsx
│       ├── confirm-dialog.tsx
│       ├── loading-spinner.tsx
│       ├── empty-state.tsx
│       └── status-badge.tsx
│
├── /lib
│   ├── /supabase
│   │   ├── client.ts              # Browser Client
│   │   ├── server.ts              # Server Client
│   │   ├── middleware.ts          # Auth Middleware
│   │   └── types.ts               # Generated Types
│   │
│   ├── /validations
│   │   ├── vehicle.ts
│   │   ├── driver.ts
│   │   ├── appointment.ts
│   │   ├── damage.ts
│   │   ├── cost.ts
│   │   └── file-upload.ts
│   │
│   ├── /events
│   │   ├── index.ts
│   │   ├── types.ts
│   │   └── /handlers
│   │       ├── damage-events.ts
│   │       ├── appointment-events.ts
│   │       └── vehicle-events.ts
│   │
│   ├── /webhooks
│   │   ├── config.ts
│   │   └── sender.ts
│   │
│   ├── /errors
│   │   ├── index.ts
│   │   ├── messages.ts            # Deutsche Fehlermeldungen
│   │   └── handler.ts
│   │
│   ├── utils.ts                   # Hilfsfunktionen
│   └── constants.ts               # Konstanten
│
├── /hooks
│   ├── use-vehicles.ts
│   ├── use-drivers.ts
│   ├── use-appointments.ts
│   ├── use-damages.ts
│   ├── use-costs.ts
│   ├── use-documents.ts
│   ├── use-companies.ts
│   └── use-auto-save.ts
│
├── /types
│   └── index.ts                   # App-spezifische Typen
│
├── /__tests__
│   └── /e2e
│       ├── login.spec.ts
│       ├── vehicle-crud.spec.ts
│       ├── damage-report.spec.ts
│       ├── document-upload.spec.ts
│       └── csv-export.spec.ts
│
├── /public
│   └── /images
│       └── logo.svg
│
├── /supabase
│   └── /migrations               # SQL Migrations
│       ├── 001_initial_schema.sql
│       └── 002_seed_data.sql
│
├── .env.local                    # Lokale Umgebungsvariablen
├── .env.example                  # Beispiel
├── .gitignore
├── middleware.ts                 # Next.js Middleware
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
├── playwright.config.ts
├── vercel.json                   # Cron-Konfiguration
├── CLAUDE.md                     # Claude Code Regeln
├── README.md
└── PRD.md                        # Dieses Dokument
```

---

## 16. Anhang

### 16.1 Glossar

| Begriff | Bedeutung |
|---------|-----------|
| CRUD | Create, Read, Update, Delete |
| HU | Hauptuntersuchung (TÜV) |
| VIN | Vehicle Identification Number (Fahrgestellnummer) |
| RLS | Row Level Security (Supabase) |
| E2E | End-to-End (Tests) |
| PRD | Product Requirements Document |

### 16.2 Referenzen

- [Next.js Dokumentation](https://nextjs.org/docs)
- [Supabase Dokumentation](https://supabase.com/docs)
- [shadcn/ui Komponenten](https://ui.shadcn.com)
- [TanStack Query](https://tanstack.com/query)
- [Playwright Testing](https://playwright.dev)

### 16.3 Änderungshistorie

| Version | Datum | Änderungen |
|---------|-------|------------|
| 1.0 | 30.01.2025 | Initiale Version |

---

## Nächste Schritte

1. [ ] PRD-Review und Freigabe
2. [ ] CLAUDE.md erstellen
3. [ ] Supabase-Projekt aufsetzen
4. [ ] Vercel-Projekt erstellen
5. [ ] Entwicklung starten

---

**Ende des PRD-Dokuments**
