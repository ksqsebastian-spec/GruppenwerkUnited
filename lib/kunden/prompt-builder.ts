/**
 * Erzeugt einen Prompt-Text aus den strukturierten Eingaben des Anleg-Wizards.
 *
 * Idee: nicht-technische Nutzer beantworten kurze Fragen (Was, an wen, wie),
 * und wir generieren daraus einen brauchbaren Claude/ChatGPT-Prompt mit
 * {{…}}-Platzhaltern. Bearbeiten kann der Nutzer den Text später jederzeit
 * im Chip-Editor.
 */

import { CUSTOMER_TOKEN_FIELDS } from '@/lib/kunden/customer-fields';

export type Dokumenttyp =
  | 'rechnung'
  | 'mahnung'
  | 'angebot'
  | 'auftragsbestaetigung'
  | 'lieferschein'
  | 'gutschrift'
  | 'anschreiben'
  | 'eigene';

export type Tonalitaet = 'foermlich' | 'sachlich' | 'freundlich';

export interface DokumenttypMeta {
  id: Dokumenttyp;
  label: string;
  kategorie: string;
  defaultName: string;
  intro: string;
  /** Welche Kundenfelder sind für diesen Typ standardmäßig vorgeschlagen? */
  defaultKundenfelder: string[];
}

export const DOKUMENTTYPEN: DokumenttypMeta[] = [
  {
    id: 'rechnung',
    label: 'Rechnung',
    kategorie: 'Rechnung',
    defaultName: 'Rechnung',
    intro: 'Erstelle eine professionelle Rechnung für den folgenden Kunden.',
    defaultKundenfelder: ['customer.firmenname', 'customer.ansprechpartner', 'customer.adresse'],
  },
  {
    id: 'mahnung',
    label: 'Mahnung',
    kategorie: 'Mahnung',
    defaultName: 'Mahnung',
    intro: 'Verfasse eine Mahnung an den folgenden Kunden.',
    defaultKundenfelder: ['customer.firmenname', 'customer.ansprechpartner', 'customer.adresse'],
  },
  {
    id: 'angebot',
    label: 'Angebot',
    kategorie: 'Angebot',
    defaultName: 'Angebot',
    intro: 'Erstelle ein detailliertes Angebot für den folgenden Kunden.',
    defaultKundenfelder: ['customer.firmenname', 'customer.ansprechpartner', 'customer.adresse', 'customer.email'],
  },
  {
    id: 'auftragsbestaetigung',
    label: 'Auftragsbestätigung',
    kategorie: 'Bestätigung',
    defaultName: 'Auftragsbestätigung',
    intro: 'Schreibe eine Auftragsbestätigung an den folgenden Kunden.',
    defaultKundenfelder: ['customer.firmenname', 'customer.ansprechpartner', 'customer.adresse'],
  },
  {
    id: 'lieferschein',
    label: 'Lieferschein',
    kategorie: 'Lieferschein',
    defaultName: 'Lieferschein',
    intro: 'Erstelle einen Lieferschein für die folgende Lieferung.',
    defaultKundenfelder: ['customer.firmenname', 'customer.adresse'],
  },
  {
    id: 'gutschrift',
    label: 'Gutschrift',
    kategorie: 'Gutschrift',
    defaultName: 'Gutschrift',
    intro: 'Erstelle eine Gutschrift zugunsten des folgenden Kunden.',
    defaultKundenfelder: ['customer.firmenname', 'customer.adresse'],
  },
  {
    id: 'anschreiben',
    label: 'Anschreiben',
    kategorie: 'Korrespondenz',
    defaultName: 'Kundenanschreiben',
    intro: 'Verfasse einen Geschäftsbrief an den folgenden Kunden.',
    defaultKundenfelder: ['customer.firmenname', 'customer.ansprechpartner', 'customer.adresse'],
  },
  {
    id: 'eigene',
    label: 'Eigene Vorlage',
    kategorie: 'Sonstiges',
    defaultName: 'Neue Vorlage',
    intro: 'Verfasse das folgende Dokument für den Kunden.',
    defaultKundenfelder: ['customer.firmenname'],
  },
];

export const KUNDEN_FELDER = CUSTOMER_TOKEN_FIELDS;

const TON_LABELS: Record<Tonalitaet, { kurz: string; satz: string }> = {
  foermlich: {
    kurz: 'Förmlich',
    satz: 'Schreibe förmlich, in der Sie-Form, im Stil eines klassischen Geschäftsbriefs.',
  },
  sachlich: {
    kurz: 'Sachlich',
    satz: 'Halte den Ton sachlich, neutral und auf das Wesentliche beschränkt.',
  },
  freundlich: {
    kurz: 'Freundlich',
    satz: 'Schreibe freundlich und persönlich, aber dennoch professionell.',
  },
};

export interface WizardInput {
  typ: Dokumenttyp;
  /** Anzeige-Name der Vorlage. */
  name: string;
  /** Kategorie der Vorlage. */
  kategorie: string;
  /** Kurze Beschreibung. */
  beschreibung: string;
  /** Ausgewählte Kundenfelder im Format „customer.feld". */
  kundenfelder: string[];
  /** Ausgewählte Datenkodierungs-Codes. */
  eigeneDaten: string[];
  /** Beschreibung des Anlasses / zusätzliche Anweisungen. */
  zusatz: string;
  tonalitaet: Tonalitaet;
}

/**
 * Baut den eigentlichen Prompt-Text auf — strukturiert, mit Platzhaltern,
 * fertig zum Reinkopieren in Claude/ChatGPT nach Server-Rendering.
 */
export function baueVorlagenText(input: WizardInput, datenkodierungLabels: Record<string, string> = {}): string {
  const typMeta = DOKUMENTTYPEN.find((d) => d.id === input.typ) ?? DOKUMENTTYPEN[DOKUMENTTYPEN.length - 1];
  const ton = TON_LABELS[input.tonalitaet];

  const lines: string[] = [];
  lines.push(typMeta.intro);
  lines.push('');
  lines.push(`Tonalität: ${ton.satz}`);
  lines.push('');

  if (input.kundenfelder.length > 0) {
    lines.push('KUNDENDATEN');
    for (const key of input.kundenfelder) {
      const label = KUNDEN_FELDER.find((f) => f.key === key)?.label ?? key;
      lines.push(`${label}: {{${key}}}`);
    }
    lines.push('');
  }

  if (input.eigeneDaten.length > 0) {
    lines.push('EIGENE STAMMDATEN');
    for (const code of input.eigeneDaten) {
      const label = datenkodierungLabels[code];
      lines.push(label ? `${code} (${label}): {{${code}}}` : `${code}: {{${code}}}`);
    }
    lines.push('');
  }

  if (input.zusatz.trim().length > 0) {
    lines.push('ANLASS / ZUSÄTZLICHE INFORMATIONEN');
    lines.push(input.zusatz.trim());
    lines.push('');
  }

  lines.push('ANFORDERUNGEN');
  lines.push('- Sauberer, gut strukturierter Aufbau');
  lines.push('- Datum und ggf. Referenznummer ergänzen');
  lines.push('- Klarer Call-to-Action am Ende');

  return lines.join('\n').trim();
}
