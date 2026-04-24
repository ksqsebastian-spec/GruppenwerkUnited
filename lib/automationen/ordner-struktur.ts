export type DateiTyp = 'folder' | 'docx' | 'sheet' | 'pdf' | 'template';

export interface OrdnerEintrag {
  id: string;
  name: string;
  type: DateiTyp;
  /** Dateiname aus /public/logos/ – überschreibt das generische Lucide-Icon */
  logo?: string;
  kinder?: OrdnerEintrag[];
  kontext?: string;
}

export const SEEHAFER_STRUKTUR: OrdnerEintrag = {
  id: 'root',
  name: 'Seehafer Elemente',
  type: 'folder',
  logo: 'google-drive.png',
  kinder: [
    {
      id: '01_angebote',
      name: '01_angebote',
      type: 'folder',
      logo: 'google-drive.png',
      kontext: 'Angebots-Ordner – enthält aktive, eingereichte und archivierte Angebote sowie die Standardvorlage.',
      kinder: [
        {
          id: 'angebote_aktiv',
          name: 'angebote_aktiv',
          type: 'folder',
          logo: 'google-drive.png',
          kontext: 'Aktive Angebote in Bearbeitung. Je Auftrag ein Unterordner: [JAHR_Kunde_Projekt].',
          kinder: [
            {
              id: 'angebote_aktiv_muster',
              name: '[JAHR_Kunde_Projekt]',
              type: 'folder',
              logo: 'google-drive.png',
              kontext: 'Projektordner für ein spezifisches Angebot – z.B. 2024_Müller_Dachsanierung.',
              kinder: [
                {
                  id: 'angebot_entwurf',
                  name: 'angebot_entwurf.docx',
                  type: 'docx',
                  logo: 'word.png',
                  kontext: 'Angebotsentwurf mit Leistungsbeschreibung, Materialpositionen, Arbeitsstunden und Gesamtpreis. Bitte ergänzen: Projektname, Kundendaten, Leistungsumfang, Endpreis.',
                },
                {
                  id: 'kalkulation_angebot',
                  name: 'kalkulation.sheet',
                  type: 'sheet',
                  logo: 'excel.png',
                  kontext: 'Kalkulations-Tabelle: Materialkosten (netto), Stundensätze, Gemeinkostenzuschlag (%), Gewinnmarge. Grundlage für den Angebotspreis.',
                },
                {
                  id: 'korrespondenz_angebot',
                  name: 'korrespondenz',
                  type: 'folder',
                  logo: 'gmail.png',
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
          logo: 'google-drive.png',
          kontext: 'Beim Kunden eingereichte Angebote – Status: Versendet, Entscheidung ausstehend.',
          kinder: [],
        },
        {
          id: 'angebote_archiv',
          name: 'angebote_archiv',
          type: 'folder',
          logo: 'google-drive.png',
          kontext: 'Abgeschlossene, angenommene oder abgelehnte Angebote. Referenz für Preisfindung und ähnliche Projekte.',
          kinder: [],
        },
        {
          id: 'angebote_vorlage',
          name: 'angebote_vorlage.docx',
          type: 'template',
          logo: 'word.png',
          kontext: 'Master-Angebotsvorlage Seehafer Elemente: Briefkopf, AGBs, Zahlungsbedingungen, Standard-Leistungspositionen. Basis für alle neuen Angebote.',
        },
      ],
    },
    {
      id: '02_ausschreibungen',
      name: '02_ausschreibungen',
      type: 'folder',
      logo: 'google-drive.png',
      kontext: 'Ausschreibungs-Ordner – LV-basierte Ausschreibungen, unterteilt nach Bearbeitungsstatus.',
      kinder: [
        {
          id: 'ausschreibungen_eingehend',
          name: 'ausschreibungen_eingehend',
          type: 'folder',
          logo: 'google-drive.png',
          kontext: 'Neu eingegangene Ausschreibungen zur Prüfung. Unterordner je LV: [LV-Ref_Bezeichnung].',
          kinder: [
            {
              id: 'lv_muster',
              name: '[LV-Ref_Bezeichnung]',
              type: 'folder',
              logo: 'google-drive.png',
              kontext: 'Ausschreibungsordner – Benennung: LV-Referenznummer_Projektbezeichnung.',
              kinder: [
                {
                  id: 'lv_original',
                  name: 'lv_original.pdf',
                  type: 'pdf',
                  logo: 'pdf.png',
                  kontext: 'Original-Leistungsverzeichnis (LV): alle Positionen, Mengen und technischen Anforderungen der Ausschreibung.',
                },
                {
                  id: 'kalkulation_lv',
                  name: 'kalkulation_entwurf.docx',
                  type: 'docx',
                  logo: 'word.png',
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
          logo: 'google-drive.png',
          kontext: 'Ausschreibungen in aktiver Kalkulation – LV wird gerade bearbeitet und Angebot vorbereitet.',
          kinder: [],
        },
        {
          id: 'ausschreibungen_eingereicht',
          name: 'ausschreibungen_eingereicht',
          type: 'folder',
          logo: 'google-drive.png',
          kontext: 'Eingereichte Ausschreibungsangebote – warten auf Zuschlag oder Absage.',
          kinder: [],
        },
      ],
    },
    {
      id: '03_rechnungen',
      name: '03_rechnungen',
      type: 'folder',
      logo: 'pdf.png',
      kontext: 'Rechnungs-Ordner – ausgestellte Kundenrechnungen nach Status: offen, bezahlt, Mahnwesen.',
      kinder: [
        {
          id: 'rechnungen_vorlage',
          name: 'rechnungen_vorlage.docx',
          type: 'template',
          logo: 'word.png',
          kontext: 'Rechnungsvorlage Seehafer Elemente: Briefkopf, Pflichtangaben nach UStG, Zahlungsziel, IBAN. Basis für neue Rechnungen.',
        },
        {
          id: 'rechnungen_offen',
          name: 'rechnungen_offen',
          type: 'folder',
          logo: 'pdf.png',
          kontext: 'Offene Rechnungen: gestellt, aber noch nicht bezahlt. Enthält Rechnungsdatum, Fälligkeit und Betrag.',
          kinder: [],
        },
        {
          id: 'rechnungen_bezahlt',
          name: 'rechnungen_bezahlt',
          type: 'folder',
          logo: 'pdf.png',
          kontext: 'Bezahlte Rechnungen – Zahlungseingang bestätigt. Archiv für Buchhaltung und Jahresabschluss.',
          kinder: [],
        },
        {
          id: 'rechnungen_mahnwesen',
          name: 'rechnungen_mahnwesen',
          type: 'folder',
          logo: 'pdf.png',
          kontext: 'Mahnwesen: überfällige Rechnungen, Mahnstufen (1. Mahnung, 2. Mahnung, Inkasso) und Mahnschreiben.',
          kinder: [],
        },
      ],
    },
    {
      id: '04_lieferanten',
      name: '04_lieferanten',
      type: 'folder',
      logo: 'google-drive.png',
      kontext: 'Lieferanten-Ordner – Stammdaten, Eingangsrechnungen und Verträge mit Lieferanten und Subunternehmern.',
      kinder: [
        {
          id: 'lieferanten_stammdaten',
          name: 'lieferanten_stammdaten',
          type: 'folder',
          logo: 'google-drive.png',
          kontext: 'Stammdaten je Lieferant: Kontaktdaten, Sortiment, Konditionen, Lieferzeiten, Zahlungsziele und interne Bewertung.',
          kinder: [
            {
              id: 'lieferant_muster',
              name: '[Lieferant_Name].docx',
              type: 'docx',
              logo: 'word.png',
              kontext: 'Lieferantenstammdaten: Name, Anschrift, Ansprechpartner, Telefon, E-Mail, Produktsortiment, Preiskonditionen, Mindestbestellmengen.',
            },
          ],
        },
        {
          id: 'lieferanten_eingangsrechnungen',
          name: 'lieferanten_eingangsrechnungen',
          type: 'folder',
          logo: 'pdf.png',
          kontext: 'Eingehende Lieferantenrechnungen zur Buchung, sortiert nach Lieferant und Datum.',
          kinder: [],
        },
        {
          id: 'lieferanten_vertraege',
          name: 'lieferanten_vertraege',
          type: 'folder',
          logo: 'google-drive.png',
          kontext: 'Rahmenverträge, Konditionsvereinbarungen und Lieferantenverträge.',
          kinder: [],
        },
      ],
    },
    {
      id: '05_leads',
      name: '05_leads',
      type: 'folder',
      logo: 'excel.png',
      kontext: 'Lead-Verwaltung – alle potenziellen Kunden und Neuprojekte.',
      kinder: [
        {
          id: 'leads_sheet',
          name: 'leads_seehafer.sheet',
          type: 'sheet',
          logo: 'excel.png',
          kontext: 'Lead-Datenbank (Google Sheet): Kontaktdaten, Projekttyp, Auftragspotenzial, Status (neu / kontaktiert / qualifiziert / verloren) und nächste Schritte.',
        },
      ],
    },
    {
      id: '_kontext',
      name: '_kontext',
      type: 'folder',
      logo: 'google-drive.png',
      kontext: 'Kontext-Ordner – Basisdokumente als Hintergrundwissen für KI-Prompts. Immer miteinbinden. Maximal 5.000 Tokens.',
      kinder: [
        {
          id: 'briefpapier',
          name: 'briefpapier',
          type: 'folder',
          logo: 'word.png',
          kontext: 'Briefkopf-Vorlagen von Seehafer Elemente für formelle Korrespondenz.',
          kinder: [
            {
              id: 'briefpapier_docx',
              name: 'briefpapier_seehafer.docx',
              type: 'template',
              logo: 'word.png',
              kontext: 'Offizielles Briefpapier: Logo, Firmenname, Anschrift, Telefon, E-Mail, Website, Steuernummer, IBAN. Für alle formellen Dokumente verwenden.',
            },
          ],
        },
        {
          id: 'preislisten',
          name: 'preislisten',
          type: 'folder',
          logo: 'excel.png',
          kontext: 'Aktuelle Preislisten für Materialien, Leistungen und Stundensätze.',
          kinder: [
            {
              id: 'preisliste_sheet',
              name: 'preisliste_aktuell.sheet',
              type: 'sheet',
              logo: 'excel.png',
              kontext: 'Aktuelle Preisliste: Stundensätze (Monteur, Geselle, Meister), Materialpreise häufig verwendeter Artikel, Pauschalpreise für Standardleistungen.',
            },
          ],
        },
        {
          id: 'firmeninfo',
          name: 'firmeninfo.docx',
          type: 'docx',
          logo: 'word.png',
          kontext: 'Firmenprofil Seehafer Elemente: Gründungsjahr, Kernkompetenzen, Zertifizierungen (z.B. DGUV), Referenzprojekte, Mitarbeiterzahl, Einzugsgebiet und USPs. Immer als Hintergrundwissen einbinden.',
        },
        {
          id: 'ansprechpartner',
          name: 'ansprechpartner.docx',
          type: 'docx',
          logo: 'word.png',
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
