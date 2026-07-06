# Deployment auf Cloudflare Workers

Diese Anleitung beschreibt den Betrieb der Werkbank-App auf **Cloudflare Workers**
(Umzug von Coolify/Hetzner). Das **Supabase-Backend bleibt unverändert** — es wird
weiterhin per HTTPS angesprochen.

Die App läuft über den **OpenNext-Adapter** (`@opennextjs/cloudflare`), der Next.js 16
für die Workers-Runtime (`workerd`) bündelt. Alle API-Routen, die Middleware und die
Bildoptimierung funktionieren wie gehabt.

---

## 1. Voraussetzungen

| Punkt | Hinweis |
|-------|---------|
| Cloudflare-Konto | Kostenlos erstellbar auf cloudflare.com |
| **Workers Paid Plan (5 $/Monat)** | **Erforderlich.** Der gebündelte Worker ist ~4,8 MiB (gzip). Das Free-Limit liegt bei 3 MiB, das Paid-Limit bei 10 MiB. |
| Node.js ≥ 22 | Wie bisher (siehe `.node-version`) |
| Wrangler CLI | Als Dev-Abhängigkeit installiert (`npx wrangler ...`) |

Einmalig anmelden:

```bash
npx wrangler login
```

---

## 2. Umgebungsvariablen

Es gibt **zwei Kategorien**, die an unterschiedlichen Stellen gesetzt werden:

### a) Build-Zeit (öffentlich, `NEXT_PUBLIC_*`)

Diese werden beim `next build` fest in den Client-Code kompiliert. Sie müssen als
**Build-Variablen** vorliegen (in der Cloudflare-Build-Umgebung bzw. in der lokalen
Shell beim `npm run deploy`):

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_APP_URL          # z.B. https://werkbank.gruppenwerk.de
```

`NEXT_PUBLIC_APP_URL` ist zusätzlich in `wrangler.jsonc` unter `vars` hinterlegt,
damit der Cron-Handler zur Laufzeit die richtige Basis-URL kennt.

### b) Laufzeit-Geheimnisse (nur Server)

Diese dürfen **nicht** ins Repository und werden als **Worker-Secrets** gesetzt.
OpenNext stellt sie zur Laufzeit als `process.env.*` bereit.

```bash
npx wrangler secret put SESSION_SECRET
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put CRON_SECRET
npx wrangler secret put SUPABASE_WEBHOOK_SECRET   # falls Supabase-Webhooks genutzt werden

# Firmen-Passwörter:
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put APP_PASSWORD
npx wrangler secret put SEEHAFER_PASSWORD
npx wrangler secret put BRINK_PASSWORD
npx wrangler secret put HANTKE_PASSWORD
npx wrangler secret put GRUPPENWERK_PASSWORD
npx wrangler secret put WERNER_PASSWORD
npx wrangler secret put WERNER_BAU_PASSWORD
npx wrangler secret put MEHLIG_PASSWORD
```

> Werte siehe `CREDENTIALS.md`. `SESSION_SECRET` muss pro Deployment eindeutig sein —
> bei Änderung werden alle aktiven Sessions ungültig.

Alternativ lassen sich alle Secrets im Dashboard unter
**Workers & Pages → werkbank → Settings → Variables and Secrets** eintragen.

---

## 3. Lokale Vorschau (Workers-Runtime)

`npm run dev` nutzt weiterhin den normalen Next-Dev-Server. Um die App **so wie in
Produktion** (im `workerd`-Runtime) zu testen:

```bash
npm run preview
```

Das baut die App mit OpenNext und startet sie via `wrangler dev`.

---

## 4. Deployment

### Manuell (von der Kommandozeile)

```bash
# Build-Variablen bereitstellen (z.B. via .env oder exportieren), dann:
npm run deploy
```

`npm run deploy` führt `opennextjs-cloudflare build && opennextjs-cloudflare deploy`
aus — baut also und lädt den Worker hoch.

### Automatisch (empfohlen): Cloudflare Workers Builds

1. Im Dashboard **Workers & Pages → Create → Connect to Git** das Repository und den
   Branch `main` verbinden.
2. Build-Befehl: `npx opennextjs-cloudflare build`
   Deploy-Befehl: `npx opennextjs-cloudflare deploy`
3. Die `NEXT_PUBLIC_*`-Build-Variablen in den Build-Einstellungen hinterlegen.

Danach löst jeder Push auf `main` automatisch ein Deployment aus — kein separater
CI-Schritt nötig. Optional liegt zusätzlich ein manuell auslösbarer GitHub-Actions-
Workflow unter `.github/workflows/deploy-cloudflare.yml` bereit (benötigt die Secrets
`CLOUDFLARE_API_TOKEN` und `CLOUDFLARE_ACCOUNT_ID`).

---

## 5. Cron-Job

Der frühere Vercel-Cron (`vercel.json`) wurde durch einen **Cloudflare Cron Trigger**
ersetzt:

- **Zeitplan:** täglich 07:00 UTC (`wrangler.jsonc` → `triggers.crons`).
- **Ablauf:** Der `scheduled`-Handler in `custom-worker.ts` ruft intern
  `/api/cron/appointments` mit dem `CRON_SECRET` auf.

Damit die Cron-Route funktioniert, muss `CRON_SECRET` als Worker-Secret gesetzt sein
(siehe oben). Der Cron läuft nach dem Deploy automatisch — keine weitere Einrichtung.

Lokaler Test des Handlers:

```bash
# Während `npm run preview` läuft:
curl "http://localhost:8787/cdn-cgi/handler/scheduled"
```

---

## 6. Domain / DNS-Umstellung von Coolify

1. Deployment auf `*.workers.dev` verifizieren (App lädt, Login funktioniert).
2. In `wrangler.jsonc` eine **Custom Domain** ergänzen bzw. im Dashboard unter
   **Settings → Domains & Routes → Add Custom Domain** `werkbank.gruppenwerk.de`
   hinzufügen.
3. Erst danach den DNS-Eintrag von der Hetzner-/Coolify-IP auf Cloudflare umstellen
   (bei bereits über Cloudflare verwalteter Domain geschieht das automatisch über die
   Custom-Domain-Zuordnung).
4. Coolify-Deployment erst abschalten, wenn die Cloudflare-Version stabil läuft.

---

## 7. Zu beachten (Verhaltensänderungen)

- **Rate-Limiter (`lib/rate-limit.ts`)**: Der In-Memory-Limiter gilt pro Worker-Isolate
  und ist damit weniger streng als auf einem einzelnen Coolify-Prozess. Für robustes
  Rate-Limiting später auf Cloudflare KV, Durable Objects oder das native Rate-Limiting
  umstellen.
- **Worker-Größe**: Aktuell ~4,8 MiB (gzip) von 10 MiB. Beim Hinzufügen weiterer schwerer
  Server-Bibliotheken die Größe im Blick behalten (`npx wrangler deploy --dry-run`).
- **`VERCEL_URL`** in `lib/api-guards.ts` ist auf Cloudflare nicht gesetzt — die
  Origin-Prüfung nutzt `NEXT_PUBLIC_APP_URL`, das korrekt konfiguriert sein muss.

---

## 8. Rollback

Cloudflare hält frühere Versionen vor: Dashboard → **werkbank → Deployments →
Rollback**. Alternativ Coolify (falls noch aktiv) wieder als DNS-Ziel setzen.
