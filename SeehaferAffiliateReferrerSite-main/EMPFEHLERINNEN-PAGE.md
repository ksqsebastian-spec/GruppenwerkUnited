# Claude Code Instructions — Empfehlerinnen Landing Page

> Statische Single-Screen-Seite. Kein Backend. Pure Vercel Deployment.

---

## 1. Projekt-Setup

```bash
npx create-next-app@latest empfehlerinnen-page --ts --tailwind --app --eslint --src-dir --no-import-alias
cd empfehlerinnen-page
```

**Vercel-ready:** Das Projekt wird als statische Next.js App deployed. Kein API-Route, kein Server-Side Rendering. Alles client-side.

```bash
# next.config.ts
output: 'export'
```

**Abhängigkeiten:**
```bash
npm install jspdf
```

Keine weiteren Dependencies. Kein CMS, kein Backend, kein Analytics (vorerst).

---

## 2. Design-System

### Farben

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
- **Kein Scrollen nötig:** Alles above the fold auf Desktop. Auf Mobile maximal 1x scrollen
- **Micro-Animationen:** Fade-in beim Laden (opacity 0→1, translateY 12px→0, duration 0.4s ease-out). Hover auf Buttons: translateY(-1px) + shadow-hover. Transition: 0.2s ease

### Design-Vorbild

Orientiere dich am Look von **fun-and-awe.io**: Warmer cremiger Hintergrund, Card-basierte Struktur, großzügiges Spacing, selbstbewusste Typografie. Clean, premium, tactile.

---

## 3. Seitenstruktur (Single Screen)

Die Seite besteht aus EINEM einzigen Screen mit diesen Elementen, vertikal gestapelt:

### 3.1 Header (kein Nav)

```
┌──────────────────────────────┐
│  SEEHAFER ELEMENTE           │  ← Logo-Text, 11px, uppercase, navy, letter-spacing 2px
│  Empfehlungsprogramm         │  ← 13px, text-muted
└──────────────────────────────┘
```

Kein Hamburger-Menü, keine Links. Nur Branding oben.

### 3.2 Headline + Subline

```
Empfiehl deinen Handwerker.
Verdiene mit.

Dein Kumpel braucht einen Tischler? Sag ihm Bescheid —
und verdiene eine Provision, wenn er den Auftrag erteilt.
```

- Headline: clamp(28px, 5vw, 42px), weight 800, navy. Zeilenumbruch nach "Handwerker."
- "Verdiene mit." in `--orange`
- Subline: 15px, text-muted, max-width 360px, zentriert

### 3.3 Dreischritt (horizontal auf Desktop, vertikal auf Mobile)

```
┌─────────┐    ┌─────────┐    ┌─────────┐
│ 1       │    │ 2       │    │ 3       │
│ Ausfüllen│ →  │ Senden  │ →  │ Verdienen│
│ Name +  │    │ Per Mail│    │Provision │
│ PayPal  │    │ oder PDF│    │bei Auftrag│
└─────────┘    └─────────┘    └─────────┘
```

- Drei kleine Cards nebeneinander (gap 12px)
- Nummer als großer Kreis (32px, navy bg, weiße Zahl)
- Title: 14px, weight 700
- Beschreibung: 12px, text-muted
- Pfeile zwischen den Karten (→) nur auf Desktop, versteckt auf Mobile

### 3.4 Formular-Card (Hauptelement)

