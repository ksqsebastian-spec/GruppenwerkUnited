import type { DashboardRow } from './types'
import { getUrgencyLabel } from './utils'

// Dynamische Imports für PDF-Bibliotheken (nur client-seitig nutzbar)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsPDFInstance = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AutoTableFn = (doc: JsPDFInstance, options: Record<string, unknown>) => void

/**
 * Erstellt ein PDF mit allen Ausschreibungen eines Unternehmens.
 */
export async function generateCompanyPdf(companyName: string, tenders: DashboardRow[]): Promise<JsPDFInstance> {
  const { jsPDF } = await import('jspdf') as { jsPDF: new () => JsPDFInstance }
  const autoTableModule = await import('jspdf-autotable') as { default: AutoTableFn }
  const autoTable = autoTableModule.default

  const doc: JsPDFInstance = new jsPDF()
  const today = new Date().toLocaleDateString('de-DE')

  // Kopfzeile
  doc.setFontSize(18)
  doc.setTextColor(31, 78, 121)
  doc.text('VOB Ausschreibungen', 14, 20)
  doc.setFontSize(14)
  doc.text(`Übersicht für ${companyName}`, 14, 30)
  doc.setFontSize(10)
  doc.setTextColor(100, 116, 139)
  doc.text(`Generiert am ${today}`, 14, 38)

  doc.setDrawColor(31, 78, 121)
  doc.setLineWidth(0.5)
  doc.line(14, 42, 196, 42)

  let y = 50

  if (tenders.length === 0) {
    doc.setFontSize(12)
    doc.setTextColor(100)
    doc.text('Aktuell keine passenden Ausschreibungen.', 14, y)
  } else {
    for (const tender of tenders) {
      if (y > 250) {
        doc.addPage()
        y = 20
      }

      doc.setFontSize(11)
      doc.setTextColor(30, 41, 59)
      const titleLines = doc.splitTextToSize(tender.title, 170)
      doc.text(titleLines, 14, y)
      y += titleLines.length * 5 + 2

      doc.setFontSize(9)
      doc.setTextColor(100, 116, 139)
      if (tender.authority) {
        doc.text(`Auftraggeber: ${tender.authority}`, 14, y)
        y += 5
      }
      if (tender.deadline) {
        const urgencyLabel = getUrgencyLabel(tender.urgency)
        doc.text(`Abgabefrist: ${tender.deadline} ${urgencyLabel ? `(${urgencyLabel})` : ''}`, 14, y)
        y += 5
      }
      if (tender.category) {
        doc.text(`Gewerk: ${tender.category}`, 14, y)
        y += 5
      }
      if (tender.relevance) {
        doc.text(`Relevanz: ${tender.relevance}`, 14, y)
        y += 5
      }
      if (tender.reason) {
        const reasonLines = doc.splitTextToSize(`Begründung: ${tender.reason}`, 170)
        doc.text(reasonLines, 14, y)
        y += reasonLines.length * 4 + 2
      }

      doc.setTextColor(31, 78, 121)
      doc.setFontSize(8)
      doc.text(tender.url, 14, y)
      y += 8

      doc.setDrawColor(226, 232, 240)
      doc.setLineWidth(0.2)
      doc.line(14, y, 196, y)
      y += 8
    }

    // Zusammenfassungstabelle
    if (y > 230) {
      doc.addPage()
      y = 20
    }

    y += 5
    doc.setFontSize(12)
    doc.setTextColor(31, 78, 121)
    doc.text('Zusammenfassung', 14, y)
    y += 8

    const urgent = tenders.filter(t => t.urgency === 'urgent').length
    const soon = tenders.filter(t => t.urgency === 'soon').length
    const normal = tenders.filter(t => t.urgency === 'normal').length

    autoTable(doc, {
      startY: y,
      head: [['Kategorie', 'Anzahl']],
      body: [
        ['Gesamt', String(tenders.length)],
        ['Dringend (≤ 7 Tage)', String(urgent)],
        ['Bald (8–14 Tage)', String(soon)],
        ['Normal (> 14 Tage)', String(normal)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [31, 78, 121] },
      margin: { left: 14 },
    })
  }

  // Fußzeile auf jeder Seite
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text(
      `Generiert am ${today} — VOB Monitor Gruppenwerk — Seite ${i}/${pageCount}`,
      14,
      285
    )
  }

  return doc
}

/**
 * Erstellt ein PDF für eine einzelne Ausschreibung mit allen Unternehmens-Matches.
 */
export async function generateSingleTenderPdf(tender: DashboardRow, allMatches: DashboardRow[]): Promise<JsPDFInstance> {
  const { jsPDF } = await import('jspdf') as { jsPDF: new () => JsPDFInstance }

  const doc: JsPDFInstance = new jsPDF()
  const today = new Date().toLocaleDateString('de-DE')

  doc.setFontSize(18)
  doc.setTextColor(31, 78, 121)
  doc.text('VOB Ausschreibung', 14, 20)

  doc.setFontSize(10)
  doc.setTextColor(100, 116, 139)
  doc.text(`Generiert am ${today}`, 14, 28)

  doc.setDrawColor(31, 78, 121)
  doc.setLineWidth(0.5)
  doc.line(14, 32, 196, 32)

  let y = 42

  doc.setFontSize(13)
  doc.setTextColor(30, 41, 59)
  const titleLines = doc.splitTextToSize(tender.title, 170)
  doc.text(titleLines, 14, y)
  y += titleLines.length * 6 + 4

  const fields: [string, string][] = []
  if (tender.authority) fields.push(['Auftraggeber', tender.authority])
  if (tender.deadline) {
    const urgencyLabel = getUrgencyLabel(tender.urgency)
    fields.push(['Abgabefrist', `${tender.deadline} ${urgencyLabel ? `(${urgencyLabel})` : ''}`])
  }
  if (tender.category) fields.push(['Gewerk', tender.category])

  doc.setFontSize(10)
  for (const [label, value] of fields) {
    doc.setTextColor(100, 116, 139)
    doc.text(`${label}:`, 14, y)
    doc.setTextColor(30, 41, 59)
    doc.text(value, 55, y)
    y += 6
  }

  y += 4
  doc.setTextColor(31, 78, 121)
  doc.setFontSize(9)
  doc.text(`Link: ${tender.url}`, 14, y)
  y += 10

  if (allMatches.length > 0) {
    doc.setFontSize(12)
    doc.setTextColor(31, 78, 121)
    doc.text('Zugeordnete Unternehmen', 14, y)
    y += 8

    for (const match of allMatches) {
      if (!match.company_name) continue
      doc.setFontSize(10)
      doc.setTextColor(30, 41, 59)
      doc.text(`• ${match.company_name} (Relevanz: ${match.relevance ?? 'k.A.'})`, 14, y)
      y += 5
      if (match.reason) {
        doc.setFontSize(9)
        doc.setTextColor(100, 116, 139)
        const reasonLines = doc.splitTextToSize(match.reason, 165)
        doc.text(reasonLines, 20, y)
        y += reasonLines.length * 4 + 3
      }
    }
  }

  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184)
  doc.text(`Generiert am ${today} — VOB Monitor Gruppenwerk`, 14, 285)

  return doc
}
