/**
 * Apollo-Lead-Top-Up
 *
 * Sucht & reichert Apollo-Kontakte an, importiert sie als Leads pro Mandant in die Werkbank
 * (via /api/leads/import). Idempotent: die Werkbank dedupliziert über (company, email).
 *
 * Tempo: parallele Anreicherung (default 5 gleichzeitig), ~2–5 Minuten pro Mandant.
 *
 * Voraussetzungen:
 *   APOLLO_API_KEY        — Apollo-API-Schlüssel
 *   <TENANT>_PASSWORD     — Werkbank-Login-Passwort je Mandant
 *                            (HANTKE_PASSWORD, BRINK_PASSWORD, MEHLIG_PASSWORD,
 *                             WERNER_PASSWORD, WERNER_BAU_PASSWORD, SEEHAFER_PASSWORD)
 *
 * Optional:
 *   BASE_URL              — Werkbank-Basis-URL (Default: Production)
 *   TARGET                — Ziel-Anzahl Leads je Mandant (Default 1000)
 *   CONCURRENCY           — Parallele Apollo-Calls (Default 5)
 *   DRY=1                 — Nur suchen, nicht anreichern/importieren
 *
 * Aufrufe:
 *   node scripts/apollo-topup.mjs hantke
 *   node scripts/apollo-topup.mjs hantke brink mehlig
 *   node scripts/apollo-topup.mjs --all
 *   TARGET=1500 node scripts/apollo-topup.mjs werner
 *   DRY=1 node scripts/apollo-topup.mjs --all
 *
 * Hinweis Apollo-Credits: 1 Credit pro angereichertem Treffer. Das Skript stoppt
 * pro Mandant, sobald genug gültige E-Mails für das Ziel beisammen sind.
 */

const APOLLO_BASE = 'https://api.apollo.io/api/v1';
const BASE_URL = process.env.BASE_URL ?? 'https://gruppenwerk-united-q9a3.vercel.app';
const APOLLO_KEY = process.env.APOLLO_API_KEY;
const TARGET = Number(process.env.TARGET ?? 1000);
const CONCURRENCY = Number(process.env.CONCURRENCY ?? 5);
const DRY = process.env.DRY === '1';

// Mandanten-Konfiguration: Apollo-Suchprofil je Firma. Die Stichwörter spiegeln
// das Branchen-Profil der bereits vorhandenen Leads wider — beim Anpassen die
// Werkbank-Lead-Auswertung als Referenz nehmen.
const TENANTS = {
  hantke: {
    passwordEnv: 'HANTKE_PASSWORD',
    keywords: ['real estate', 'construction', 'insurance', 'architecture & planning', 'information technology & services', 'financial services'],
  },
  brink: {
    passwordEnv: 'BRINK_PASSWORD',
    keywords: ['construction', 'hospitality', 'information technology & services', 'architecture & planning', 'security & investigations', 'building materials'],
  },
  mehlig: {
    passwordEnv: 'MEHLIG_PASSWORD',
    keywords: ['real estate', 'information technology & services', 'retail', 'hospitality', 'wholesale', 'hospital & health care'],
  },
  werner: {
    passwordEnv: 'WERNER_PASSWORD',
    keywords: ['construction', 'events services', 'renewables & environment', 'building materials', 'utilities', 'semiconductors'],
  },
  'werner-bau': {
    passwordEnv: 'WERNER_BAU_PASSWORD',
    keywords: ['construction', 'events services', 'renewables & environment', 'building materials', 'utilities', 'semiconductors'],
  },
  seehafer: {
    passwordEnv: 'SEEHAFER_PASSWORD',
    keywords: ['real estate', 'hospitality', 'information technology & services', 'construction', 'architecture & planning', 'banking'],
  },
};

// Gemeinsame Suchfilter (Standort + Seniorität) — bewusst auf Nord-DE-Entscheider.
const COMMON_SEARCH = {
  contact_email_status: ['verified'],
  person_locations: ['Hamburg, Germany', 'Bremen, Germany', 'Lower Saxony, Germany', 'Schleswig-Holstein, Germany', 'Mecklenburg-Vorpommern, Germany'],
  person_seniorities: ['owner', 'founder', 'c_suite', 'partner', 'vp', 'head', 'director', 'manager'],
};

