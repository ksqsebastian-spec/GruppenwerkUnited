export type DateiTyp = 'folder' | 'docx' | 'sheet' | 'pdf' | 'template';

export interface OrdnerEintrag {
  id: string;
  name: string;
  type: DateiTyp;
  kinder?: OrdnerEintrag[];
  kontext?: string;
}

export const SEEHAFER_STRUKTUR: OrdnerEintrag = {
  id: 'root',
  name: 'Seehafer Elemente',
  type: 'folder',
  kinder: [
    {
      id: '01_angebote',
      name: '01_angebote',
      type: 'folder',
      kontext: 'Angebots-Ordner – enthält aktive, eingereichte und archivierte Angebote sowie die Standardvorlage.',
      kinder: [
        {
          id: 'angebote_aktiv',
          name: 'angebote_aktiv',
          type: 'folder',
          kontext: 'Aktive Angebote in Bearbeitung. Je Auftrag ein Unterordner: [JAHR_Kunde_Projekt].',
          kinder: [
            {
              id: 'angebote_aktiv_muster',
              name: '[JAHR_Kunde_Projekt]',
              type: 'folder',
              kontext: 'Projektordner für ein spezifisches Angebot – z.B. 2024_Müller_Dachsanierung.',
              kinder: [
                {
                  id: 'angebot_entwurf',
                  name: 'angebot_entwurf.docx',
                  type: 'docx',
                  kontext: 'Angebotsentwurf mit Leistungsbeschreibung, Materialpositionen, Arbeitsstunden und Gesamtpreis. Bitte ergänzen: Projektname, Kundendaten, Leistungsumfang, Endpreis.',
                },
                {
                  id: 'kalkulation_angebot',
                  name: 'kalkulation.sheet',
                  type: 'sheet',
                  kontext: 'Kalkulations-Tabelle: Materialkosten (netto), Stundensätze, Gemeinkostenzuschlag (%), Gewinnmarge. Grundlage für den Angebotspreis.',
                },
                {
                  id: 'korrespondenz_angebot',
                  name: 'korrespondenz',
                  type: 'folder',
                  kontext: 'E-Mail-Verlauf und Gesprächsnotizen mit dem Kunden zu diesem Angebot.',
                  kinder: [],
                },
              ],
            },
          ],
        },
        {
          id: 'angebote_eingereicht',
          name: 'angebote_eingereicht',
          type: 'folder',
          kontext: 'Beim Kunden eingereichte Angebote – Status: Versendet, Entscheidung ausstehend.',
          kinder: [],
        },
        {
          id: 'angebote_archiv',
          name: 'angebote_archiv',
          type: 'folder',
          kontext: 'Abgeschlossene, angenommene oder abgelehnte Angebote. Referenz für Preisfindung und ähnliche Projekte.',
          kinder: [],
        },
        {
          id: 'angebote_vorlage',
          name: 'angebote_vorlage.docx',
          type: 'template',
          kontext: 'Master-Angebotsvorlage Seehafer Elemente: Briefkopf, AGBs, Zahlungsbedingungen, Standard-Leistungspositionen. Basis für alle neuen Angebote.',
        },
      ],
    },
    {
      id: '02_ausschreibungen',
      name: '02_ausschreibungen',
      type: 'folder',
      kontext: 'Ausschreibungs-Ordner – LV-basierte Ausschreibungen, unterteilt nach Bearbeitungsstatus.',
      kinder: [
        {
          id: 'ausschreibungen_eingehend',
          name: 'ausschreibungen_eingehend',
          type: 'folder',
          kontext: 'Neu eingegangene Ausschreibungen zur Prüfung. Unterordner je LV: [LV-Ref_Bezeichnung].',
          kinder: [
            {
              id: 'lv_muster',
              name: '[LV-Ref_Bezeichnung]',
              type: 'folder',
              kontext: 'Ausschreibungsordner – Benennung: LV-Referenznummer_Projektbezeichnung.',
              kinder: [
                {
                  id: 'lv_original',
                  name: 'lv_original.pdf',
                  type: 'pdf',
                  kontext: 'Original-Leistungsverzeichnis (LV): alle Positionen, Mengen und technischen Anforderungen der Ausschreibung.',
                },
                {
                  id: 'kalkulation_lv',
                  name: 'kalkulation_entwurf.docx',
                  type: 'docx',
                  kontext: 'Kalkulationsentwurf für dieses LV: Einheitspreise je Position, Materialansatz, Zeitansatz, Subunternehmerpreise.',
                },
              ],
            },
          ],
        },
        {
          id: 'ausschreibungen_bearbeitung',
          name: 'ausschreibungen_bearbeitung',
          type: 'folder',
          kontext: 'Ausschreibungen in aktiver Kalkulation – LV wird gerade bearbeitet und Angebot vorbereitet.',
          kinder: [],
        },
        {
          id: 'ausschreibungen_eingereicht',
          name: 'ausschreibungen_eingereicht',
          type: 'folder',
          kontext: 'Eingereichte Ausschreibungsangebote – warten auf Zuschlag oder Absage.',
          kinder: [],
        },
      ],
    },
    {
      id: '03_rechnungen',
      name: '03_rechnungen',
      type: 'folder',
      kontext: 'Rechnungs-Ordner – ausgestellte Kundenrechnungen nach Status: offen, bezahlt, Mahnwesen.',
      kinder: [
        {
          id: 'rechnungen_vorlage',
          name: 'rechnungen_vorlage.docx',
          type: 'template',
          kontext: 'Rechnungsvorlage Seehafer Elemente: Briefkopf, Pflichtangaben nach UStG, Zahlungsziel, IBAN. Basis für neue Rechnungen.',
        },
        {
          id: 'rechnungen_offen',
          name: 'rechnungen_offen',
          type: 'folder',
          kontext: 'Offene Rechnungen: gestellt, aber noch nicht bezahlt. Enthält Rechnungsdatum, Fälligkeit und Betrag.',
          kinder: [],
        },
        {
          id: 'rechnungen_bezahlt',
          name: 'rechnungen_bezahlt',
          type: 'folder',
          kontext: 'Bezahlte Rechnungen – Zahlungseingang bestätigt. Archiv für Buchhaltung und Jahresabschluss.',
          kinder: [],
        },
        {
          id: 'rechnungen_mahnwesen',
          name: 'rechnungen_mahnwesen',
          type: 'folder',
          kontext: 'Mahnwesen: überfällige Rechnungen, Mahnstufen (1. Mahnung, 2. Mahnung, Inkasso) und Mahnschreiben.',
          kinder: [],
        },
      ],
    },
    {
      id: '04_lieferanten',
      name: '04_lieferanten',
      type: 'folder',
      kontext: 'Lieferanten-Ordner – Stammdaten, Eingangsrechnungen und Verträge mit Lieferanten und Subunternehmern.',
      kinder: [
        {
          id: 'lieferanten_stammdaten',
          name: 'lieferanten_stammdaten',
          type: 'folder',
          kontext: 'Stammdaten je Lieferant: Kontaktdaten, Sortiment, Konditionen, Lieferzeiten, Zahlungsziele und interne Bewertung.',
          kinder: [
            {
              id: 'lieferant_muster',
              name: '[Lieferant_Name].docx',
              type: 'docx',
              kontext: 'Lieferantenstammdaten: Name, Anschrift, Ansprechpartner, Telefon, E-Mail, Produktsortiment, Preiskonditionen, Mindestbestellmengen.',
            },
          ],
        },
        {
          id: 'lieferanten_eingangsrechnungen',
          name: 'lieferanten_eingangsrechnungen',
          type: 'folder',
          kontext: 'Eingehende Lieferantenrechnungen zur Buchung, sortiert nach Lieferant und Datum.',
          kinder: [],
        },
        {
          id: 'lieferanten_vertraege',
          name: 'lieferanten_vertraege',
          type: 'folder',
          kontext: 'Rahmenverträge, Konditionsvereinbarungen und Lieferantenverträge.',
          kinder: [],
        },
      ],
    },
    {
      id: '05_leads',
      name: '05_leads',
      type: 'folder',
      kontext: 'Lead-Verwaltung – alle potenziellen Kunden und Neuprojekte.',
      kinder: [
        {
          id: 'leads_sheet',
          name: 'leads_seehafer.sheet',
          type: 'sheet',
          kontext: 'Lead-Datenbank (Google Sheet): Kontaktdaten, Projekttyp, Auftragspotenzial, Status (neu / kontaktiert / qualifiziert / verloren) und nächste Schritte.',
        },
      ],
    },
    {
      id: '_kontext',
      name: '_kontext',
      type: 'folder',
      kontext: 'Kontext-Ordner – Basisdokumente als Hintergrundwissen für KI-Prompts. Immer miteinbinden. Maximal 5.000 Tokens.',
      kinder: [
        {
          id: 'briefpapier',
          name: 'briefpapier',
          type: 'folder',
          kontext: 'Briefkopf-Vorlagen von Seehafer Elemente für formelle Korrespondenz.',
          kinder: [
            {
              id: 'briefpapier_docx',
              name: 'briefpapier_seehafer.docx',
              type: 'template',
              kontext: 'Offizielles Briefpapier: Logo, Firmenname, Anschrift, Telefon, E-Mail, Website, Steuernummer, IBAN. Für alle formellen Dokumente verwenden.',
            },
          ],
        },
        {
          id: 'preislisten',
          name: 'preislisten',
          type: 'folder',
          kontext: 'Aktuelle Preislisten für Materialien, Leistungen und Stundensätze.',
          kinder: [
            {
              id: 'preisliste_sheet',
              name: 'preisliste_aktuell.sheet',
              type: 'sheet',
              kontext: 'Aktuelle Preisliste: Stundensätze (Monteur, Geselle, Meister), Materialpreise häufig verwendeter Artikel, Pauschalpreise für Standardleistungen.',
            },
          ],
        },
        {
          id: 'firmeninfo',
          name: 'firmeninfo.docx',
          type: 'docx',
          kontext: 'Firmenprofil Seehafer Elemente: Gründungsjahr, Kernkompetenzen, Zertifizierungen (z.B. DGUV), Referenzprojekte, Mitarbeiterzahl, Einzugsgebiet und USPs. Immer als Hintergrundwissen einbinden.',
        },
        {
          id: 'ansprechpartner',
          name: 'ansprechpartner.docx',
          type: 'docx',
          kontext: 'Interne Kontaktliste: Team-Mitglieder mit Name, Rolle, Telefon und E-Mail. Für Unterschriften, Ansprechpartner in Dokumenten und Verantwortlichkeiten.',
        },
      ],
    },
  ],
};

export function findeEintrag(id: string, baum: OrdnerEintrag): OrdnerEintrag | null {
  if (baum.id === id) return baum;
  for (const kind of baum.kinder ?? []) {
    const gefunden = findeEintrag(id, kind);
    if (gefunden !== null) return gefunden;
  }
  return null;
}

export function findeKinder(id: string, baum: OrdnerEintrag): OrdnerEintrag[] | null {
  if (baum.id === id) return baum.kinder ?? [];
  for (const kind of baum.kinder ?? []) {
    const gefunden = findeKinder(id, kind);
    if (gefunden !== null) return gefunden;
  }
  return null;
}