```
┌──────────────────────────────────┐
│                                  │
│  Dein Name                       │  ← Label
│  ┌──────────────────────────┐    │
│  │ Lisa Schmidt             │    │  ← Input
│  └──────────────────────────┘    │
│                                  │
│  Deine E-Mail / PayPal           │  ← Label
│  ┌──────────────────────────┐    │
│  │ lisa.schmidt@gmail.com   │    │  ← Input
│  └──────────────────────────┘    │
│                                  │
│  ┌─ Dein Empfehlungsblock ─────┐ │
│  │ ——————————————               │ │  ← Generiert sich live
│  │ 📌 Empfehlung               │ │
│  │ Dieser Auftrag wurde        │ │
│  │ empfohlen von:              │ │
│  │ Lisa Schmidt                │ │
│  │ lisa.schmidt@gmail.com      │ │
│  │ Ref: #SEE-2026-XXXX        │ │
│  │ ——————————————               │ │
│  └─────────────────────────────┘ │
│                                  │
│  ┌──────────┐  ┌──────────────┐  │
│  │📧 Per    │  │📄 Als PDF   │  │  ← Zwei Buttons nebeneinander
│  │E-Mail    │  │herunterladen │  │
│  │senden    │  │              │  │
│  └──────────┘  └──────────────┘  │
│                                  │
│  🔒 Deine Daten werden nur für   │
│  die Provisions-Auszahlung       │
│  verwendet.                      │
│                                  │
└──────────────────────────────────┘
```

**WICHTIG — Formular-Logik:**

1. Inputs haben `onChange`-Handler, die den Empfehlungsblock in Echtzeit aktualisieren
2. Der **Ref-Code** wird automatisch generiert: `#SEE-{JAHR}-{4stelligeZufallszahl}` (z.B. `#SEE-2026-0317`)
3. Der Empfehlungsblock wird ERST sichtbar, sobald beide Felder ausgefüllt sind (mit Fade-in Animation)
4. **"Per E-Mail senden"** Button:
   - Ist ein `mailto:` Link (KEIN Backend!)
   - `mailto:?subject=Empfehlung Seehafer Elemente&body=...`
   - Der Body enthält eine freundliche Nachricht + den Empfehlungsblock
   - Das `mailto:` Feld ist LEER (kein Empfänger vorausgefüllt) — die Empfehlerin wählt selbst
   - URL-encode den Body korrekt (`encodeURIComponent`)
5. **"Als PDF"** Button:
   - Nutzt `jspdf` um ein einfaches PDF zu generieren
   - Inhalt: Seehafer Logo-Text oben, der Empfehlungsblock, kurze Anleitung unten
   - Download-Trigger via `document.createElement('a')` + `URL.createObjectURL`
   - Filename: `empfehlung-seehafer-{ref-code}.pdf`

### 3.5 Footer (minimal)

```
seehafer-elemente.de · Datenschutz
```

- 12px, text-muted, zentriert
- "Datenschutz" als Link zu seehafer-elemente.de/datenschutz (externer Link)
- Padding-bottom: 24px

---

## 4. Mobile Verhalten

- **Breakpoint:** 640px
- Unter 640px: Dreischritt vertikal statt horizontal, Pfeile versteckt
- Formular-Card geht full-width (padding 20px statt 32px)
- Buttons stacken vertikal statt nebeneinander unter 400px
- Der Gesamtcontainer hat padding: 16px statt 24px

---

## 5. Security & Privacy

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
- Der Empfehlungsblock wird als Template-Literal zusammengebaut, NICHT als HTML-String
- `encodeURIComponent()` für den mailto-Body
- Inputs werden vor dem Rendern gegen die Regex validiert

### Ref-Code Generierung

```typescript
function generateRefCode(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000); // 4-stellig
  return `#SEE-${year}-${rand}`;
}
```

- Der Code wird einmal beim Seitenaufruf generiert und im State gespeichert
- Bei jedem neuen Ausfüllen (wenn beide Felder leer → gefüllt) wird ein neuer Code generiert
- Der Code hat KEINEN kryptographischen Anspruch — er dient nur zur menschenlesbaren Zuordnung

### Cookies / Lokale Speicherung

- Optional: Die Seite kann Name + Email im `localStorage` speichern für wiederkehrende Empfehler
- MUSS: Cookie-Banner/Consent vor dem Speichern zeigen (DSGVO)
- Wenn kein Consent: Felder einfach leer lassen. Kein Tracking, kein Problem.

### Meta-Tags

```html
<meta name="robots" content="noindex, nofollow">
```

Die Empfehler-Seite soll NICHT in Suchmaschinen erscheinen. Sie wird nur über direkte Links (Flyer, QR, Instagram) erreicht.

---

## 6. Dateistruktur

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
│   ├── TemplateBlock.tsx ← Der generierte Empfehlungsblock
│   └── Footer.tsx        ← Minimal Footer
├── lib/
│   ├── generateRefCode.ts
│   ├── generateMailtoLink.ts
│   └── generatePDF.ts    ← jspdf Logik
└── types/
    └── index.ts           ← ReferralData Interface
```

