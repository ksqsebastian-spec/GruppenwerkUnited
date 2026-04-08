# Claude Code Instructions — Recruiting-Empfehlungsseite (Referer Page)

> Statische Single-Page-Seite. Kein Backend. Pure Vercel Deployment.
> Zweck: Jeder kann potenzielle Mitarbeiter an Seehafer Elemente empfehlen und erhält 1.000 € Prämie nach bestandener Probezeit.

---

## 1. Projekt-Setup

```bash
npx create-next-app@latest seehafer-recruiting-referer --ts --tailwind --app --eslint --src-dir --no-import-alias
cd seehafer-recruiting-referer
```

**Vercel-ready:** Statische Next.js App. Kein API-Route, kein SSR. Alles client-side.

```typescript
// next.config.ts
output: 'export'
```

**Abhängigkeiten:**
```bash
npm install jspdf
```

Keine weiteren Dependencies. Kein CMS, kein Backend, kein Analytics (vorerst).

---

## 2. Design-System

### Farben (IDENTISCH mit Affiliate-Seite)

```css
:root {
  --bg:             #FBFAF5;   /* Warmes Off-White (Haupthintergrund) */
  --bg-card:        #FFFFFF;   /* Karten-Weiß */
  --navy:           #050234;   /* Primärfarbe Text/Headings */
  --navy-light:     #062592;   /* Sekundär Navy */
  --orange:         #F28900;   /* CTA + Akzent */
  --orange-hover:   #E07E00;   /* Button Hover */
  --orange-bg:      #FFF7ED;   /* Leichter Orange-Hintergrund */
  --text:           #1A1A2E;   /* Body Text */
  --text-muted:     #8A8A9A;   /* Sekundärer Text */
  --border:         #EBE9E3;   /* Subtile Grenzen */
  --green:          #16A34A;   /* Erfolg */
  --radius:         16px;      /* Card Radius */
  --radius-sm:      10px;      /* Kleine Elemente */
  --shadow-card:    0 2px 12px rgba(5,2,52,.06);
  --shadow-hover:   0 8px 24px rgba(5,2,52,.10);
}
```

### Typografie

- **Font:** `Inter` via Google Fonts (Weights: 400, 500, 600, 700, 800)
- **Rendering:** `-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;`
- **Hero Headline:** `clamp(28px, 5vw, 42px)`, weight 800, color `--navy`
- **Body:** 15px/1.6, weight 400, color `--text`
- **Labels:** 12px, weight 600, uppercase, letter-spacing 1px
- **Spacing:** Großzügig. Minimum 24px zwischen Elementen, 48px zwischen Sektionen

### Layout-Prinzipien

