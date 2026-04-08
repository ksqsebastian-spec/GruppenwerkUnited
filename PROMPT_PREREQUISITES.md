# PROMPT_PREREQUISITES.md – Qualitätssicherung vor Projektstart

**Version:** 1.0  
**Zweck:** Erzwingt vollständige Anforderungsklärung bevor die Planungsphase verlassen wird

---

## ⚠️ KRITISCHE ANWEISUNG FÜR CLAUDE

Diese Datei definiert **PFLICHT-VORAUSSETZUNGEN** die erfüllt sein MÜSSEN bevor:
- Ein PRD erstellt wird
- Code geschrieben wird
- Die Planungsphase verlassen wird
- Irgendeine Implementierung beginnt

**REGEL:** Wenn eine Kategorie unvollständig ist → NACHFRAGEN. Keine Annahmen treffen.

---

## 1. PLANUNGSPHASEN

### Phase 1: Discovery (Entdeckung)
**Status:** ⬜ Nicht begonnen | 🟡 In Arbeit | ✅ Abgeschlossen

Ziel: Grundlegendes Projektverständnis

### Phase 2: Requirements (Anforderungen)
**Status:** ⬜ Nicht begonnen | 🟡 In Arbeit | ✅ Abgeschlossen

Ziel: Vollständige Feature-Definition

### Phase 3: Technical (Technik)
**Status:** ⬜ Nicht begonnen | 🟡 In Arbeit | ✅ Abgeschlossen

Ziel: Stack und Architektur festlegen

### Phase 4: Validation (Validierung)
**Status:** ⬜ Nicht begonnen | 🟡 In Arbeit | ✅ Abgeschlossen

Ziel: Zusammenfassung bestätigen lassen

---

## 2. PFLICHT-CHECKLISTEN PRO PHASE

### 2.1 Phase 1: Discovery

**Mindestens 80% dieser Fragen müssen beantwortet sein:**

#### Projekt-Kontext
- [ ] Was ist das Ziel des Projekts? (1-2 Sätze)
- [ ] Welches Problem wird gelöst?
- [ ] Gibt es eine bestehende Lösung die ersetzt wird?
- [ ] Warum wird die bestehende Lösung ersetzt?

#### Nutzer & Stakeholder
- [ ] Wer sind die Hauptnutzer?
- [ ] Wie viele Nutzer werden es sein?
- [ ] Technische Affinität der Nutzer (1-10)?
- [ ] Gibt es sekundäre Nutzer/Stakeholder?
- [ ] Wer trifft Entscheidungen im Projekt?

#### Kontext & Einschränkungen
- [ ] Budget-Rahmen definiert?
- [ ] Zeitrahmen/Deadline bekannt?
- [ ] Gibt es bestehende Infrastruktur die genutzt werden muss?
- [ ] Gibt es technische Einschränkungen?
- [ ] Compliance/Datenschutz-Anforderungen?

#### Erfolgskriterien
- [ ] Woran wird Erfolg gemessen?
- [ ] Was ist das Minimum Viable Product (MVP)?
- [ ] Was sind Nice-to-have Features?

**GATE-CHECK Phase 1:**
```
□ Projektziel klar definiert
□ Hauptnutzer identifiziert
□ Budget/Zeitrahmen bekannt
□ Erfolgskriterien definiert

→ Wenn ALLE Checkboxen ✓: Weiter zu Phase 2
→ Wenn NICHT alle ✓: NACHFRAGEN bis vollständig
```

---

### 2.2 Phase 2: Requirements

**Mindestens 90% dieser Fragen müssen beantwortet sein:**