---

## 7. Performance-Ziele

- **Lighthouse Score:** 95+ auf allen Kategorien
- **First Contentful Paint:** < 1s
- **Total Bundle Size:** < 50KB gzipped (ohne jspdf)
- **jspdf:** Lazy-loaded — wird erst geladen wenn der PDF-Button geklickt wird (`dynamic import`)
- **Keine externen API-Calls**, keine Bilder (nur CSS/SVG)
- **Inter Font:** Nur Weights 400, 600, 800 laden. `display: swap`

---

## 8. Deployment

```bash
# Vercel CLI
npx vercel --prod
```

**Environment:** Keine ENV-Variablen nötig. Kein Backend.

**Domain:** `empfehlen.seehafer-elemente.de` (Subdomain) oder eigene Domain.

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

## 9. Mailto-Template (exakter Inhalt)

Der "Per E-Mail senden" Button generiert diesen mailto-Link:

```
mailto:?subject=Empfehlung%20%E2%80%93%20Seehafer%20Elemente&body=...
```

**Body (URL-encoded):**

```
Hey!

Ich hab dir Seehafer Elemente empfohlen — die machen richtig gute Tischlerarbeiten.

Falls du Interesse hast, schreib denen einfach ne Mail an info@seehafer-elemente.de und häng den Block hier unten in deine Anfrage mit rein. Dann wissen die Bescheid.

———————————
📌 Empfehlung
Dieser Auftrag wurde
empfohlen von:
{Name}
{Email}
Ref: {RefCode}
———————————

Viele Grüße!
```

**WICHTIG:** Die Empfänger-Adresse (`mailto:`) bleibt LEER. Die Empfehlerin trägt selbst ein, an wen sie die Mail schickt.

---

## 10. PDF-Inhalt (jspdf)

Das generierte PDF enthält:

```
┌──────────────────────────────┐
│  SEEHAFER ELEMENTE           │
│  Empfehlungsprogramm         │
│                              │
│  ─────────────────────       │
│  📌 Empfehlung               │
│  Dieser Auftrag wurde        │
│  empfohlen von:              │
│  {Name}                      │
│  {Email}                     │
│  Ref: {RefCode}              │
│  ─────────────────────       │
│                              │
│  ────────────────────────    │
│  Anleitung:                  │
│  Kopiere den Block oben      │
│  in deine Anfrage-Mail an    │
│  info@seehafer-elemente.de   │
│  ────────────────────────    │
│                              │
│  empfehlen.seehafer-elemente.de │
└──────────────────────────────┘
```

- Format: A5 (halbe Seite, kompakt)
- Font: Helvetica (in jspdf eingebaut, kein Extra-Font nötig)
- Keine Bilder, kein Logo-File

---

## 11. Zusammenfassung

| Aspekt | Entscheidung |
|--------|-------------|
| Framework | Next.js 15 (App Router, Static Export) |
| Styling | Tailwind CSS |
| PDF | jspdf (lazy-loaded) |
| Backend | Keins |
| Auth | Keine |
| Datenbank | Keine |
| Tracking | Keins (vorerst) |
| SEO | noindex, nofollow |
| Deployment | Vercel (Free Tier reicht) |
| Domain | Subdomain von seehafer-elemente.de |
