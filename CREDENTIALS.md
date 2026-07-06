# Werkbank — Zugangsdaten & Umgebungsvariablen

**VERTRAULICH — Nicht in Git einchecken!**

---

## Passwörter pro Firma

| Firma | Env-Variable | Passwort |
|-------|-------------|----------|
| Admin (alles) | `ADMIN_PASSWORD` | `Wbk-Admin-2024!` |
| Seehafer Elemente | `SEEHAFER_PASSWORD` | `See-Haf-2024!` |
| Tischlerei Brink | `BRINK_PASSWORD` | `Brk-Tschl-2024!` |
| Malerei Hantke | `HANTKE_PASSWORD` | `Han-Mal-2024!` |
| Gruppenwerk | `GRUPPENWERK_PASSWORD` | `GW-Fhrpk-2024!` |
| Werner Gerüstbau | `WERNER_PASSWORD` | *(in DB gesetzt)* |
| Werner Bau | `WERNER_BAU_PASSWORD` | `Wrn-Bau-2024!` *(in DB gesetzt)* |
| Tischlerei Mehlig | `MEHLIG_PASSWORD` | *(in DB gesetzt)* |

---

## Cloudflare Workers Umgebungsvariablen

Deployment-Details siehe `DEPLOYMENT_CLOUDFLARE.md`.

**Laufzeit-Geheimnisse** per `wrangler secret put <NAME>` oder im Dashboard
(Workers & Pages → werkbank → Settings → Variables and Secrets) setzen:

```
SESSION_SECRET=<64-Zeichen-Zufallsstring — selbst generieren>
CRON_SECRET=<Zufallsstring — selbst generieren>
SUPABASE_SERVICE_ROLE_KEY=<Service Role Key aus Supabase Dashboard>
ADMIN_PASSWORD=Wbk-Admin-2024!
SEEHAFER_PASSWORD=See-Haf-2024!
BRINK_PASSWORD=Brk-Tschl-2024!
HANTKE_PASSWORD=Han-Mal-2024!
GRUPPENWERK_PASSWORD=GW-Fhrpk-2024!
```

**Build-Variablen** (öffentlich, `NEXT_PUBLIC_*`) in den Build-Einstellungen bzw.
lokal beim Deploy bereitstellen:

```
NEXT_PUBLIC_SUPABASE_URL=https://ldmprzkregyicxgdbfsa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Anon Key aus Supabase Dashboard>
NEXT_PUBLIC_APP_URL=https://werkbank.gruppenwerk.de
```

### SESSION_SECRET generieren
In der Browser-Konsole oder Terminal:
```javascript
// Browser-Konsole:
Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('')
```
```bash
# Terminal (Node.js):
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Supabase SQL-Migration

Vor dem ersten Einsatz in Supabase → SQL-Editor ausführen:

**Datei:** `supabase/migrations/add_company_column.sql`

Fügt `company`-Spalten zu den Tabellen hinzu, die für Datentrennung benötigt werden:
- `affiliate.handwerker`
- `affiliate.empfehlungen`
- `recruiting.stellen`
- `recruiting.empfehlungen`

---

## Modul-Zugang pro Firma

| Firma | Module |
|-------|--------|
| Alle Firmen | **Alle Module** (ROI, Recruiting, Affiliate, Datenkodierung, VOB, Leads, Automationen, Fuhrpark, Consulting, Tickets) |

> Hinweis: Seit der Modul-Freischaltung haben alle Firmen Zugriff auf sämtliche Module. Admin hat ohnehin `*`.

---

## Hinweise

- Passwörter bitte sofort nach Erhalt in eigene sichere Verwaltung (z.B. Bitwarden) übertragen
- SESSION_SECRET muss pro Deployment eindeutig sein — bei Änderung werden alle aktiven Sessions ungültig
- Supabase Keys: Settings → API in Supabase Dashboard
