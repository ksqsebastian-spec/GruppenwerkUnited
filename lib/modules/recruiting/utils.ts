import type { EmpfehlungStatus } from "@/types/recruiting";

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
    case "eingestellt":
      return {
        bg: "var(--green-bg)",
        text: "var(--green)",
        border: "var(--green)",
      };
    case "probezeit_bestanden":
      return {
        bg: "var(--blue-bg)",
        text: "var(--blue)",
        border: "var(--blue)",
      };
    case "ausgezahlt":
      return {
        bg: "#F3F0FF",
        text: "#7C3AED",
        border: "#7C3AED",
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
    case "eingestellt":
      return "EINGESTELLT";
    case "probezeit_bestanden":
      return "PROBEZEIT BESTANDEN";
    case "ausgezahlt":
      return "AUSGEZAHLT";
    default:
      return "UNBEKANNT";
  }
}
