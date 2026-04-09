"use client";

interface StatCardProps {
  label: string;
  value: string | number;
  // Veraltete Props werden ignoriert, bleiben für Abwärtskompatibilität
  color?: string;
  bgColor?: string;
}

// Einfache Stat-Karte im VOB-Designsystem (bg-card, semantische Tailwind-Klassen)
export function StatCard({ label, value }: StatCardProps): React.JSX.Element {
  return (
    <div className="bg-card p-5 flex-1 min-w-[150px]">
      <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide">{label}</p>
      <p className="text-[28px] font-semibold text-foreground leading-none tracking-tight tabular-nums">
        {value}
      </p>
    </div>
  );
}
