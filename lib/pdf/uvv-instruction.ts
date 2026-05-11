import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { Driver, UvvSettings } from '@/types';

/**
 * Parameter für die PDF-Generierung
 */
interface GenerateUvvPdfParams {
  /** Fahrer für den das PDF erstellt wird */
  driver: Driver;
  /** UVV-Einstellungen (für Standard-Themen) */
  settings: UvvSettings;
  /** Optionale zusätzliche Themen */
  additionalTopics?: string;
  /** Jahr für den Titel (Standard: aktuelles Jahr) */
  year?: number;
}

/**
 * Standard-Themen für UVV-Unterweisung
 */
const DEFAULT_TOPICS = [
  'Verkehrssicherheit',
  'Aktuelle Verkehrsregeln',
  'Verhalten bei Unfällen',
  'Fahrzeugcheck vor Fahrtantritt',
  'Ladungssicherung',
  'Arbeitsschutz im Straßenverkehr',
];

/**
 * Generiert ein PDF für die UVV-Unterweisungsbestätigung
 *
 * @example
 * ```tsx
 * generateUvvInstructionPdf({
 *   driver: { first_name: 'Max', last_name: 'Müller', ... },
 *   settings: { default_topics: '...', ... },
 * });
 * ```
 */
export function generateUvvInstructionPdf({
  driver,
  settings,
  additionalTopics,
  year = new Date().getFullYear(),
}: GenerateUvvPdfParams): void {
  const doc = new jsPDF();
  const today = format(new Date(), 'dd.MM.yyyy', { locale: de });
  const driverName = `${driver.first_name} ${driver.last_name}`;

  // Margins und Layout
  const marginLeft = 20;
  const marginRight = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - marginLeft - marginRight;
  let currentY = 30;

  // ============================================================================
  // Titel
  // ============================================================================
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `Bestätigung der jährlichen Fahrerunterweisung ${year}`,
    pageWidth / 2,
    currentY,
    { align: 'center' }
  );

  currentY += 15;

  // Trennlinie
  doc.setLineWidth(0.5);
  doc.line(marginLeft, currentY, pageWidth - marginRight, currentY);

  currentY += 20;

  // ============================================================================
  // Datum und Name
  // ============================================================================
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  doc.text(`Datum: ${today}`, marginLeft, currentY);
  currentY += 10;

  doc.text(`Name: ${driverName}`, marginLeft, currentY);
  currentY += 20;

  // ============================================================================
  // Bestätigungstext
  // ============================================================================
  const confirmationText =
    'Ich bestätige hiermit, dass ich an der jährlichen Unterweisung gemäß ' +
    'UVV (Unfallverhütungsvorschrift) teilgenommen habe. Die Inhalte wurden ' +
    'mir verständlich vermittelt.';

  const splitConfirmation = doc.splitTextToSize(confirmationText, contentWidth);
  doc.text(splitConfirmation, marginLeft, currentY);
  currentY += splitConfirmation.length * 7 + 15;

  // ============================================================================
  // Themen
  // ============================================================================
  doc.setFont('helvetica', 'bold');
  doc.text('Themen:', marginLeft, currentY);
  currentY += 8;

  doc.setFont('helvetica', 'normal');

  // Standard-Themen aus Einstellungen oder Default
  const topics = settings.default_topics
    ? settings.default_topics.split(',').map((t) => t.trim())
    : DEFAULT_TOPICS;

  topics.forEach((topic) => {
    doc.text(`• ${topic}`, marginLeft + 5, currentY);
    currentY += 7;
  });

  // Zusätzliche Themen falls vorhanden
  if (additionalTopics && additionalTopics.trim()) {
    currentY += 3;
    doc.setFont('helvetica', 'bold');
    doc.text('Zusätzliche Themen:', marginLeft, currentY);
    currentY += 8;
    doc.setFont('helvetica', 'normal');

    const additionalSplit = doc.splitTextToSize(additionalTopics, contentWidth - 10);
    doc.text(additionalSplit, marginLeft + 5, currentY);
    currentY += additionalSplit.length * 7;
  }

  currentY += 25;

  // ============================================================================
  // Unterschriftsfelder
  // ============================================================================
  const signatureLineWidth = 70;
  const signatureY = currentY + 20;

  // Linke Unterschrift (Mitarbeiter)
  doc.setFont('helvetica', 'normal');
  doc.text('Unterschrift Mitarbeiter:', marginLeft, currentY);
  doc.line(marginLeft, signatureY, marginLeft + signatureLineWidth, signatureY);

  // Rechte Unterschrift (Unterweisender)
  const rightSignatureX = pageWidth - marginRight - signatureLineWidth;
  doc.text('Unterschrift Unterweisender:', rightSignatureX, currentY);
  doc.line(rightSignatureX, signatureY, rightSignatureX + signatureLineWidth, signatureY);

  currentY = signatureY + 20;

  // Datumsfeld
  doc.text('Datum:', marginLeft, currentY);
  doc.line(marginLeft + 20, currentY, marginLeft + 70, currentY);

  // ============================================================================
  // Footer mit Hinweis
  // ============================================================================
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text(
    'Dieses Dokument dient als Nachweis der jährlichen Fahrerunterweisung gemäß UVV.',
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );

  // ============================================================================
  // PDF speichern
  // ============================================================================
  const safeDriverName = driverName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_äöüÄÖÜß]/g, '');
  doc.save(`UVV-Unterweisung_${safeDriverName}_${year}.pdf`);
}

/**
 * Generiert ein leeres UVV-Formular (ohne Fahrerdaten)
 * Nützlich für Sammelunterweisungen
 */
export function generateBlankUvvPdf(settings: UvvSettings, year?: number): void {
  const blankDriver: Driver = {
    id: '',
    first_name: '________________________',
    last_name: '',
    email: null,
    phone: null,
    license_class: null,
    license_expiry: null,
    company_id: '',
    status: 'active',
    notes: null,
    created_at: '',
    updated_at: '',
  };

  generateUvvInstructionPdf({
    driver: blankDriver,
    settings,
    year: year ?? new Date().getFullYear(),
  });
}
