import type { EmpfehlungStatus } from "@/types";

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateString));
}

export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "heute";
  if (diffDays === 1) return "gestern";
  if (diffDays < 7) return `vor ${diffDays} Tagen`;
  return formatDate(dateString);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function getStatusColor(status: EmpfehlungStatus) {
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
  }
}
