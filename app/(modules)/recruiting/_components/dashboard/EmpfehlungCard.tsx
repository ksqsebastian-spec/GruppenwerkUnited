"use client";

import type { Empfehlung } from "@/types/recruiting";
import { Avatar } from "../_components/ui/Avatar";
import { Badge } from "../_components/ui/Badge";
import { formatRelativeDate } from "@/lib/modules/recruiting/utils";
import { getStatusColor } from "@/lib/modules/recruiting/utils";

interface EmpfehlungCardProps {
  empfehlung: Empfehlung;
  onClick: () => void;
}

export function EmpfehlungCard({ empfehlung, onClick }: EmpfehlungCardProps) {
  const colors = getStatusColor(empfehlung.status);
  const isAusgezahlt = empfehlung.status === "ausgezahlt";

  return (
    <button
      onClick={onClick}
      aria-label={`Empfehlung ${empfehlung.kandidat_name} – ${empfehlung.status}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        width: "100%",
        padding: "16px",
        backgroundColor: "var(--bg-card)",
        borderRadius: "var(--radius)",
        boxShadow: "var(--shadow-card)",
        border: "none",
        borderLeft: `3px solid ${colors.border}`,
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.2s ease",
        opacity: isAusgezahlt ? 0.7 : 1,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-hover)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-card)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <Avatar name={empfehlung.kandidat_name} status={empfehlung.status} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: "14px",
            color: "var(--text)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {empfehlung.kandidat_name}
        </div>
        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          Empfehler: {empfehlung.empfehler_name}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "4px",
        }}
      >
        <Badge status={empfehlung.status} />
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          {formatRelativeDate(empfehlung.created_at)}
        </span>
      </div>
    </button>
  );
}