#### Funktionale Anforderungen
- [ ] Alle Hauptfeatures aufgelistet?
- [ ] Features nach Priorität sortiert (Must/Should/Could/Won't)?
- [ ] Für jedes Must-Have Feature:
  - [ ] Beschreibung vorhanden?
  - [ ] Akzeptanzkriterien definiert?
  - [ ] Edge Cases bedacht?

#### Datenmodell
- [ ] Welche Entitäten gibt es? (z.B. User, Fahrzeug, Dokument)
- [ ] Welche Felder hat jede Entität?
- [ ] Wie hängen die Entitäten zusammen? (Relationen)
- [ ] Gibt es Pflichtfelder?
- [ ] Gibt es Validierungsregeln?

#### Benutzeroberfläche
- [ ] Welche Hauptseiten/Screens gibt es?
- [ ] Wie navigiert der Nutzer durch die App?
- [ ] Gibt es Vorbilder/Referenzen für das Design?
- [ ] Sprache der UI definiert?
- [ ] Mobile-Nutzung erforderlich?

#### Integrationen
- [ ] Muss die App mit externen Systemen kommunizieren?
- [ ] Welche APIs werden benötigt?
- [ ] Import/Export-Anforderungen?
- [ ] Automatisierungen gewünscht?

#### Authentifizierung & Autorisierung
- [ ] Wer darf auf die App zugreifen?
- [ ] Gibt es unterschiedliche Rollen/Berechtigungen?
- [ ] Wie erfolgt die Anmeldung?
- [ ] Session-Dauer/Timeout?

**GATE-CHECK Phase 2:**
```
□ Alle Must-Have Features definiert
□ Datenmodell vollständig
□ Hauptseiten identifiziert
□ Auth-Konzept klar

→ Wenn ALLE Checkboxen ✓: Weiter zu Phase 3
→ Wenn NICHT alle ✓: NACHFRAGEN bis vollständig
```

---

### 2.3 Phase 3: Technical

**Mindestens 90% dieser Fragen müssen beantwortet sein:**

#### Tech Stack
- [ ] Frontend-Framework festgelegt?
- [ ] Backend/API-Lösung festgelegt?
- [ ] Datenbank festgelegt?
- [ ] Hosting-Plattform festgelegt?
- [ ] Zusätzliche Services (Auth, Storage, etc.)?

#### Architektur
- [ ] Ordnerstruktur definiert?
- [ ] Komponenten-Architektur klar?
- [ ] State Management Ansatz?
- [ ] API-Design (REST, GraphQL, etc.)?

#### Development
- [ ] TypeScript ja/nein?
- [ ] Linting/Formatting Rules?
- [ ] Testing-Strategie?
- [ ] CI/CD Pipeline?

#### Deployment
- [ ] Deployment-Prozess definiert?
- [ ] Umgebungen (Dev, Staging, Prod)?
- [ ] Domain/URL bekannt?
- [ ] Backup-Strategie?

#### Sicherheit
- [ ] Authentifizierung-Methode?
- [ ] Datenverschlüsselung?
- [ ] Input-Validierung?
- [ ] Rate Limiting nötig?

**GATE-CHECK Phase 3:**
```
□ Tech Stack vollständig definiert
□ Architektur-Entscheidungen getroffen
□ Deployment-Strategie klar
□ Sicherheitskonzept vorhanden

→ Wenn ALLE Checkboxen ✓: Weiter zu Phase 4
→ Wenn NICHT alle ✓: NACHFRAGEN bis vollständig
```

---

### 2.4 Phase 4: Validation

**100% dieser Schritte müssen erfolgen:**

#### Zusammenfassung präsentieren
- [ ] Alle gesammelten Informationen zusammenfassen
- [ ] Dem Nutzer zur Bestätigung vorlegen
- [ ] Explizit fragen: "Stimmt diese Zusammenfassung?"

#### Lücken identifizieren
- [ ] Offene Fragen auflisten
- [ ] Annahmen transparent machen
- [ ] Risiken benennen

#### Finale Bestätigung
- [ ] Nutzer bestätigt: "Ja, das ist korrekt"
- [ ] ODER Nutzer korrigiert und Claude passt an
- [ ] Erst nach Bestätigung: Planungsphase verlassen

**GATE-CHECK Phase 4:**
```
□ Zusammenfassung präsentiert
□ Nutzer hat explizit bestätigt
□ Keine offenen kritischen Fragen

→ Wenn ALLE Checkboxen ✓: PLANUNGSPHASE ABGESCHLOSSEN
→ Wenn NICHT alle ✓: ZURÜCK zur relevanten Phase
```

---

## 3. NACHFRAGE-REGELN FÜR CLAUDE

### 3.1 Wann MUSS Claude nachfragen?

| Situation | Aktion |
|-----------|--------|
| Information fehlt komplett | SOFORT nachfragen |
| Information ist vage/unklar | Konkretisierung erfragen |
| Widersprüchliche Aussagen | Klärung erfragen |
| Annahme wäre nötig | Annahme nennen + bestätigen lassen |
| Kritische Entscheidung | Optionen präsentieren + wählen lassen |

### 3.2 Wie soll Claude nachfragen?

**Format für Nachfragen:**

```markdown
## Offene Fragen zu [Thema]

Bevor ich fortfahren kann, brauche ich Klarheit zu folgenden Punkten:

**1. [Konkrete Frage]**
- Kontext: [Warum ist das wichtig]
- Optionen (falls relevant): A, B, oder C

**2. [Konkrete Frage]**
- Kontext: [Warum ist das wichtig]

Bitte beantworte diese Fragen, damit ich fortfahren kann.
```

### 3.3 Nachfrage-Priorisierung

| Priorität | Typ | Beispiel |
|-----------|-----|----------|
| 🔴 Kritisch | Blockiert weitere Planung | "Wer sind die Nutzer?" |
| 🟡 Wichtig | Beeinflusst Architektur | "Wie viele Datensätze erwartet?" |
| 🟢 Nice-to-know | Verbessert Qualität | "Bevorzugte Farbpalette?" |

**Regel:** 🔴 Kritische Fragen MÜSSEN beantwortet werden vor Phasenwechsel.

---

## 4. VERBOTENE VERHALTENSWEISEN

### 4.1 Claude darf NIEMALS:

| Verboten | Stattdessen |
|----------|-------------|
| Annahmen treffen ohne Bestätigung | Fragen stellen |
| Vage Anforderungen akzeptieren | Konkretisierung fordern |
| Features erfinden | Nur bestätigte Features implementieren |
| Planungsphase überspringen | Alle Phasen durchlaufen |
| "Ich nehme an, dass..." | "Bitte bestätige: Ist es korrekt, dass...?" |
| Weitermachen bei Unklarheit | Stoppen und nachfragen |

### 4.2 Warnsignale für unvollständige Anforderungen

Claude soll AUFMERKSAM sein bei:

- "Irgendwie" / "So ungefähr" / "Kannst du dir ausdenken"
- "Das übliche halt" / "Standard"
- "Mach einfach" / "Du weißt schon"
- Fehlende Zahlen (Nutzeranzahl, Datenmenge, Budget)
- Fehlende Priorisierung
- Widersprüchliche Aussagen

**Bei diesen Warnsignalen:** IMMER nachfragen und konkretisieren.

---

## 5. PHASEN-ÜBERGANGS-PROTOKOLL

### 5.1 Vor jedem Phasenwechsel

Claude MUSS:

1. **Status-Check durchführen:**
```markdown
## Phase [X] Status-Check

✅ Erfüllt:
- [Liste der beantworteten Fragen]

❌ Noch offen:
- [Liste der unbeantworteten Fragen]

Bevor wir zu Phase [X+1] übergehen können, brauche ich noch:
1. [Offene Frage 1]
2. [Offene Frage 2]
```

2. **Explizite Erlaubnis einholen:**
```markdown
Darf ich mit Phase [X+1]: [Phasenname] fortfahren?
```

3. **Erst nach "Ja" weitermachen**

### 5.2 Bei Phasen-Rücksprung

Wenn neue Information alte Entscheidungen beeinflusst:

1. Transparent machen: "Diese neue Information ändert unsere Entscheidung zu [X]"
2. Zurück zur relevanten Phase
3. Entscheidung neu treffen
4. Wieder vorwärts arbeiten

---

## 6. QUALITÄTS-METRIKEN

### 6.1 Mindest-Anforderungen pro Projekt-Typ

| Projekt-Typ | Discovery | Requirements | Technical |
|-------------|-----------|--------------|-----------|
| Kleine App | 70% | 80% | 80% |
| Mittlere App | 80% | 90% | 90% |
| Große App | 90% | 95% | 95% |
| Enterprise | 95% | 98% | 98% |

### 6.2 Dokumentations-Anforderungen

| Phase | Mindest-Output |
|-------|----------------|
| Discovery | Problem Statement + Nutzer-Personas |
| Requirements | Feature-Liste + Datenmodell |
| Technical | Tech Stack + Architektur-Übersicht |
| Validation | Bestätigte Zusammenfassung |

---

## 7. BEISPIEL: VOLLSTÄNDIGER DURCHLAUF

### 7.1 Discovery-Fragen (Beispiel)

```markdown
## Discovery: Grundverständnis

Bevor ich mit der Planung beginne, brauche ich einige Informationen:

**Projektziel:**
1. Was soll die App tun? (1-2 Sätze)
2. Welches Problem löst sie?

**Nutzer:**
3. Wer wird die App nutzen?
4. Wie viele Nutzer erwartest du?
5. Wie technisch versiert sind die Nutzer? (1-10)

**Kontext:**
6. Gibt es ein bestehendes System das ersetzt wird?
7. Budget-Rahmen? (grob: <100€, 100-500€, >500€/Monat)
8. Zeitrahmen für die Fertigstellung?

**Erfolg:**
9. Woran erkennst du, dass die App erfolgreich ist?

Bitte beantworte diese Fragen so detailliert wie möglich.
```

### 7.2 Validation-Zusammenfassung (Beispiel)

```markdown
## Zusammenfassung zur Bestätigung

Basierend auf unserer Diskussion habe ich folgendes verstanden:

**Projekt:** Fuhrpark Management App
**Ziel:** Kostengünstiger Ersatz für Avrios

**Nutzer:**
- Hauptnutzerin: Fuhrpark-Verantwortliche (Tech-Affinität: 1/10)
- Sekundär: Geschäftsführung (nur Lesen)
- Authentifizierung: Geteilter Login

**Kernfeatures:**
1. Fahrzeugverwaltung mit Stammdaten
2. Dokumenten-Upload
3. Termin-/Kalender-System
4. Schadensmanagement
5. Kostenerfassung
6. CSV Import/Export

**Tech Stack:**
- Next.js + TypeScript
- Supabase (DB, Auth, Storage)
- Vercel Hosting
- ~$45-50/Monat

**Erfolgskriterien:**
- Keine verpassten TÜV-Termine
- Dokumente in <30 Sek findbar
- Nutzerin braucht keine Schulung

---

**Bitte bestätige:**
1. Ist diese Zusammenfassung korrekt?
2. Fehlt etwas Wichtiges?
3. Soll ich etwas ändern?

Erst nach deiner Bestätigung beginne ich mit dem PRD.
```

---

## 8. CHECKLISTE VOR VERLASSEN DER PLANUNGSPHASE

### Finale Prüfung

```markdown
## ✅ Planungsphase Abschluss-Check

### Discovery
- [ ] Projektziel dokumentiert
- [ ] Nutzer identifiziert und beschrieben
- [ ] Erfolgskriterien definiert
- [ ] Budget/Zeitrahmen bekannt

### Requirements
- [ ] Alle Must-Have Features gelistet
- [ ] Datenmodell vollständig
- [ ] UI-Konzept klar
- [ ] Auth-Konzept definiert

### Technical
- [ ] Tech Stack festgelegt
- [ ] Architektur beschrieben
- [ ] Deployment-Strategie klar
- [ ] Sicherheitskonzept vorhanden

### Validation
- [ ] Zusammenfassung präsentiert
- [ ] Nutzer hat bestätigt: "Ja, korrekt"
- [ ] Keine offenen kritischen Fragen

---

**ERGEBNIS:**
- Alle Checkboxen ✓ → Planungsphase abgeschlossen, PRD/Code kann erstellt werden
- Nicht alle ✓ → STOPP, zurück zu offenen Punkten
```

---

## 9. ANWENDUNGSHINWEISE

### 9.1 Für den Nutzer

1. **Sei so detailliert wie möglich** bei deinen Antworten
2. **Sag "Weiß ich nicht"** wenn du unsicher bist – besser als falsche Annahmen
3. **Fordere Nachfragen** wenn Claude zu schnell vorgeht
4. **Bestätige explizit** vor jedem Phasenwechsel

### 9.2 Für Claude

1. **Diese Regeln sind VERBINDLICH** – keine Ausnahmen
2. **Qualität vor Geschwindigkeit** – lieber mehr fragen als falsch implementieren
3. **Dokumentiere alle Annahmen** – transparent für den Nutzer
4. **Stoppe bei Unklarheit** – niemals raten

---

## 10. KURZREFERENZ

```
PLANUNGSPHASE-FLOW:

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   START                                                     │
│     │                                                       │
│     ▼                                                       │
│   ┌─────────────┐    Fragen offen?    ┌──────────────┐     │
│   │  DISCOVERY  │ ───────────────────►│  NACHFRAGEN  │     │
│   └─────────────┘        Ja           └──────┬───────┘     │
│         │                                    │              │
│         │ Nein (alle beantwortet)            │              │
│         ▼                                    │              │
│   ┌─────────────┐    Fragen offen?    ┌──────┴───────┐     │
│   │ REQUIREMENTS│ ───────────────────►│  NACHFRAGEN  │     │
│   └─────────────┘        Ja           └──────┬───────┘     │
│         │                                    │              │
│         │ Nein                               │              │
│         ▼                                    │              │
│   ┌─────────────┐    Fragen offen?    ┌──────┴───────┐     │
│   │  TECHNICAL  │ ───────────────────►│  NACHFRAGEN  │     │
│   └─────────────┘        Ja           └──────┬───────┘     │
│         │                                    │              │
│         │ Nein                               │              │
│         ▼                                    │              │
│   ┌─────────────┐    Nicht bestätigt  ┌──────┴───────┐     │
│   │ VALIDATION  │ ───────────────────►│ KORRIGIEREN  │     │
│   └─────────────┘                     └──────────────┘     │
│         │                                                   │
│         │ Bestätigt                                         │
│         ▼                                                   │
│   ┌─────────────┐                                          │
│   │    ENDE     │ → PRD/Code erstellen                     │
│   │ PLANUNGS-   │                                          │
│   │   PHASE     │                                          │
│   └─────────────┘                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘

REGEL: Kein Übergang ohne Vollständigkeit!
```

---

**DIESE PREREQUISITES SIND NICHT VERHANDELBAR.**

Erst wenn alle Phasen durchlaufen und bestätigt sind, darf die Planungsphase verlassen werden.