- **Hintergrund:** `--bg` (#FBFAF5) auf `<body>`
- **Cards:** Weißer Hintergrund, `border-radius: var(--radius)`, `box-shadow: var(--shadow-card)`, Padding 32px
- **Max-Width:** 480px für den Hauptcontainer (mobile-first, zentriert)
- **Kein Scrollen nötig:** Alles above the fold auf Desktop. Auf Mobile maximal 1–2x scrollen
- **Micro-Animationen:** Fade-in beim Laden (opacity 0→1, translateY 12px→0, duration 0.4s ease-out). Hover auf Buttons: translateY(-1px) + shadow-hover. Transition: 0.2s ease

### Design-Vorbild

Orientiere dich am Look von **fun-and-awe.io**: Warmer cremiger Hintergrund, Card-basierte Struktur, großzügiges Spacing, selbstbewusste Typografie. Clean, premium, tactile.

---

## 3. Kontext & Zweck

Diese Seite ist die **öffentliche Empfehlungsseite** des Fachkräfte-Empfehlungsprogramms von Seehafer Elemente. Jeder (Mitarbeiter, Freunde, Familie, Bekannte — NICHT nur interne) kann hier eine Person empfehlen, die bei Seehafer arbeiten könnte.

**Flow:**
1. Empfehler füllt Formular aus (eigene Daten + Name des Empfohlenen)
2. Ein Ref-Code wird generiert: `#SEE-REC-{YEAR}-{4digits}`
3. Ein Text-Template wird angezeigt (Copy-to-Clipboard), das der Empfehler an den Kandidaten weiterleitet
4. Optional: PDF-Empfehlungskarte zum Download
5. Der Kandidat bewirbt sich bei Seehafer mit dem Ref-Code
6. Nach Einstellung + bestandener Probezeit → 1.000 € Prämie für den Empfehler

**WICHTIG:** Die Seite hat KEIN Backend. Sie generiert nur ein Template + PDF. Die Empfehlung wird NICHT automatisch in ein System eingetragen. Der Admin trägt sie manuell ein, wenn sich der Kandidat bewirbt.

---

## 4. Seitenstruktur (Single Page)

### 4.1 Header (kein Nav)

```
┌──────────────────────────────┐
│  SEEHAFER ELEMENTE           │  ← Logo-Text, 11px, uppercase, navy, letter-spacing 2px
│  Fachkräfte-Empfehlung       │  ← 13px, text-muted
└──────────────────────────────┘
```

Kein Hamburger-Menü, keine Links. Nur Branding oben.

### 4.2 Headline + Subline

```
Kenn jemanden, der anpackt?
Sag Bescheid — und verdien 1.000 €.

Du kennst jemanden, der als Tischler, Monteur oder Helfer
richtig gut wäre? Empfiehl die Person an uns weiter — wenn
sie eingestellt wird und die Probezeit besteht, zahlen wir
dir 1.000 € Prämie.
```

- Headline: clamp(28px, 5vw, 42px), weight 800, navy
- "1.000 €" in `--orange`
- Subline: 15px, text-muted, max-width 380px, zentriert

### 4.3 Dreischritt (horizontal auf Desktop, vertikal auf Mobile)

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│ 1        │    │ 2        │    │ 3        │
│ Ausfüllen│ →  │Weiter-   │ →  │Prämie    │
│ Deine    │    │ leiten   │    │kassieren │
│ Daten +  │    │ Text an  │    │1.000€ nach│
│ Name     │    │ Kandidat │    │Probezeit │
└──────────┘    └──────────┘    └──────────┘
```

- Drei kleine Cards nebeneinander (gap 12px)
- Nummer als großer Kreis (32px, navy bg, weiße Zahl)
- Title: 14px, weight 700
- Beschreibung: 12px, text-muted
- Pfeile zwischen den Karten (→) nur auf Desktop, versteckt auf Mobile

### 4.4 Formular-Card (Hauptelement)

```
┌──────────────────────────────────┐
│                                  │
│  Dein Name                       │  ← Label
│  ┌──────────────────────────┐    │
│  │ Lisa Schmidt             │    │  ← Input
│  └──────────────────────────┘    │
│                                  │
│  Deine E-Mail                    │  ← Label
│  ┌──────────────────────────┐    │
│  │ lisa.schmidt@gmail.com   │    │  ← Input
│  └──────────────────────────┘    │
│                                  │
│  Wen empfiehlst du?              │  ← Label
│  ┌──────────────────────────┐    │
│  │ Tim Wagner               │    │  ← Input (Name des Empfohlenen)
│  └──────────────────────────┘    │
│                                  │
│  ┌─ Dein Empfehlungs-Text ────┐  │
│  │ ──────────────────         │  │  ← Generiert sich live
│  │ 👋 Empfehlung für          │  │
│  │ Seehafer Elemente          │  │
│  │                             │  │
│  │ Hey Tim,                    │  │
│  │ ich hab dich bei Seehafer  │  │
│  │ Elemente empfohlen.        │  │
│  │ Falls du Interesse hast... │  │
│  │                             │  │
│  │ Ref: #SEE-REC-2026-XXXX   │  │
│  │ Empfohlen von: Lisa Schmidt│  │
│  │ ──────────────────         │  │
│  └─────────────────────────────┘  │
│                                  │
│  ┌──────────┐  ┌──────────────┐  │
│  │📋 Text   │  │📄 Als PDF   │  │  ← Zwei Buttons nebeneinander
│  │kopieren  │  │herunterladen │  │
│  └──────────┘  └──────────────┘  │
│                                  │
│  🔒 Deine Daten werden nur für   │
│  die Prämien-Auszahlung          │
│  verwendet.                      │
│                                  │
└──────────────────────────────────┘
```

**WICHTIG — Formular-Logik:**

1. Inputs haben `onChange`-Handler, die den Empfehlungs-Text in Echtzeit aktualisieren
2. Der **Ref-Code** wird automatisch generiert: `#SEE-REC-{JAHR}-{4stelligeZufallszahl}` (z.B. `#SEE-REC-2026-4817`)
3. Der Empfehlungs-Text wird ERST sichtbar, sobald alle drei Felder ausgefüllt sind (mit Fade-in Animation)
4. **"Text kopieren"** Button:
   - Nutzt `navigator.clipboard.writeText()` um den gesamten Text in die Zwischenablage zu kopieren
   - Button-Text wechselt nach Klick zu "✓ Kopiert!" (für 2 Sekunden, dann zurück)
   - Fallback für ältere Browser: `document.execCommand('copy')` mit temporärem Textarea
5. **"Als PDF"** Button:
   - Nutzt `jspdf` um eine Empfehlungskarte zu generieren
   - Inhalt: Seehafer Logo-Text, Empfehlungstext, Ref-Code, Anleitung
   - Download-Trigger via `document.createElement('a')` + `URL.createObjectURL`
   - Filename: `empfehlung-seehafer-recruiting-{ref-code}.pdf`

### 4.5 Stellen-Link

```
┌──────────────────────────────────┐
│                                  │
│  💼 Offene Stellen ansehen       │  ← Link-Card
│  seehafer-elemente.de/karriere   │
│  →                               │
│                                  │
└──────────────────────────────────┘
```

- Card mit Border-Left 3px solid --orange
- Link öffnet `https://seehafer-elemente.de/karriere` in neuem Tab (`target="_blank"`, `rel="noopener noreferrer"`)
- Untertitel: "Schau dir an, welche Positionen gerade gesucht werden"

### 4.6 Footer (minimal)

```
seehafer-elemente.de · Datenschutz
```

- 12px, text-muted, zentriert
- "Datenschutz" als Link zu seehafer-elemente.de/datenschutz (externer Link)
- Padding-bottom: 24px

---

## 5. Empfehlungs-Text Template (Copy-to-Clipboard)

Der generierte Text, der in die Zwischenablage kopiert wird:

```
Hey {Name-Empfohlener}!

Ich hab dich bei Seehafer Elemente empfohlen — die suchen aktuell Verstärkung im Team (Tischler, Monteure, Helfer und mehr).

Falls du Interesse hast, schau dir die offenen Stellen an:
👉 https://seehafer-elemente.de/karriere

Wenn du dich bewirbst, häng bitte diesen Block unten in deine Bewerbungsmail an info@seehafer-elemente.de mit rein — dann wissen die Bescheid, dass ich dich empfohlen hab.

———————————
📌 Fachkräfte-Empfehlung
Empfohlen von: {Empfehler-Name}
Kontakt: {Empfehler-Email}
Ref: {RefCode}
———————————

Viele Grüße!
```

**WICHTIG:** Der Text wird an den EMPFOHLENEN (Kandidaten) geschickt — nicht an Seehafer. Der Kandidat entscheidet selbst, ob er sich bewirbt.

---

## 6. PDF-Inhalt (jspdf)

Das generierte PDF (Empfehlungskarte) enthält:

```
┌──────────────────────────────┐
│  SEEHAFER ELEMENTE           │
│  Fachkräfte-Empfehlung       │
│                              │
│  ─────────────────────       │
│  📌 Empfehlung               │
│  Empfohlen von:              │
│  {Empfehler-Name}            │
│  {Empfehler-Email}           │
│  Ref: {RefCode}              │
│                              │
│  Empfohlene Person:          │
│  {Name-Empfohlener}          │
│  ─────────────────────       │
│                              │
│  ────────────────────────    │
│  Anleitung:                  │
│  Kopiere den Block oben      │
│  in deine Bewerbungsmail an  │
│  info@seehafer-elemente.de   │
│                              │
│  Offene Stellen:             │
│  seehafer-elemente.de/karriere│
│  ────────────────────────    │
│                              │
└──────────────────────────────┘
```

- Format: A5 (halbe Seite, kompakt)
- Font: Helvetica (in jspdf eingebaut, kein Extra-Font nötig)
- Keine Bilder, kein Logo-File

---

## 7. Mobile Verhalten

- **Breakpoint:** 640px
- Unter 640px: Dreischritt vertikal statt horizontal, Pfeile versteckt
- Formular-Card geht full-width (padding 20px statt 32px)
- Buttons stacken vertikal statt nebeneinander unter 400px
- Der Gesamtcontainer hat padding: 16px statt 24px

---

## 8. Security & Privacy

### Input Validation

```typescript
// Name: Nur Buchstaben, Leerzeichen, Bindestriche. Max 80 Zeichen.
const nameRegex = /^[a-zA-ZäöüÄÖÜßéèêàáâ\s\-]{1,80}$/;

// Email: Standard Email-Validierung. Max 120 Zeichen.
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
```

### XSS-Schutz

- Alle User-Eingaben werden ausschließlich über React JSX gerendert (automatisches Escaping durch React)
- Kein innerHTML, kein DOM-Manipulation mit User-Daten
- Der Empfehlungs-Text wird als Template-Literal zusammengebaut, NICHT als HTML-String
- Inputs werden vor dem Rendern gegen die Regex validiert
- `navigator.clipboard.writeText()` ist XSS-safe (schreibt nur Plain-Text)

### Ref-Code Generierung

```typescript
function generateRefCode(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000); // 4-stellig
  return `#SEE-REC-${year}-${rand}`;
}
```

- Der Code wird einmal beim Seitenaufruf generiert und im State gespeichert
- Bei jedem neuen Ausfüllen (wenn alle drei Felder leer → gefüllt) wird ein neuer Code generiert
- Der Code hat KEINEN kryptographischen Anspruch — er dient nur zur menschenlesbaren Zuordnung

### Cookies / Lokale Speicherung

- **Keine lokale Speicherung** im Prototyp
- Kein localStorage, kein Cookie-Banner nötig
- Kein Tracking, kein Analytics

### Meta-Tags

```html
<meta name="robots" content="noindex, nofollow">
```

Die Empfehlungsseite soll NICHT in Suchmaschinen erscheinen. Sie wird nur über direkte Links (QR-Code, Instagram, WhatsApp, Flyer) erreicht.

---

## 9. Dateistruktur

```
src/
├── app/
│   ├── layout.tsx        ← Global Layout, Inter Font, Meta Tags
│   ├── page.tsx          ← Die einzige Seite
│   └── globals.css       ← CSS Variables, Body Styles, Animationen
├── components/
│   ├── Header.tsx        ← Logo + Branding
│   ├── HeroSection.tsx   ← Headline + Subline
│   ├── StepCards.tsx     ← Dreischritt (1-2-3)
│   ├── ReferralForm.tsx  ← Das Formular mit Template-Generator
│   ├── TemplateBlock.tsx ← Der generierte Empfehlungs-Text
│   ├── JobLink.tsx       ← Stellen-Link Card
│   └── Footer.tsx        ← Minimal Footer
├── lib/
│   ├── generateRefCode.ts
│   ├── copyToClipboard.ts  ← Clipboard-Logik mit Fallback
│   └── generatePDF.ts      ← jspdf Logik
└── types/
    └── index.ts             ← ReferralData Interface