// ── Apollo-API ───────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function apolloFetch(path, body, attempt = 1) {
  const res = await fetch(`${APOLLO_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': APOLLO_KEY },
    body: JSON.stringify(body),
  });
  if (res.status === 429 && attempt < 5) {
    const retry = Number(res.headers.get('retry-after') ?? 10);
    console.log(`  Apollo 429 — warte ${retry}s …`);
    await sleep(retry * 1000);
    return apolloFetch(path, body, attempt + 1);
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Apollo ${path} ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

const searchPage = (keywords, page) =>
  apolloFetch('/mixed_people/search', {
    ...COMMON_SEARCH,
    q_organization_keyword_tags: keywords,
    page,
    per_page: 100,
  });

const enrichBatch = (ids) =>
  apolloFetch('/people/bulk_match', { details: ids.map((id) => ({ id })) });

// ── Werkbank-API ─────────────────────────────────────────────────────────────

async function werkbankLogin(password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) throw new Error(`Login fehlgeschlagen (${res.status})`);
  const cookies = res.headers.getSetCookie?.() ?? [res.headers.get('set-cookie') ?? ''];
  const session = cookies.map((c) => c.split(';')[0]).find((c) => c.startsWith('werkbank-session='));
  if (!session) throw new Error('Kein Session-Cookie erhalten');
  return session;
}

async function werkbankLeadCount(cookie) {
  const res = await fetch(`${BASE_URL}/api/leads`, { headers: { Cookie: cookie } });
  if (!res.ok) throw new Error(`Lead-Liste fehlgeschlagen (${res.status})`);
  return (await res.json()).length;
}

async function werkbankImport(cookie, csv) {
  const form = new FormData();
  form.append('file', new Blob([csv], { type: 'text/csv' }), 'leads.csv');
  const res = await fetch(`${BASE_URL}/api/leads/import`, {
    method: 'POST',
    headers: { Cookie: cookie },
    body: form,
  });
  if (!res.ok) throw new Error(`Import fehlgeschlagen (${res.status}): ${await res.text()}`);
  return res.json();
}

// ── CSV ──────────────────────────────────────────────────────────────────────

const csvField = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';

function buildCsv(matches) {
  const header = ['First Name', 'Last Name', 'Email', 'Phone', 'Company', 'Title', 'LinkedIn URL', 'City', 'Industry', 'Notes'];
  const seen = new Set();
  const rows = [header.map(csvField).join(',')];
  for (const m of matches) {
    if (!m.email || m.email.includes('email_not_unlocked')) continue;
    const key = m.email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push([
      m.first_name, m.last_name, m.email, '',
      m.organization?.name, m.title, m.linkedin_url,
      m.city, m.organization?.industry,
      `[apollo:${m.id}] [source:apollo-topup]`,
    ].map(csvField).join(','));
  }
  return { csv: rows.join('\n'), rows: rows.length - 1 };
}

// ── Pipeline ─────────────────────────────────────────────────────────────────

const chunked = (arr, n) => {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
};

async function topUpTenant(tenant) {
  const cfg = TENANTS[tenant];
  if (!cfg) throw new Error(`Unbekannter Mandant: ${tenant} (verfügbar: ${Object.keys(TENANTS).join(', ')})`);
  const password = process.env[cfg.passwordEnv];
  if (!password) throw new Error(`${cfg.passwordEnv} nicht gesetzt`);

  console.log(`\n=== [${tenant}] Start ===`);
  const cookie = await werkbankLogin(password);
  const before = await werkbankLeadCount(cookie);
  console.log(`[${tenant}] Aktueller Stand: ${before} Leads (Ziel: ${TARGET})`);

  const needed = Math.max(0, TARGET - before);
  if (needed === 0) {
    console.log(`[${tenant}] Bereits ≥ Ziel — übersprungen.`);
    return;
  }
  console.log(`[${tenant}] Top-Up: ${needed} neue Leads gesucht`);

  // 1. Suchergebnisse einsammeln (50% Puffer für Misses/Duplikate)
  const targetCandidates = Math.ceil(needed * 1.5);
  const ids = new Set();
  for (let page = 1; ids.size < targetCandidates && page <= 50; page++) {
    const res = await searchPage(cfg.keywords, page);
    const got = res.people ?? [];
    if (got.length === 0) break;
    for (const p of got) ids.add(p.id);
    console.log(`[${tenant}] Suche Seite ${page}: +${got.length} (gesamt ${ids.size}/${targetCandidates})`);
  }
  const idList = [...ids].slice(0, targetCandidates);

  if (DRY) {
    console.log(`[${tenant}] DRY-Modus: ${idList.length} Kandidaten gesammelt — keine Anreicherung.`);
    return;
  }

  // 2. Parallele Anreicherung in 10er-Batches, Stop bei genug gültigen Mails
  const batches = chunked(idList, 10);
  const matches = [];
  let credits = 0;
  for (let i = 0; i < batches.length; i += CONCURRENCY) {
    const slice = batches.slice(i, i + CONCURRENCY);
    const results = await Promise.all(slice.map((b) =>
      enrichBatch(b).catch((e) => {
        console.warn(`[${tenant}] Batch-Fehler: ${e.message}`);
        return { matches: [], credits_consumed: 0 };
      })
    ));
    for (const r of results) {
      matches.push(...(r.matches ?? []));
      credits += r.credits_consumed ?? 0;
    }
    const valid = matches.filter((m) => m.email && !m.email.includes('email_not_unlocked')).length;
    const done = Math.min(i + CONCURRENCY, batches.length);
    console.log(`[${tenant}] Anreicherung ${done}/${batches.length} Batches — gültige Mails: ${valid}, Credits: ${credits}`);
    if (valid >= needed) break;
  }

  // 3. CSV-Upload via Werkbank-Import (deduppt über (company,email))
  const { csv, rows } = buildCsv(matches);
  if (rows === 0) {
    console.log(`[${tenant}] Keine gültigen E-Mails gefunden — nichts zu importieren.`);
    return;
  }
  console.log(`[${tenant}] CSV-Upload: ${rows} Zeilen`);
  const result = await werkbankImport(cookie, csv);
  const after = await werkbankLeadCount(cookie);
  console.log(`[${tenant}] Fertig: importiert ${result.imported}/${result.total} — Endstand ${after} (vorher ${before}, Δ ${after - before})`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!APOLLO_KEY) {
    console.error('FEHLER: APOLLO_API_KEY nicht gesetzt.');
    process.exit(1);
  }
  const args = process.argv.slice(2);
  const tenants = args.includes('--all')
    ? Object.keys(TENANTS)
    : args.filter((a) => !a.startsWith('--'));
  if (tenants.length === 0) {
    console.error('Verwendung: node scripts/apollo-topup.mjs <tenant>... | --all');
    console.error('Mandanten:  ' + Object.keys(TENANTS).join(', '));
    process.exit(1);
  }
  const t0 = Date.now();
  for (const t of tenants) {
    try { await topUpTenant(t); }
    catch (e) { console.error(`[${t}] ABBRUCH: ${e.message}`); }
  }
  console.log(`\nGesamt: ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

main();
