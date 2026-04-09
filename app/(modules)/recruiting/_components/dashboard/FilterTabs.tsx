"use client";

import type { EmpfehlungStatus } from "@/types/recruiting";

type FilterOption = "alle" | EmpfehlungStatus;

interface FilterTabsProps {
  active: FilterOption;
  counts: Record<FilterOption, number>;
  onChange: (filter: FilterOption) => void;
}

const tabs: { key: FilterOption; label: string }[] = [
  { key: "alle", label: "Alle" },
  { key: "offen", label: "Offen" },
  { key: "eingestellt", label: "Eingestellt" },
  { key: "probezeit_bestanden", label: "Probezeit" },
  { key: "ausgezahlt", label: "Ausgezahlt" },
];

export function FilterTabs({ active, counts, onChange }: FilterTabsProps): React.JSX.Element {
  return (
    <div role="tablist" className="flex gap-2 overflow-x-auto pb-1">
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
              isActive
                ? "bg-foreground text-background font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted font-normal"
            }`}
          >
            {tab.label} ({counts[tab.key]})
          </button>
        );
      })}
    </div>
  );
}