```

---

## 10. Performance-Ziele

- **Lighthouse Score:** 95+ auf allen Kategorien
- **First Contentful Paint:** < 1s
- **Total Bundle Size:** < 50KB gzipped (ohne jspdf)
- **jspdf:** Lazy-loaded — wird erst geladen wenn der PDF-Button geklickt wird (`dynamic import`)
- **Keine externen API-Calls**, keine Bilder (nur CSS/SVG)
- **Inter Font:** Nur Weights 400, 600, 800 laden. `display: swap`

---

## 11. Deployment

```bash
# Vercel CLI
npx vercel --prod
```

**Environment:** Keine ENV-Variablen nötig. Kein Backend.

**Domain:** Wird später konfiguriert. Erstmal Vercel-Default-URL.

**Headers (next.config.ts):**
```typescript
headers: async () => [
  {
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ],
  },
],
```

---

## 12. Zusammenfassung

| Aspekt | Entscheidung |
|--------|-------------|
| Framework | Next.js 15 (App Router, Static Export) |
| Styling | Tailwind CSS |
| PDF | jspdf (lazy-loaded) |
| Template-Ausgabe | Copy-to-Clipboard (Plain Text) |
| Backend | Keins |
| Auth | Keine |
| Datenbank | Keine |
| Tracking | Keins (vorerst) |
| SEO | noindex, nofollow |
| Deployment | Vercel |
| Domain | Wird später konfiguriert |
| Ref-Code Format | #SEE-REC-{YEAR}-{4digits} |
| Prämie | 1.000 € (Info auf der Seite, Verwaltung im Admin) |
| Stellen-Link | seehafer-elemente.de/karriere |
