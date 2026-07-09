import type { EmpfehlungStatus } from "@/types/affiliate";

export function berechneProvision(
  rechnungsbetrag: number,
  prozentsatz: number
): number {
  const provision = rechnungsbetrag * (prozentsatz / 100);
  return Math.round(provision * 100) / 100;
}

// Zentrale Format-Utilities werden aus @/lib/utils re-exportiert, damit bestehende
// Importpfade aus diesem Modul weiterhin funktionieren.
export { getInitials, formatDate, formatRelativeDate, formatCurrency } from "@/lib/utils";

interface StatusColor {
  bg: string;
  text: string;
  border: string;
}

export function getStatusColor(status: EmpfehlungStatus): StatusColor {
  switch (status) {
    case "offen":
      return {
        bg: "var(--orange-bg)",
        text: "var(--orange)",
        border: "var(--orange)",
      };
    case "erledigt":
      return {
        bg: "var(--green-bg)",
        text: "var(--green)",
        border: "var(--green)",
      };
    case "ausgezahlt":
      return {
        bg: "var(--blue-bg)",
        text: "var(--blue)",
        border: "var(--blue)",
      };
    // Fallback für unerwartete Status-Werte aus der DB — verhindert Crash beim
    // Zugriff auf .bg/.text/.border im Consumer.
    default:
      return { bg: "#F3F4F6", text: "#6B7280", border: "#6B7280" };
  }
}

export function getStatusLabel(status: EmpfehlungStatus): string {
  switch (status) {
    case "offen":
      return "OFFEN";
    case "erledigt":
      return "ERLEDIGT";
    case "ausgezahlt":
      return "AUSGEZAHLT";
    default:
      return "UNBEKANNT";
  }
}
