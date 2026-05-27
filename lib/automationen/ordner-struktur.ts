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
  name: 'Seehafer_Ablage',
  type: 'folder',
  logo: 'google-drive.png',
  kinder: [
    {
      id: '_db',
      name: '_DB',
      type: 'folder',
      logo: 'google-drive.png',
      kontext: 'Datenbank-Ordner – enthält Preisliste, Briefpapier, AGB und Textbausteine. Immer als Kontext einbinden wenn Dokumente erstellt oder berechnet werden.',
      kinder: [
        {
          id: 'db_preisliste',
          name: 'Preisliste.xlsx',
          type: 'sheet',
          logo: 'excel.png',
          kontext: 'Aktuelle Preisliste: Stundensätze (Monteur, Geselle, Meister), Materialpreise und Pauschalpreise für Standardleistungen. Basis für alle Kalkulation.',
        },
        {
          id: 'db_briefpapier',
          name: 'Briefpapier.docx',
          type: 'template',
          logo: 'word.png',
          kontext: 'Offizielles Briefpapier: Logo, Firmenname, Anschrift, Telefon, E-Mail, Steuernummer, IBAN. Für alle formellen Dokumente als Vorlage verwenden.',
        },
        {
          id: 'db_agb',
          name: 'AGB.pdf',
          type: 'pdf',
          logo: 'pdf.png',
          kontext: 'Allgemeine Geschäftsbedingungen – bei Angeboten und Auftragsbestätigungen als Anlage beifügen.',
        },
        {
          id: 'db_textbausteine',
          name: 'Textbausteine.docx',
          type: 'docx',
          logo: 'word.png',
          kontext: 'Standardtexte für häufig verwendete Formulierungen: Angebots-Einleitungen, Zahlungsbedingungen, Mängelrüge-Antworten, Mahnschreiben.',
        },
      ],
    },
    {
      id: '_vorlagen',
      name: '_Vorlagen',
      type: 'folder',
      logo: 'google-drive.png',
      kontext: 'Blanko-Vorlagen für alle Dokumententypen. Claude lädt die passende Vorlage, füllt sie aus und speichert das fertige Dokument im Kundenordner.',
      kinder: [
        {
          id: 'vorlage_angebot',
          name: 'VORLAGE_Angebot.docx',
          type: 'template',
          logo: 'word.png',
          kontext: 'Angebotsvorlage: Briefkopf, Leistungsbeschreibung, Materialpositionen, Arbeitsstunden, Gesamtpreis, AGBs und Zahlungsbedingungen. Schema: ANG_{JJJJ-NNNN}_{CODE}_{INFO}.pdf',
        },
        {
          id: 'vorlage_rechnung',
          name: 'VORLAGE_Rechnung.docx',
          type: 'template',
          logo: 'word.png',
          kontext: 'Rechnungsvorlage: Pflichtangaben nach UStG, Rechnungsnummer, Leistungszeitraum, Zahlungsziel, IBAN. Schema: RE_{JJJJ-NNNN}_{CODE}.pdf',
        },
        {
          id: 'vorlage_aufmass',
          name: 'VORLAGE_Aufmass.xlsx',
          type: 'template',
          logo: 'excel.png',
          kontext: 'Aufmaß-Tabelle: Raumbezeichnung, Fläche/Länge/Anzahl je Position, Einheit, Einzelpreis, Gesamtpreis. Schema: AUF_{JJJJ-NNNN}_{CODE}.xlsx',
        },
        {
          id: 'vorlage_abnahme',
          name: 'VORLAGE_Abnahmeprotokoll.docx',
          type: 'template',
          logo: 'word.png',
          kontext: 'Abnahmeprotokoll: Projektbezeichnung, Abnahmedatum, anwesende Personen, Mängelliste, Nacherfüllungsfristen, Unterschriften. Schema: APR_{JJJJ-NNNN}_{CODE}.pdf',
        },
        {
          id: 'vorlage_lieferschein',
          name: 'VORLAGE_Lieferschein.docx',
          type: 'template',
          logo: 'word.png',
          kontext: 'Lieferscheinvorlage: Lieferdatum, Empfänger, Positionen mit Menge und Bezeichnung, Empfangsbestätigung. Schema: LS_{JJJJ-NNNN}_{CODE}.pdf',
        },
      ],
    },
    {
      id: 'kunden',
      name: 'Kunden',
      type: 'folder',
      logo: 'google-drive.png',
      kontext: 'Hauptordner – enthält ca. 80% aller Dateien. Je Kunde ein Unterordner: {JJJJ}_{CODE}. Dateiname-Schema: {TYP}_{JJJJ-NNNN}_{CODE}_{INFO}.ext',
      kinder: [
        {
          id: 'kunden_sh_c3d4',
          name: '2025_SH-C3D4',
          type: 'folder',
          logo: 'google-drive.png',
          kontext: 'Kundenordner Seehafer Elemente – Code SH-C3D4. Enthält alle Dokumente dieses Kunden: Angebote, Rechnungen, Aufmaße, Fotos, Korrespondenz.',
          kinder: [
            {
              id: 'sh_ang_0042',
              name: 'ANG_2025-0042_SH-C3D4_Fenster.pdf',
              type: 'pdf',
              logo: 'pdf.png',
              kontext: 'Angebot Nr. 2025-0042 für SH-C3D4 – Projekt Fenster. Eingereichtes Angebot mit Leistungsumfang und Preis.',
            },
            {
              id: 'sh_ab_0042',
              name: 'AB_2025-0042_SH-C3D4.pdf',
              type: 'pdf',
              logo: 'pdf.png',
              kontext: 'Auftragsbestätigung Nr. 2025-0042 für SH-C3D4. Bestätigt Leistungsumfang, Ausführungstermin und Zahlungsbedingungen.',
            },
            {
              id: 'sh_re_0042',
              name: 'RE_2025-0042_SH-C3D4.pdf',
              type: 'pdf',
              logo: 'pdf.png',
              kontext: 'Rechnung Nr. 2025-0042 für SH-C3D4. Schlussrechnung nach Abnahme – Zahlungsziel 14 Tage.',
            },
            {
              id: 'sh_auf_0042',
              name: 'AUF_2025-0042_SH-C3D4.xlsx',
              type: 'sheet',
              logo: 'excel.png',
              kontext: 'Aufmaß Nr. 2025-0042 für SH-C3D4. Gemessene Mengen als Grundlage für Abrechnung.',
            },
            {
              id: 'sh_foto_0042',
              name: 'FOTO_2025-0042_SH-C3D4_Vorher.jpg',
              type: 'pdf',
              logo: 'pdf.png',
              kontext: 'Vorher-Foto der Baustelle für Projekt 2025-0042 – Dokumentation des Ausgangszustands.',
            },
          ],
        },
        {
          id: 'kunden_gw_cx9y',
          name: '2025_GW-CX9Y-QHJ7',
          type: 'folder',
          logo: 'google-drive.png',
          kontext: 'Kundenordner Gruppenwerk – Code GW-CX9Y-QHJ7. Übergreifendes Projekt.',
          kinder: [],
        },
      ],
    },
    {
      id: 'ausschreibungen',
      name: 'Ausschreibungen',
      type: 'folder',
      logo: 'google-drive.png',
      kontext: 'Ausschreibungsordner – VOB-pflichtige und private Ausschreibungen. Unterordner-Format: {JJJJ}-{VOB|PRIV}_{Auftraggeber}_{Projekt}',
      kinder: [
        {
          id: 'ausschreibung_vob_altona',
          name: '2025-VOB_Schulamt-Altona_Fenster',
          type: 'folder',
          logo: 'google-drive.png',
          kontext: 'VOB-Ausschreibung 2025 – Schulamt Altona, Fensterarbeiten. Öffentliche Vergabe nach VOB/A. Enthält LV-Original, Kalkulation und eingereichtes Angebot.',
          kinder: [],
        },
        {
          id: 'ausschreibung_priv_wandsbek',
          name: '2025-PRIV_Saga-Wandsbek_Tueren',
          type: 'folder',
          logo: 'google-drive.png',
          kontext: 'Private Ausschreibung 2025 – SAGA Wandsbek, Türenarbeiten. Freihändige Vergabe. Enthält LV-Original, Kalkulation und eingereichtes Angebot.',
          kinder: [],
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
