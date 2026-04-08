import type { ReferralData } from "@/types";

export async function generatePDF(data: ReferralData): Promise<void> {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({
    format: "a5",
    unit: "mm",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 25;

  // Header
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("SEEHAFER ELEMENTE", pageWidth / 2, y, { align: "center" });
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Fachkraefte-Empfehlung", pageWidth / 2, y, { align: "center" });
  y += 15;

  // Separator
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Referral block
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Empfehlung", margin, y);
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Empfohlen von:", margin, y);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text(data.name, margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.text(data.email, margin, y);
  y += 6;
  doc.text(`Ref: ${data.refCode}`, margin, y);
  y += 10;

  // Candidate
  doc.setFont("helvetica", "bold");
  doc.text("Empfohlene Person:", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.text(data.candidateName, margin, y);
  y += 10;

  // Separator
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;

  // Instructions
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Anleitung:", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.text("Kopiere den Block oben in deine", margin, y);
  y += 5;
  doc.text("Bewerbungsmail an info@seehafer-elemente.de", margin, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.text("Offene Stellen:", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.text("seehafer-elemente.de/karriere", margin, y);
  y += 12;

  // Footer
  doc.line(margin, y, pageWidth - margin, y);

  // Download
  const filename = `empfehlung-seehafer-recruiting-${data.refCode.replace("#", "")}.pdf`;
  doc.save(filename);
}
