/**
 * Konvertiert einen ExportPayload in eine menschenlesbare Markdown-Datei.
 */

import type { ExportPayload } from './full-export';

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '–';
  try {
    return new Date(iso).toLocaleDateString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatCurrency(val: number | null | undefined): string {
  if (val === null || val === undefined) return '–';
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(val);
}

function row(cells: (string | number | null | undefined)[]): string {
  return '| ' + cells.map((c) => String(c ?? '–').replace(/\|/g, '\\|')).join(' | ') + ' |';
}

function tableHeader(cols: string[]): string {
  return row(cols) + '\n| ' + cols.map(() => '---').join(' | ') + ' |';
}

function section(title: string, content: string): string {
  return `\n## ${title}\n\n${content}\n`;
}

function subsection(title: string, content: string): string {
  return `\n### ${title}\n\n${content}\n`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

function fuhrparkToMd(data: ExportPayload['fuhrpark']): string {
  if (!data) return '';
  const parts: string[] = [];

  // Fahrzeuge
  if (data.fahrzeuge.length > 0) {
    const header = tableHeader(['Kennzeichen', 'Marke', 'Modell', 'Jahr', 'Kraftstoff', 'Status', 'TÜV fällig', 'Km-Stand', 'Leasing']);
    const rows = (data.fahrzeuge as AnyRecord[]).map((v) =>
      row([v.license_plate, v.brand, v.model, v.year, v.fuel_type, v.status, formatDate(v.tuv_due_date), v.mileage, v.is_leased ? 'Ja' : 'Nein'])
    );
    parts.push(subsection(`Fahrzeuge (${data.fahrzeuge.length})`, header + '\n' + rows.join('\n')));
  } else {
    parts.push(subsection('Fahrzeuge', '_Keine Fahrzeuge vorhanden._'));
  }

  // Fahrer
  if (data.fahrer.length > 0) {
    const header = tableHeader(['Nachname', 'Vorname', 'E-Mail', 'Führerschein', 'Ablauf', 'Status']);
    const rows = (data.fahrer as AnyRecord[]).map((d) =>
      row([d.last_name, d.first_name, d.email, d.license_class, formatDate(d.license_expiry), d.status])
    );
    parts.push(subsection(`Fahrer (${data.fahrer.length})`, header + '\n' + rows.join('\n')));
  } else {
    parts.push(subsection('Fahrer', '_Keine Fahrer vorhanden._'));
  }

  // Zuordnungen
  if (data.fahrzeug_fahrer_zuordnungen.length > 0) {
    const header = tableHeader(['Fahrzeug-ID', 'Fahrer', 'Primär', 'Zugewiesen am']);
    const rows = (data.fahrzeug_fahrer_zuordnungen as AnyRecord[]).map((z) => {
      const fahrer = z.driver as AnyRecord | null;
      return row([z.vehicle_id, fahrer ? `${fahrer.first_name} ${fahrer.last_name}` : z.driver_id, z.is_primary ? 'Ja' : 'Nein', formatDate(z.assigned_at)]);
    });
    parts.push(subsection(`Fahrzeug-Fahrer-Zuordnungen (${data.fahrzeug_fahrer_zuordnungen.length})`, header + '\n' + rows.join('\n')));
  }

  // Termine
  if (data.termine.length > 0) {
    const header = tableHeader(['Fahrzeug-ID', 'Termintyp', 'Fälligkeitsdatum', 'Status', 'Notizen']);
    const rows = (data.termine as AnyRecord[]).map((t) => {
      const typ = t.appointment_type as AnyRecord | null;
      return row([t.vehicle_id, typ?.name ?? t.appointment_type_id, formatDate(t.due_date), t.status, t.notes]);
    });
    parts.push(subsection(`Wartungstermine (${data.termine.length})`, header + '\n' + rows.join('\n')));
  }

  // Schäden
  if (data.schaeden.length > 0) {
    const header = tableHeader(['Fahrzeug-ID', 'Schadenstyp', 'Datum', 'Status', 'Kosten', 'Beschreibung']);
    const rows = (data.schaeden as AnyRecord[]).map((s) => {
      const typ = s.damage_type as AnyRecord | null;
      return row([s.vehicle_id, typ?.name ?? s.damage_type_id, formatDate(s.date), s.status, formatCurrency(s.repair_cost), s.description]);
    });
    parts.push(subsection(`Schäden (${data.schaeden.length})`, header + '\n' + rows.join('\n')));
  }

  // Kosten
  if (data.kosten.length > 0) {
    const header = tableHeader(['Fahrzeug-ID', 'Kostentyp', 'Datum', 'Betrag', 'Beschreibung']);
    const rows = (data.kosten as AnyRecord[]).map((k) => {
      const typ = k.cost_type as AnyRecord | null;
      return row([k.vehicle_id, typ?.name ?? k.cost_type_id, formatDate(k.date), formatCurrency(k.amount), k.description]);
    });
    parts.push(subsection(`Kosten (${data.kosten.length})`, header + '\n' + rows.join('\n')));
  }

  // Dokumente
  if (data.dokumente_metadaten.length > 0) {
    const header = tableHeader(['Name', 'Typ', 'Entität', 'Größe (KB)', 'Hochgeladen am']);
    const rows = (data.dokumente_metadaten as AnyRecord[]).map((d) => {
      const typ = d.document_type as AnyRecord | null;
      return row([d.name, typ?.name ?? d.document_type_id, d.entity_type, Math.round((d.file_size ?? 0) / 1024), formatDate(d.uploaded_at)]);
    });
    parts.push(subsection(`Dokumente – Metadaten (${data.dokumente_metadaten.length})`, header + '\n' + rows.join('\n')));
  }

  // Führerscheinkontrolle
  if (data.fuehrerscheinkontrolle_mitarbeiter.length > 0) {
    const header = tableHeader(['Nachname', 'Vorname', 'Personalnr.', 'Führerscheinklassen', 'Ablauf', 'Status']);
    const rows = (data.fuehrerscheinkontrolle_mitarbeiter as AnyRecord[]).map((m) =>
      row([m.last_name, m.first_name, m.personnel_number, m.license_classes, formatDate(m.license_expiry_date), m.status])
    );
    parts.push(subsection(`Führerscheinkontrolle – Mitarbeiter (${data.fuehrerscheinkontrolle_mitarbeiter.length})`, header + '\n' + rows.join('\n')));
  }

  if (data.fuehrerscheinkontrolle_kontrollen.length > 0) {
    const header = tableHeader(['Fahrer/Mitarbeiter-ID', 'Prüfdatum', 'Nächste Prüfung', 'Geprüft von', 'Bestanden']);
    const rows = (data.fuehrerscheinkontrolle_kontrollen as AnyRecord[]).map((k) => {
      const pruefer = k.checked_by as AnyRecord | null;
      const personId = k.driver_id ?? k.employee_id;
      return row([personId, formatDate(k.check_date), formatDate(k.next_check_due), pruefer?.name ?? k.checked_by_id, k.license_verified ? 'Ja' : 'Nein']);
    });
    parts.push(subsection(`Führerscheinkontrolle – Durchführungen (${data.fuehrerscheinkontrolle_kontrollen.length})`, header + '\n' + rows.join('\n')));
  }

  // UVV
  if (data.uvv_unterweisungen.length > 0) {
    const header = tableHeader(['Fahrer-ID', 'Unterweisungsdatum', 'Nächste Unterweisung', 'Unterwiesen von', 'Themen']);
    const rows = (data.uvv_unterweisungen as AnyRecord[]).map((u) => {
      const inst = u.instructed_by as AnyRecord | null;
      return row([u.driver_id, formatDate(u.check_date), formatDate(u.next_check_due), inst?.name ?? u.instructed_by_id, u.topics]);
    });
    parts.push(subsection(`UVV-Unterweisungen (${data.uvv_unterweisungen.length})`, header + '\n' + rows.join('\n')));
  }

  return parts.join('');
}

function recruitingToMd(data: ExportPayload['recruiting']): string {
  if (!data) return '';
  const parts: string[] = [];

  if (data.stellen.length > 0) {
    const header = tableHeader(['Titel', 'Prämie', 'Aktiv', 'Erstellt am']);
    const rows = (data.stellen as AnyRecord[]).map((s) =>
      row([s.title, formatCurrency(s.praemie_betrag), s.active ? 'Ja' : 'Nein', formatDate(s.created_at)])
    );
    parts.push(subsection(`Stellen (${data.stellen.length})`, header + '\n' + rows.join('\n')));
  } else {
    parts.push(subsection('Stellen', '_Keine Stellen vorhanden._'));
  }

  if (data.empfehlungen.length > 0) {
    const header = tableHeader(['Ref-Code', 'Kandidat', 'Empfehler', 'Stelle', 'Status', 'Prämie', 'Ausgezahlt am']);
    const rows = (data.empfehlungen as AnyRecord[]).map((e) => {
      const stelle = e.stelle as AnyRecord | null;
      return row([e.ref_code, e.kandidat_name, e.empfehler_name, stelle?.title ?? e.stelle_id, e.status, formatCurrency(e.praemie_betrag), formatDate(e.ausgezahlt_am)]);
    });
    parts.push(subsection(`Empfehlungen (${data.empfehlungen.length})`, header + '\n' + rows.join('\n')));
  } else {
    parts.push(subsection('Empfehlungen', '_Keine Empfehlungen vorhanden._'));
  }

  return parts.join('');
}

function affiliateToMd(data: ExportPayload['affiliate']): string {
  if (!data) return '';
  const parts: string[] = [];

  if (data.handwerker.length > 0) {
    const header = tableHeader(['Name', 'E-Mail', 'Telefon', 'Provision %', 'Aktiv']);
    const rows = (data.handwerker as AnyRecord[]).map((h) =>
      row([h.name, h.email, h.telefon, `${h.provision_prozent}%`, h.active ? 'Ja' : 'Nein'])
    );
    parts.push(subsection(`Handwerker (${data.handwerker.length})`, header + '\n' + rows.join('\n')));
  } else {
    parts.push(subsection('Handwerker', '_Keine Handwerker vorhanden._'));
  }

  if (data.empfehlungen.length > 0) {
    const header = tableHeader(['Ref-Code', 'Kunde', 'Empfehler', 'Handwerker', 'Status', 'Rechnungsbetrag', 'Provision', 'Ausgezahlt am']);
    const rows = (data.empfehlungen as AnyRecord[]).map((e) => {
      const hw = e.handwerker as AnyRecord | null;
      return row([e.ref_code, e.kunde_name, e.empfehler_name, hw?.name ?? e.handwerker_id, e.status, formatCurrency(e.rechnungsbetrag), formatCurrency(e.provision_betrag), formatDate(e.ausgezahlt_am)]);
    });
    parts.push(subsection(`Empfehlungen (${data.empfehlungen.length})`, header + '\n' + rows.join('\n')));
  } else {
    parts.push(subsection('Empfehlungen', '_Keine Empfehlungen vorhanden._'));
  }

  return parts.join('');
}

function roiToMd(data: ExportPayload['roi']): string {
  if (!data) return '';
  const parts: string[] = [];

  if (data.konfiguration) {
    const cfg = data.konfiguration as AnyRecord;
    const lines = [
      `- **Homepage-Kosten:** ${formatCurrency(cfg.homepage_kosten)}`,
      `- **Ads Setup-Kosten:** ${formatCurrency(cfg.ads_setup_kosten)}`,
      `- **Google Ads Budget:** ${formatCurrency(cfg.google_ads_budget)}`,
      `- **Pflegekosten/Monat:** ${formatCurrency(cfg.pflegekosten_monat)}`,
      `- **Operative Marge:** ${cfg.operative_marge_pct}%`,
      `- **Ø Aufträge/Monat:** ${cfg.avg_auftraege_monat}`,
    ].join('\n');
    parts.push(subsection('Konfiguration', lines));
  }

  if (data.jobs.length > 0) {
    const header = tableHeader(['Datum', 'Jahr', 'Monat', 'Kundenname', 'Objektadresse', 'Tätigkeit', 'Herkunft', 'Netto-Umsatz', 'Rohertrag']);
    const rows = (data.jobs as AnyRecord[]).map((j) =>
      row([formatDate(j.datum), j.jahr, j.monat, j.kundenname, j.objektadresse, j.taetigkeit, j.herkunft, formatCurrency(j.netto_umsatz), formatCurrency(j.rohertrag)])
    );
    parts.push(subsection(`Aufträge (${data.jobs.length})`, header + '\n' + rows.join('\n')));
  } else {
    parts.push(subsection('Aufträge', '_Keine Aufträge vorhanden._'));
  }

  if (data.ausgaben.length > 0) {
    const header = tableHeader(['Datum', 'Kanal', 'Betrag', 'Art', 'Notiz']);
    const rows = (data.ausgaben as AnyRecord[]).map((a) =>
      row([formatDate(a.purchased_at), a.channel_name, formatCurrency(a.amount), a.pricing, a.note])
    );
    parts.push(subsection(`Ausgaben (${data.ausgaben.length})`, header + '\n' + rows.join('\n')));
  }

  return parts.join('');
}

function datenkodierungToMd(data: unknown[] | undefined): string {
  if (!data || data.length === 0) return subsection('Datenkodierung', '_Keine Einträge vorhanden._');
  const header = tableHeader(['Code', 'Name', 'Adresse', 'Tags', 'Erstellt am']);
  const rows = (data as AnyRecord[]).map((d) =>
    row([d.code, d.name, d.adresse, (d.tags ?? []).join(', '), formatDate(d.created_at)])
  );
  return subsection(`Einträge (${data.length})`, header + '\n' + rows.join('\n'));
}

function automationenToMd(data: unknown[] | undefined): string {
  if (!data || data.length === 0) return subsection('Automationen', '_Keine Knoten vorhanden._');
  const header = tableHeader(['Titel', 'App-Typ', 'Beschreibung', 'Hat Prompt', 'Aktiv']);
  const rows = (data as AnyRecord[]).map((n) =>
    row([n.title, n.app_type, n.description, n.prompt_template ? 'Ja' : 'Nein', n.is_active ? 'Ja' : 'Nein'])
  );
  return subsection(`Knoten (${data.length})`, header + '\n' + rows.join('\n'));
}

/**
 * Konvertiert einen ExportPayload in einen vollständigen Markdown-String.
 */
export function exportPayloadToMarkdown(payload: ExportPayload): string {
  const { meta } = payload;
  const lines: string[] = [];

  lines.push(`# Daten-Export – ${meta.firma_name}`);
  lines.push('');
  lines.push(`**Exportiert am:** ${new Date(meta.exportiert_am).toLocaleString('de-DE')}`);
  lines.push(`**Firma:** ${meta.firma_name} (\`${meta.firma_id}\`)`);
  lines.push(`**Version:** ${meta.version}`);
  lines.push('');
  lines.push('---');

  // Zusammenfassung
  const summary: string[] = ['| Modul | Datensätze |', '| --- | --- |'];
  if (payload.fuhrpark) {
    const f = payload.fuhrpark;
    summary.push(`| Fuhrpark – Fahrzeuge | ${f.fahrzeuge.length} |`);
    summary.push(`| Fuhrpark – Fahrer | ${f.fahrer.length} |`);
    summary.push(`| Fuhrpark – Termine | ${f.termine.length} |`);
    summary.push(`| Fuhrpark – Schäden | ${f.schaeden.length} |`);
    summary.push(`| Fuhrpark – Kosten | ${f.kosten.length} |`);
    summary.push(`| Fuhrpark – Dokumente | ${f.dokumente_metadaten.length} |`);
    summary.push(`| Führerscheinkontrolle – Mitarbeiter | ${f.fuehrerscheinkontrolle_mitarbeiter.length} |`);
    summary.push(`| Führerscheinkontrolle – Kontrollen | ${f.fuehrerscheinkontrolle_kontrollen.length} |`);
    summary.push(`| UVV-Unterweisungen | ${f.uvv_unterweisungen.length} |`);
  }
  if (payload.recruiting) {
    summary.push(`| Recruiting – Stellen | ${payload.recruiting.stellen.length} |`);
    summary.push(`| Recruiting – Empfehlungen | ${payload.recruiting.empfehlungen.length} |`);
  }
  if (payload.affiliate) {
    summary.push(`| Affiliate – Handwerker | ${payload.affiliate.handwerker.length} |`);
    summary.push(`| Affiliate – Empfehlungen | ${payload.affiliate.empfehlungen.length} |`);
  }
  if (payload.roi) {
    summary.push(`| ROI – Aufträge | ${payload.roi.jobs.length} |`);
    summary.push(`| ROI – Ausgaben | ${payload.roi.ausgaben.length} |`);
  }
  if (payload.datenkodierung) {
    summary.push(`| Datenkodierung | ${payload.datenkodierung.length} |`);
  }
  if (payload.automationen) {
    summary.push(`| Automatisierungen | ${payload.automationen.length} |`);
  }

  lines.push(section('Übersicht', summary.join('\n')));

  if (payload.fuhrpark) lines.push(section('Fuhrpark', fuhrparkToMd(payload.fuhrpark)));
  if (payload.recruiting) lines.push(section('Recruiting', recruitingToMd(payload.recruiting)));
  if (payload.affiliate) lines.push(section('Affiliate', affiliateToMd(payload.affiliate)));
  if (payload.roi) lines.push(section('ROI Rechner', roiToMd(payload.roi)));
  if (payload.datenkodierung) lines.push(section('Datenkodierung', datenkodierungToMd(payload.datenkodierung)));
  if (payload.automationen) lines.push(section('Automatisierungen', automationenToMd(payload.automationen)));

  lines.push('\n---');
  lines.push('_Dieser Export wurde automatisch von GruppenwerkUnited generiert._');

  return lines.join('\n');
}
