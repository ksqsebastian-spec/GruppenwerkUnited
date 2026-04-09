"use client";

interface StatCardProps {
  label: string;
  value: string | number;
}

// Einfache Stat-Zelle im VOB-Design – keine Pastellfarben, kein farbiger Rahmen
export function StatCard({ label, value }: StatCardProps): JSX.Element {
  return (
    <div className="bg-card p-5 flex-1 min-w-[150px]">
      <p className="text-xs text-muted-foreground mb-3">{label}</p>
      <p className="text-[28px] font-semibold text-foreground leading-none tracking-tight tabular-nums">
        {value}
      </p>
    </div>
  );
}
