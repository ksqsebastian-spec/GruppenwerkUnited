import { createAdminClient } from '@/lib/supabase/admin';
import { CUSTOMER_FIELDS, CUSTOMER_FIELD_LABEL } from '@/lib/kunden/customer-fields';
import { generateCode } from '@/lib/datenkodierung/code-generator';
import type { Customer, CustomerPromptRendered } from '@/types';

// ── Prompt-Rendering ─────────────────────────────────────────────────────────

/**
 * Stellt für jedes benötigte Kundenfeld eine eindeutige Datenkodierung sicher
 * (idempotent über Tags `customer:<id>` + `field:<feld>`). Liefert ein
 * Feld→Code-Mapping zurück, das im Prompt anstelle der Klartextwerte verwendet
 * werden kann — so erfährt die KI nie den echten Kundennamen.
 */
async function ensureKundenCodes(
  supabase: ReturnType<typeof createAdminClient>,
  customer: Customer,
  fields: string[],
  companyId: string,
): Promise<Map<string, { code: string; value: string }>> {
  const result = new Map<string, { code: string; value: string }>();
  if (fields.length === 0) return result;

  const customerTag = `customer:${customer.id}`;
  const { data: existing, error: readError } = await supabase
    .from('datenkodierungen')
    .select('code, tags')
    .eq('company', companyId)
    .contains('tags', [customerTag]);
  if (readError) throw new Error('Bestehende Codes konnten nicht geladen werden');

  const knownPerField = new Map<string, string>();
  for (const row of (existing ?? []) as Array<{ code: string; tags: string[] | null }>) {
    const fieldTag = row.tags?.find((t) => t.startsWith('field:'));
    if (fieldTag) knownPerField.set(fieldTag.slice('field:'.length), row.code);
  }

  for (const field of fields) {
    const value = (customer as unknown as Record<string, string | null>)[field];
    if (value == null || value === '') continue;

    let code = knownPerField.get(field);
    if (!code) {
      // Neue Kodierung anlegen — bei 23505-Kollision bis zu 3x neu generieren
      for (let attempt = 0; attempt < 3; attempt++) {
        const versuch = generateCode();
        const { error: insErr } = await supabase.from('datenkodierungen').insert({
          company: companyId,
          code: versuch,
          name: value,
          notizen: `Kunde „${customer.firmenname}" — Feld: ${CUSTOMER_FIELD_LABEL[field] ?? field}`,
          tags: [customerTag, `field:${field}`, 'kunde-encode'],
        });
        if (!insErr) {
          code = versuch;
          break;
        }
        if (insErr.code !== '23505') {
          throw new Error('Kodierung konnte nicht angelegt werden');
        }
      }
      if (!code) throw new Error('Code-Generierung fehlgeschlagen');
    }
    result.set(field, { code, value });
  }
  return result;
}

/**
 * Füllt eine Prompt-Vorlage mit Kunden-Feldern und Datenkodierungs-Werten.
 *
 * Platzhalter-Syntax:
 *   • {{customer.firmenname}} → Kundenfeld
 *     (zulässig: firmenname, ansprechpartner, email, telefon, adresse, notizen, status)
 *   • {{CODE}}                → Datenkodierung mit code='CODE' → Wert ist `name`
 *
 * Großschreibung egal. Nicht aufgelöste Platzhalter werden in
 * `missing_placeholders` (eindeutig, ohne geschweifte Klammern) zurückgemeldet
 * und im Text durch `[Feld fehlt]` ersetzt.
 *
 * `encode = true` ersetzt alle vorhandenen Kundenfelder durch eindeutige
 * Datenkodierungs-Codes (pro (Kunde, Feld)). So bekommt die KI keinen
 * echten Kundennamen/Anschrift/… zu sehen — das Mapping wird mitgeliefert.
 */
export async function renderPrompt(
  promptId: string,
  customerId: string,
  companyId: string,
  options: { encode?: boolean } = {},
): Promise<CustomerPromptRendered> {
  const supabase = createAdminClient();

  const [promptRes, customerRes, datenkodierungenRes] = await Promise.all([
    supabase.from('customer_prompts').select('template').eq('id', promptId).eq('company', companyId).maybeSingle(),
    supabase.from('customers').select('*').eq('id', customerId).eq('company', companyId).maybeSingle(),
    supabase.from('datenkodierungen').select('code, name').eq('company', companyId),
  ]);

  if (promptRes.error || !promptRes.data) throw new Error('Vorlage nicht gefunden');
  if (customerRes.error || !customerRes.data) throw new Error('Kunde nicht gefunden');
  if (datenkodierungenRes.error) throw new Error('Datenkodierungen konnten nicht geladen werden');

  const template = (promptRes.data as { template: string }).template;
  const customer = customerRes.data as Customer;
  const datenkodierungen = (datenkodierungenRes.data ?? []) as Array<{ code: string; name: string }>;

  // Datenkodierungs-Map case-insensitiv
  const dkMap = new Map<string, string>();
  for (const row of datenkodierungen) dkMap.set(row.code.toUpperCase(), row.name);

  // Kundenfelder aus der zentralen Registry aufbauen (+ status)
  const rec = customer as unknown as Record<string, string | null>;
  const customerFields: Record<string, { value: string | null; label: string }> = {
    status: { value: customer.status, label: 'Status' },
  };
  for (const f of CUSTOMER_FIELDS) {
    customerFields[f.key] = { value: rec[f.key] ?? null, label: f.label };
  }

  // Encoding: für jede im Template verwendete Kundenfeld-Referenz einen Code
  // anlegen / nachschlagen — der Prompt enthält dann nur noch die Codes.
  let kundenCodes = new Map<string, { code: string; value: string }>();
  if (options.encode) {
    const benoetigt = new Set<string>();
    const re = /\{\{\s*customer\.([a-zA-Z_]+)\s*\}\}/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(template)) !== null) {
      benoetigt.add(m[1].toLowerCase());
    }
    kundenCodes = await ensureKundenCodes(supabase, customer, [...benoetigt], companyId);
  }

  const missing = new Set<string>();
  const rendered = template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_match, rawKey: string) => {
    const key = rawKey.trim();
    if (key.toLowerCase().startsWith('customer.')) {
      const field = key.slice(9).toLowerCase();
      const entry = customerFields[field];
      if (!entry || entry.value == null || entry.value === '') {
        missing.add(key);
        return `[${entry?.label ?? field} fehlt]`;
      }
      // Encoding: statt Klartextwert den Code einsetzen
      if (options.encode) {
        const codeEntry = kundenCodes.get(field);
        if (codeEntry) return codeEntry.code;
      }
      return entry.value;
    }
    const value = dkMap.get(key.toUpperCase());
    if (value == null || value === '') {
      missing.add(key);
      return `[${key} fehlt]`;
    }
    return value;
  });

  const mapping = options.encode
    ? [...kundenCodes.entries()].map(([field, { code, value }]) => ({
        code,
        field,
        label: CUSTOMER_FIELD_LABEL[field] ?? field,
        value,
      }))
    : undefined;

  return {
    prompt: rendered,
    missing_placeholders: [...missing],
    encoded: options.encode ? true : undefined,
    mapping,
  };
}
