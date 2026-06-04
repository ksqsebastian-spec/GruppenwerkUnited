/**
 * Schnellstart-Vorlagen für gängige Geschäftsdokumente.
 *
 * Wird in der Vorlagen-Bibliothek als „Vorschläge" angezeigt. Ein Klick auf
 * „Übernehmen" öffnet den Anlegen-Dialog mit vorbefülltem Text. Die Vorlage
 * (z.B. Word-Datei) lädt der Nutzer separat hoch.
 */

export interface StarterPrompt {
  name: string;
  kategorie: string;
  beschreibung: string;
  template: string;
}

export const STARTER_PROMPTS: StarterPrompt[] = [
  {
    name: 'Rechnung erstellen',
    kategorie: 'Rechnung',
    beschreibung: 'Standardrechnung mit Kundendaten, MwSt und Zahlungsziel.',
    template: `Erstelle eine professionelle Rechnung für folgenden Kunden.

KUNDE
Firma:          {{customer.firmenname}}
Ansprechpartner: {{customer.ansprechpartner}}
Adresse:        {{customer.adresse}}
E-Mail:         {{customer.email}}

UNSERE STAMMDATEN
Rechnungsnummer-Präfix: {{RNR_PRAEFIX}}
MwSt-Satz:              {{MWST}}%
Zahlungsziel:           {{ZAHLUNGSZIEL}}

LEISTUNGEN
[Hier Positionen einfügen — Bezeichnung, Menge, Einzelpreis netto]

ANFORDERUNGEN
- Saubere Tabellenform für die Positionen
- Netto, MwSt-Ausweis, Brutto getrennt
- Höflicher Begleittext
- Hinweis auf Zahlungsziel und Bankverbindung`,
  },
  {
    name: 'Mahnung (1. Stufe)',
    kategorie: 'Mahnung',
    beschreibung: 'Freundliche Zahlungserinnerung mit höflichem Ton.',
    template: `Schreibe eine erste, höfliche Zahlungserinnerung an folgenden Kunden.

KUNDE
Firma:           {{customer.firmenname}}
Ansprechpartner: {{customer.ansprechpartner}}
Adresse:         {{customer.adresse}}

ZUR ZAHLUNG OFFEN
Rechnungsnummer: [Rechnungsnummer einfügen]
Rechnungsdatum:  [Datum einfügen]
Betrag:          [Betrag einfügen]
Fälligkeit war:  [Datum einfügen]

TONALITÄT
- Höflich, partnerschaftlich, keine Drohung
- Annahme: Die Rechnung ist nur übersehen worden
- Klare neue Frist (z.B. innerhalb von 7 Tagen)
- Kontakt für Rückfragen anbieten`,
  },
  {
    name: 'Mahnung (2. Stufe)',
    kategorie: 'Mahnung',
    beschreibung: 'Bestimmtere Mahnung mit konkreter Frist und Mahngebühr.',
    template: `Schreibe eine zweite, bestimmtere Mahnung an folgenden Kunden.

KUNDE
Firma:           {{customer.firmenname}}
Ansprechpartner: {{customer.ansprechpartner}}
Adresse:         {{customer.adresse}}

ZUR ZAHLUNG OFFEN
Rechnungsnummer: [Rechnungsnummer einfügen]
Originalbetrag:  [Betrag einfügen]
Mahngebühr:      [Mahngebühr einfügen]
Gesamtbetrag:    [Summe einfügen]

TONALITÄT
- Sachlich und bestimmt
- Verweis auf erste Mahnung
- Klare Frist (z.B. 7 Werktage)
- Hinweis auf weitere Schritte bei Nichtzahlung`,
  },
  {
    name: 'Angebot erstellen',
    kategorie: 'Angebot',
    beschreibung: 'Ausführliches Angebot mit Leistungspositionen und Konditionen.',
    template: `Erstelle ein professionelles Angebot für folgenden Kunden.

KUNDE
Firma:           {{customer.firmenname}}
Ansprechpartner: {{customer.ansprechpartner}}
Adresse:         {{customer.adresse}}
E-Mail:          {{customer.email}}

ANGEBOTSKOPF
Angebotsnummer-Präfix: {{ANR_PRAEFIX}}
Gültigkeitsdauer:      {{ANGEBOT_GUELTIG_TAGE}} Tage
MwSt-Satz:             {{MWST}}%

ANFRAGE / LEISTUNGSUMFANG
[Beschreibe Wunsch des Kunden + von uns vorgeschlagene Leistung]

POSITIONEN
[Bezeichnung, Menge, Einzelpreis netto je Position]

ANFORDERUNGEN
- Kurze Einleitung mit Bezug zum Gespräch / zur Anfrage
- Übersichtliche Positionstabelle
- Zwischensumme, MwSt, Gesamtsumme
- Konditionen (Zahlung, Lieferzeit, Gültigkeit)
- Freundlicher Schlusssatz mit Bitte um Rückmeldung`,
  },
  {
    name: 'Auftragsbestätigung',
    kategorie: 'Bestätigung',
    beschreibung: 'Bestätigung nach Auftragserteilung mit Lieferdetails.',
    template: `Schreibe eine Auftragsbestätigung für folgenden Kunden.

KUNDE
Firma:           {{customer.firmenname}}
Ansprechpartner: {{customer.ansprechpartner}}

AUFTRAG
Auftragsnummer:    [Auftragsnummer einfügen]
Bezug auf Angebot: [Angebotsnummer einfügen]
Liefertermin:      [Datum einfügen]
Lieferort:         {{customer.adresse}}

ANFORDERUNGEN
- Dank für den Auftrag
- Übersicht der bestätigten Leistungen / Mengen / Preise
- Liefer- und Zahlungsbedingungen
- Ansprechpartner bei uns für Rückfragen`,
  },
  {
    name: 'Lieferschein',
    kategorie: 'Lieferschein',
    beschreibung: 'Kompakter Lieferschein zur Warenausgangsdokumentation.',
    template: `Erstelle einen Lieferschein zu folgendem Vorgang.

EMPFÄNGER
Firma:    {{customer.firmenname}}
Adresse:  {{customer.adresse}}

LIEFERUNG
Lieferscheinnummer:   [Lieferscheinnummer]
Datum:                [Datum]
Bezug Auftrag:        [Auftragsnummer]

POSITIONEN
[Artikel, Artikelnummer, Menge, ggf. Seriennummer]

ANFORDERUNGEN
- Klare Tabelle mit den ausgelieferten Positionen
- Hinweis zur Empfangsbestätigung
- Keine Preisangaben (Lieferschein, nicht Rechnung)`,
  },
  {
    name: 'Gutschrift',
    kategorie: 'Gutschrift',
    beschreibung: 'Gutschrift mit Bezug auf Originalrechnung und Grund.',
    template: `Erstelle eine Gutschrift zugunsten folgenden Kunden.

KUNDE
Firma:    {{customer.firmenname}}
Adresse:  {{customer.adresse}}

BEZUG
Gutschriftnummer:  [Nummer]
Originalrechnung:  [Rechnungsnummer + Datum]
Gutschriftbetrag:  [Betrag netto + Brutto]
MwSt-Satz:         {{MWST}}%

GRUND
[Kurze Begründung der Gutschrift, z.B. Reklamation, Skonto, Stornierung]

ANFORDERUNGEN
- Eindeutige Kennzeichnung als „Gutschrift"
- Bezug zur Originalrechnung
- Auszahlungs- oder Verrechnungshinweis`,
  },
  {
    name: 'Kundenanschreiben',
    kategorie: 'Korrespondenz',
    beschreibung: 'Freie Vorlage für individuelle Geschäftsbriefe an Kunden.',
    template: `Schreibe einen professionellen Geschäftsbrief an folgenden Kunden.

EMPFÄNGER
Firma:           {{customer.firmenname}}
Ansprechpartner: {{customer.ansprechpartner}}
Adresse:         {{customer.adresse}}
E-Mail:          {{customer.email}}

THEMA
[Worum geht es? Stichpunkte einfügen]

KERNAUSSAGEN
- [Punkt 1]
- [Punkt 2]
- [Punkt 3]

ANFORDERUNGEN
- Professioneller, persönlicher Ton
- Klare Struktur (Anlass → Aussage → Nächster Schritt)
- Konkreter Call-to-Action am Ende`,
  },
];
