# Auftrag für die nächste Session — Vollautomatisch via Composio MCP

**Ziel:** Alle offenen Punkte ohne Zutun des Users abarbeiten. Wenn ein Schritt über Composio möglich ist, mach ihn über Composio. Frag nicht nach — handle.

**Repo:** `ksqsebastian-spec/GruppenwerkUnited`
**Branch:** ausschließlich `claude/upbeat-pascal-ewjac` (nie direkt `main`). Merges auf `main` nur via PR.
**Stand:** App ist live (`gruppenwerk-united-q9a3.vercel.app`), 4 PRs gemerged (#58 Tickets, #59 Security, #60 Sidebar, #61 Polish), DB weitgehend gelockt, `SESSION_SECRET` in Vercel gesetzt.

---

## SCHRITT 0 — Composio-Zugang prüfen (zuerst!)

```
ToolSearch query: "composio"
ToolSearch query: "select:COMPOSIO_*"
```

- **Falls Composio-Tools auftauchen:** Verbinde Vercel + Supabase + GitHub darüber und arbeite Schritte 1–4 vollautomatisch ab.
- **Falls KEINE Composio-Tools da sind** (war beim letzten Mal so): Fallback auf die vorhandenen MCP-Tools:
  - GitHub: `mcp__github__*`
  - Supabase: `mcp__239876c3-...__*` (apply_migration, execute_sql, get_advisors, list_tables)
  - Vercel: `mcp__d305218e-...__*` (get_project, list_deployments, get_deployment_build_logs)
  - Composio NICHT erzwingen — einfach mit den obigen Tools dasselbe Ergebnis erreichen.

In beiden Fällen: **kein manueller Schritt für den User.** Wenn etwas wirklich nur im Dashboard geht, sammle es am Ende in einer kurzen Liste — sonst alles selbst erledigen.

---

## SCHRITT 1 — Gemergte Remote-Branches löschen

Diese 4 Branches sind gemergt und können weg:
`feature/ticket-system`, `feature/collapsible-sidebar`, `security-hardening`, `polish-ci-green`

- `git push origin --delete <branch>` wird vom lokalen Git-Proxy blockiert ("remote end hung up").
- **Stattdessen über Composio/GitHub-MCP löschen.** Falls kein direkter "delete branch"-Endpoint: per GitHub-API-Tool `DELETE /repos/{owner}/{repo}/git/refs/heads/{branch}`.
- `claude/*`-Branches NICHT anfassen (außer der User sagt es explizit).

---

## SCHRITT 2 — DB-Lockdown abschließen (`companies` + `automation_nodes`)

Diese 2 Tabellen sind noch anon-lesbar, weil clientseitiger Code direkt darauf zugreift:
- `lib/automationen/queries.ts` → `automation_nodes`
- `lib/database/companies.ts` → `companies`

**Reihenfolge strikt einhalten (sonst brickt die App):**
1. Client-Calls auf neue `/api`-Routen umziehen (Service-Role-Client `createAdminClient`, `requireSession()`, nach `companyId` scopen).
2. Commit + Push auf `claude/upbeat-pascal-ewjac`, PR erstellen, mergen.
3. **Warten bis Production-Deploy mit dem neuen Code live ist** (Vercel-MCP: Deployment-Status `READY` prüfen).
4. Erst DANN die REVOKE-Migration anwenden: `REVOKE ... ON companies, automation_nodes FROM anon, authenticated;` via `apply_migration` (neue Datei `supabase/migrations/034_*.sql`).
5. `get_advisors` laufen lassen, dass keine neuen Security-Findings da sind.

---

## SCHRITT 3 — Supabase-Hardening (Dashboard-Settings automatisieren falls möglich)

- "Leaked Password Protection" aktivieren — über Composio/Supabase-Management-API versuchen. Wenn nicht per API erreichbar → in die End-Liste.
- `get_advisors` (security + performance) prüfen und alle auto-fixbaren Findings beheben.

---

## SCHRITT 4 — Verifikation

- `GET /api/health` → erwartet `200 {"status":"ok",...}` mit Header `x-frame-options: DENY`.
- Vercel: letztes Production-Deployment `READY`, Build-Log fehlerfrei.
- E2E/CI grün.
- Final: kurzer Statusbericht (was erledigt, was — falls überhaupt — noch manuell offen).

---

## Constraints (CLAUDE.md — verbindlich)

- UI-Texte **Deutsch**, Kommentare Deutsch, Code/Typen Englisch.
- Kein `any`, explizite Return-Types, Komponenten <300 Zeilen.
- Zod-Validierung, TanStack Query fürs Fetching, shadcn/ui + Tailwind.
- Nach jedem Commit **automatisch pushen**.
- DB-Queries immer nach `companyId` scopen (IDOR-Schutz); Such-Inputs vor `.or()` sanitizen.

## Bewusst NICHT anfassen (außer expliziter Ansage)

- `CREDENTIALS.md` aus Git-History entfernen — User hat das Risiko akzeptiert ("all passwords committed to git is fine for now"). Echter Fix = Passwörter rotieren + `git filter-repo`/BFG, nur auf Befehl.
