"use client";

import type { Empfehlung } from "@/types/recruiting";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { formatRelativeDate, getStatusColor } from "@/lib/modules/recruiting/utils";

interface EmpfehlungCardProps {
  empfehlung: Empfehlung;
  onClick: () => void;
}

export function EmpfehlungCard({ empfehlung, onClick }: EmpfehlungCardProps): React.JSX.Element {
  const colors = getStatusColor(empfehlung.status);
  const isAusgezahlt = empfehlung.status === "ausgezahlt";

  return (
    <button
      onClick={onClick}
      aria-label={`Empfehlung ${empfehlung.kandidat_name} – ${empfehlung.status}`}
      className={`flex items-center gap-3 w-full p-4 bg-card rounded-xl border-l-[3px] border-y border-r border-border text-left transition-colors hover:bg-muted/50 cursor-pointer ${isAusgezahlt ? "opacity-70" : ""}`}
      style={{ borderLeftColor: colors.border }}
    >
      <Avatar name={empfehlung.kandidat_name} status={empfehlung.status} />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-foreground truncate">
          {empfehlung.kandidat_name}
        </div>
        <div className="text-xs text-muted-foreground">
          Empfehler: {empfehlung.empfehler_name}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <Badge status={empfehlung.status} />
        <span className="text-[11px] text-muted-foreground">
          {formatRelativeDate(empfehlung.created_at)}
        </span>
      </div>
    </button>
  );
}
