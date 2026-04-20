export interface AffiliateQuittungData {
  type: 'affiliate';
  ref_code: string;
  datum: string;
  empfaenger_name: string;
  empfaenger_email: string;
  affiliate_partner: string;
  rechnungsbetrag: number | null;
  provision_betrag: number | null;
  iban: string | null;
  bic: string | null;
  kontoinhaber: string | null;
  bank_name: string | null;
}

export interface RecruitingQuittungData {
  type: 'recruiting';
  ref_code: string;
  datum: string;
  empfaenger_name: string;
  empfaenger_email: string;
  stelle_title: string;
  kandidat_name: string;
  praemie_betrag: number | null;
  iban: string | null;
  bic: string | null;
  kontoinhaber: string | null;
  bank_name: string | null;
}

export type QuittungData = AffiliateQuittungData | RecruitingQuittungData;

export async function generateQuittung(data: QuittungData): Promise<void> {
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const margin = 22;
  const rightCol = pw - margin;
  let y = 22;

  const eur = (v: number | null): string =>
    v != null
      ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v)
      : '–';

  const fmt = (iso: string): string => {
    try {
      return new Date(iso).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  const today = fmt(new Date().toISOString());

  const divider = (thick = false): void => {
    doc.setLineWidth(thick ? 0.5 : 0.2);
    doc.setDrawColor(220, 215, 205);
    doc.line(margin, y, rightCol, y);
    y += thick ? 10 : 8;
  };

  const labelValue = (label: string, value: string): void => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(110, 105, 95);
    doc.text(label, margin, y);
    doc.setTextColor(30, 28, 25);
    doc.text(value, margin + 48, y);
    y += 6;
  };

  const sectionHeading = (text: string): void => {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(160, 155, 145);
    doc.text(text.toUpperCase(), margin, y);
    doc.setTextColor(30, 28, 25);
    y += 6;
  };

  // ── Kopfzeile ──────────────────────────────────────────────────────
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 28, 25);
  doc.text('GruppenwerkUnited', margin, y);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 145, 135);
  doc.text(today, rightCol, y, { align: 'right' });

  y += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 95, 66);
  doc.text(
    data.type === 'affiliate' ? 'Affiliate · Auszahlungsquittung' : 'Recruiting · Auszahlungsquittung',
    margin,
    y
  );
  doc.setTextColor(30, 28, 25);

  y += 10;
  divider(true);

  // ── Metadaten ─────────────────────────────────────────────────────
  labelValue('Quittungs-Nr.', data.ref_code);
  labelValue('Auszahlungsdatum', fmt(data.datum));

  y += 4;
  divider();

  // ── Empfänger ─────────────────────────────────────────────────────
  sectionHeading('Empfänger');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 28, 25);
  doc.text(data.empfaenger_name, margin, y);
  y += 6;

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 95, 85);
  doc.text(data.empfaenger_email, margin, y);
  y += 10;

  divider();

  // ── Leistungsdetails ──────────────────────────────────────────────
  sectionHeading('Leistung');

  if (data.type === 'affiliate') {
    labelValue('Affiliate-Partner', data.affiliate_partner);
    labelValue('Referenzcode', data.ref_code);
    if (data.rechnungsbetrag != null) {
      labelValue('Rechnungsbetrag', eur(data.rechnungsbetrag));
    }
  } else {
    labelValue('Stelle', data.stelle_title);
    labelValue('Kandidat', data.kandidat_name);
    labelValue('Referenzcode', data.ref_code);
  }

  y += 6;
  divider(true);

  // ── Betrag (groß) ─────────────────────────────────────────────────
  const betragLabel = data.type === 'affiliate' ? 'Auszahlungsbetrag (Provision)' : 'Auszahlungsbetrag (Prämie)';
  const betragValue = data.type === 'affiliate' ? data.provision_betrag : data.praemie_betrag;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(110, 105, 95);
  doc.text(betragLabel, margin, y);

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 28, 25);
  doc.text(eur(betragValue), rightCol, y + 5, { align: 'right' });

  y += 18;
  divider(true);

  // ── Bankverbindung ────────────────────────────────────────────────
  sectionHeading('Zahlungsempfänger');

  if (data.iban || data.kontoinhaber || data.bank_name) {
    if (data.kontoinhaber) labelValue('Kontoinhaber', data.kontoinhaber);
    if (data.bank_name) labelValue('Bank', data.bank_name);
    if (data.iban) labelValue('IBAN', data.iban);
    if (data.bic) labelValue('BIC', data.bic);
  } else {
    labelValue('PayPal', data.empfaenger_email);
  }

  y += 14;
  divider();

  // ── Unterschrift ──────────────────────────────────────────────────
  doc.setLineWidth(0.3);
  doc.setDrawColor(180, 175, 165);
  doc.line(margin, y, margin + 68, y);
  doc.line(margin + 80, y, margin + 148, y);
  y += 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(155, 150, 140);
  doc.text('Datum', margin, y);
  doc.text('Unterschrift', margin + 80, y);

  // ── Fußzeile ──────────────────────────────────────────────────────
  doc.setFontSize(7.5);
  doc.setTextColor(195, 190, 180);
  doc.text(
    `GruppenwerkUnited · Auszahlungsquittung · erstellt am ${today}`,
    pw / 2,
    ph - 10,
    { align: 'center' }
  );

  // ── Speichern ─────────────────────────────────────────────────────
  const suffix = data.type === 'affiliate' ? 'provision' : 'praemie';
  doc.save(`quittung-${suffix}-${data.ref_code.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
