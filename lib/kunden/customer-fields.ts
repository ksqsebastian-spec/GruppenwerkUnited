/**
 * Zentrale Registry aller Kundenfelder, die als Platzhalter
 * {{customer.<key>}} in Prompt-Vorlagen verwendet werden können.
 *
 * Eine Quelle der Wahrheit für: Formular, Chip-Editor, Wizard,
 * Server-Rendering und Encode-Labels.
 */

export interface CustomerFieldDef {
  /** Spaltenname / Platzhalter-Schlüssel (z.B. "firmenname"). */
  key: string;
  /** Deutsches Label für UI und Encode-Hinweise. */
  label: string;
  /** Gruppierung für die UI. */
  gruppe: 'kontakt' | 'adresse' | 'geschaeft';
}

export const CUSTOMER_FIELDS: CustomerFieldDef[] = [
  { key: 'firmenname', label: 'Firmenname', gruppe: 'kontakt' },
  { key: 'ansprechpartner', label: 'Ansprechpartner', gruppe: 'kontakt' },
  { key: 'email', label: 'E-Mail', gruppe: 'kontakt' },
  { key: 'telefon', label: 'Telefon', gruppe: 'kontakt' },
  { key: 'webseite', label: 'Webseite', gruppe: 'kontakt' },

  { key: 'adresse', label: 'Adresse (frei)', gruppe: 'adresse' },
  { key: 'strasse', label: 'Straße & Nr.', gruppe: 'adresse' },
  { key: 'plz', label: 'PLZ', gruppe: 'adresse' },
  { key: 'ort', label: 'Ort', gruppe: 'adresse' },
  { key: 'land', label: 'Land', gruppe: 'adresse' },

  { key: 'kundennummer', label: 'Kundennummer', gruppe: 'geschaeft' },
  { key: 'ust_id', label: 'USt-IdNr.', gruppe: 'geschaeft' },
  { key: 'steuernummer', label: 'Steuernummer', gruppe: 'geschaeft' },
  { key: 'zahlungsziel', label: 'Zahlungsziel', gruppe: 'geschaeft' },
  { key: 'notizen', label: 'Notizen', gruppe: 'geschaeft' },
];

/** Schlüssel → Label, für schnelle Lookups. */
export const CUSTOMER_FIELD_LABEL: Record<string, string> = Object.fromEntries(
  CUSTOMER_FIELDS.map((f) => [f.key, f.label]),
);

/** TokenDef-Liste fürs Einfügen (key im Format „customer.<key>"). */
export const CUSTOMER_TOKEN_FIELDS = CUSTOMER_FIELDS.map((f) => ({
  key: `customer.${f.key}`,
  label: f.label,
}));
