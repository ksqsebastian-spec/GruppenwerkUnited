# Werkbank — Zugangsdaten & Umgebungsvariablen

**VERTRAULICH — Nicht in Git einchecken!**

---

## Passwörter pro Firma

| Firma | Env-Variable | Passwort |
|-------|-------------|----------|
| Admin (alles) | `ADMIN_PASSWORD` | `Wbk-Admin-2024!` |
| Tischlerei Seehafer | `SEEHAFER_PASSWORD` | `See-Haf-2024!` |
| Tischlerei Brink | `BRINK_PASSWORD` | `Brk-Tschl-2024!` |
| Malerei Hantke | `HANTKE_PASSWORD` | `Han-Mal-2024!` |
| Gruppenwerk | `GRUPPENWERK_PASSWORD` | `GW-Fhrpk-2024!` |

---

## Vercel Umgebungsvariablen

In Vercel → Project → Settings → Environment Variables eintragen:

```
SESSION_SECRET=<64-Zeichen-Zufallsstring — selbst generieren>
ADMIN_PASSWORD=Wbk-Admin-2024!
SEEHAFER_PASSWORD=See-Haf-2024!
BRINK_PASSWORD=Brk-Tschl-2024!
HANTKE_PASSWORD=Han-Mal-2024!
GRUPPENWERK_PASSWORD=GW-Fhrpk-2024!
NEXT_PUBLIC_SUPABASE_URL=https://ldmprzkregyicxgdbfsa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Anon Key aus Supabase Dashboard>
SUPABASE_SERVICE_ROLE_KEY=<Service Role Key aus Supabase Dashboard>
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
| Admin | Alles (Fuhrpark, Recruiting, Affiliate, ROI, VOB) |
| Tischlerei Seehafer | Recruiting, Affiliate, ROI |
| Tischlerei Brink | Affiliate, Recruiting, ROI |
| Malerei Hantke | Recruiting, Affiliate, ROI |
| Gruppenwerk | Fuhrpark |

---

## Hinweise

- Passwörter bitte sofort nach Erhalt in eigene sichere Verwaltung (z.B. Bitwarden) übertragen
- SESSION_SECRET muss pro Deployment eindeutig sein — bei Änderung werden alle aktiven Sessions ungültig
- Supabase Keys: Settings → API in Supabase Dashboard
