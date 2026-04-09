"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, ChevronDown, ChevronRight, ArrowRight, Check, X, Users } from "lucide-react";
import type { EmpfehlungWithStelle, EmpfehlungStatus, Stelle } from "@/types/recruiting";
import { formatDate, formatCurrency } from "@/lib/modules/recruiting/utils";

const STATUS_DOT_COLORS: Record<EmpfehlungStatus, string> = {
  offen: "#ea580c",
  eingestellt: "#16a34a",
  probezeit_bestanden: "#2563eb",
  ausgezahlt: "#7C3AED",
};

const STATUS_LABELS: Record<EmpfehlungStatus, string> = {
  offen: "Offen",
  eingestellt: "Eingestellt",
  probezeit_bestanden: "Probezeit bestanden",
  ausgezahlt: "Ausgezahlt",
};

const NEXT_STATUS: Record<EmpfehlungStatus, { label: string; target: EmpfehlungStatus; color: string } | null> = {
  offen: { label: "Eingestellt", target: "eingestellt", color: "#16a34a" },
  eingestellt: { label: "Probezeit bestanden", target: "probezeit_bestanden", color: "#2563eb" },
  probezeit_bestanden: { label: "Ausgezahlt", target: "ausgezahlt", color: "#7C3AED" },
  ausgezahlt: null,
};

interface StelleGroup {
  stelle: Pick<Stelle, "id" | "title"> | null;
  empfehlungen: EmpfehlungWithStelle[];
}

export default function AdminDashboardPage() {
  const [empfehlungen, setEmpfehlungen] = useState<EmpfehlungWithStelle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedKunden, setExpandedKunden] = useState<Set<string>>(new Set());

  // Inline-Bearbeitung der Prämie
  const [editingPraemieId, setEditingPraemieId] = useState<string | null>(null);
  const [editPraemie, setEditPraemie] = useState("");

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await fetch("/api/recruiting/stellen?view=empfehlungen&pageSize=200");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEmpfehlungen(data.data || []);
    } catch {
      setEmpfehlungen([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Empfehlungen nach Stelle gruppieren
  const kundeGroups: StelleGroup[] = (() => {
    const filtered = search
      ? empfehlungen.filter((e) => {
          const s = search.toLowerCase();
          return (
            e.kandidat_name.toLowerCase().includes(s) ||
            e.empfehler_name.toLowerCase().includes(s) ||
            e.ref_code.toLowerCase().includes(s) ||
            (e.stelle?.title ?? "").toLowerCase().includes(s)
          );
        })
      : empfehlungen;

    const map = new Map<string, StelleGroup>();
    for (const emp of filtered) {
      const key = emp.stelle?.id ?? "ohne-stelle";
      if (!map.has(key)) {
        map.set(key, {
          stelle: emp.stelle ?? null,
          empfehlungen: [],
        });
      }
      map.get(key)!.empfehlungen.push(emp);
    }
    return Array.from(map.values()).sort((a, b) => (a.stelle?.title ?? "").localeCompare(b.stelle?.title ?? ""));
  })();

  function toggleKunde(id: string): void {
    setExpandedKunden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function expandAll(): void {
    setExpandedKunden(new Set(kundeGroups.map((g) => g.stelle?.id ?? "ohne-stelle")));
  }

  function collapseAll(): void {
    setExpandedKunden(new Set());
  }

  async function handleMoveStatus(emp: EmpfehlungWithStelle): Promise<void> {
    const next = NEXT_STATUS[emp.status];
    if (!next) return;

    if (next.target === "ausgezahlt") {
      if (!confirm(`"${emp.empfehler_name}" als ausgezahlt markieren?`)) return;
    }

    try {
      const res = await fetch("/api/recruiting/empfehlungen", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: emp.id, status: next.target }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.detail || data.error || "Fehler");
        return;
      }
      fetchData();
    } catch {
      alert("Netzwerkfehler");
    }
  }

  async function handleUpdatePraemie(emp: EmpfehlungWithStelle): Promise<void> {
    const value = parseFloat(editPraemie);
    if (isNaN(value) || value < 0) return;

    try {
      const res = await fetch("/api/recruiting/empfehlungen", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: emp.id, praemie_betrag: value }),
      });
      if (!res.ok) {
        alert("Fehler beim Aktualisieren");
        return;
      }
      setEditingPraemieId(null);
      fetchData();
    } catch {
      alert("Netzwerkfehler");
    }
  }

  const stats = {
    total: empfehlungen.length,
    offen: empfehlungen.filter((e) => e.status === "offen").length,
    eingestellt: empfehlungen.filter((e) => e.status === "eingestellt").length,
    probezeit: empfehlungen.filter((e) => e.status === "probezeit_bestanden").length,
    praemien: empfehlungen
      .filter((e) => e.praemie_betrag)
      .reduce((sum, e) => sum + (e.praemie_betrag ?? 0), 0),
  };

  return (
    <div className="animate-fadeIn flex flex-col gap-8">
      <h1 className="text-lg font-semibold tracking-tight text-foreground">Dashboard</h1>

      {/* Statistik-Raster */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-border rounded-xl overflow-hidden border border-border">
        <div className="bg-card p-5">
          <p className="text-xs text-muted-foreground mb-3">Gesamt</p>
          <p className="text-[28px] font-semibold text-foreground leading-none tracking-tight tabular-nums">{stats.total}</p>
        </div>
        <div className="bg-card p-5">
          <p className="text-xs text-muted-foreground mb-3">Offen</p>
          <p className="text-[28px] font-semibold text-foreground leading-none tracking-tight tabular-nums">{stats.offen}</p>
        </div>
        <div className="bg-card p-5">
          <p className="text-xs text-muted-foreground mb-3">Eingestellt</p>
          <p className="text-[28px] font-semibold text-foreground leading-none tracking-tight tabular-nums">{stats.eingestellt}</p>
        </div>
        <div className="bg-card p-5">
          <p className="text-xs text-muted-foreground mb-3">Probezeit</p>
          <p className="text-[28px] font-semibold text-foreground leading-none tracking-tight tabular-nums">{stats.probezeit}</p>
        </div>
        <div className="bg-card p-5">
          <p className="text-xs text-muted-foreground mb-3">Prämien</p>
          <p className="text-[28px] font-semibold text-foreground leading-none tracking-tight tabular-nums">{formatCurrency(stats.praemien)}</p>
        </div>
      </div>

      {/* Suche + Alle öffnen/schließen */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl flex-1 min-w-[220px]">
          <Search size={16} className="text-muted-foreground shrink-0" />
          <input
            placeholder="Stelle oder Empfehler suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors"
          >
            Alle öffnen
          </button>
          <button
            onClick={collapseAll}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:bg-muted transition-colors"
          >
            Alle schließen
          </button>
        </div>
      </div>

      {/* Stellen-Gruppen */}
      {loading ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center text-sm text-muted-foreground">
          Wird geladen...
        </div>
      ) : kundeGroups.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center text-sm text-muted-foreground">
          Keine Empfehlungen gefunden
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {kundeGroups.map((group) => {
            const groupId = group.stelle?.id ?? "ohne-stelle";
            const isExpanded = expandedKunden.has(groupId);
            const empfehlungCount = group.empfehlungen.length;
            const statusCounts = {
              offen: group.empfehlungen.filter((e) => e.status === "offen").length,
              eingestellt: group.empfehlungen.filter((e) => e.status === "eingestellt").length,
              probezeit_bestanden: group.empfehlungen.filter((e) => e.status === "probezeit_bestanden").length,
              ausgezahlt: group.empfehlungen.filter((e) => e.status === "ausgezahlt").length,
            };

            return (
              <div
                key={groupId}
                className={`bg-card rounded-xl border transition-colors overflow-hidden ${isExpanded ? "border-foreground/30" : "border-border"}`}
              >
                {/* Gruppen-Header */}
                <button
                  onClick={() => toggleKunde(groupId)}
                  className={`w-full flex items-center gap-4 p-5 text-left transition-colors ${isExpanded ? "bg-muted/30" : "hover:bg-muted/30"}`}
                >
                  {/* Expand-Icon */}
                  <div className="shrink-0 text-muted-foreground">
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </div>

                  {/* Stellen-Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-foreground/10 flex items-center justify-center shrink-0">
                    <Users size={18} className="text-foreground/60" />
                  </div>

                  {/* Stellen-Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground">
                      {group.stelle?.title ?? "Ohne Stelle"}
                    </div>
                  </div>

                  {/* Status-Punkte Zusammenfassung */}
                  <div className="flex gap-2 shrink-0">
                    {statusCounts.offen > 0 && (
                      <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: STATUS_DOT_COLORS.offen }}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_DOT_COLORS.offen }} />
                        {statusCounts.offen}
                      </span>
                    )}
                    {statusCounts.eingestellt > 0 && (
                      <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: STATUS_DOT_COLORS.eingestellt }}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_DOT_COLORS.eingestellt }} />
                        {statusCounts.eingestellt}
                      </span>
                    )}
                    {statusCounts.probezeit_bestanden > 0 && (
                      <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: STATUS_DOT_COLORS.probezeit_bestanden }}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_DOT_COLORS.probezeit_bestanden }} />
                        {statusCounts.probezeit_bestanden}
                      </span>
                    )}
                    {statusCounts.ausgezahlt > 0 && (
                      <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: STATUS_DOT_COLORS.ausgezahlt }}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_DOT_COLORS.ausgezahlt }} />
                        {statusCounts.ausgezahlt}
                      </span>
                    )}
                  </div>

                  {/* Empfehlungs-Anzahl */}
                  <span className="text-xs text-muted-foreground shrink-0">
                    {empfehlungCount} {empfehlungCount === 1 ? "Empfehlung" : "Empfehlungen"}
                  </span>
                </button>

                {/* Ausgeklappt: Empfehlungs-Tabelle */}
                {isExpanded && (
                  <div className="border-t border-border">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          {["Empfehler", "Ref", "Status", "Prämie", "Datum", "Aktion"].map((h) => (
                            <th
                              key={h}
                              className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {group.empfehlungen.map((emp) => (
                          <tr key={emp.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                            {/* Empfehler Name + E-Mail */}
                            <td className="px-4 py-3">
                              <span className="text-sm font-medium text-foreground">{emp.empfehler_name}</span>
                              <div className="text-xs text-muted-foreground">{emp.empfehler_email}</div>
                            </td>

                            {/* Ref-Code */}
                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground font-semibold">
                              {emp.ref_code}
                            </td>

                            {/* Status-Punkt + Label */}
                            <td className="px-4 py-3">
                              <span className="flex items-center gap-1.5">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: STATUS_DOT_COLORS[emp.status] }}
                                />
                                <span className="text-xs font-medium" style={{ color: STATUS_DOT_COLORS[emp.status] }}>
                                  {STATUS_LABELS[emp.status]}
                                </span>
                              </span>
                            </td>

                            {/* Prämie (inline bearbeitbar) */}
                            <td className="px-4 py-3">
                              {editingPraemieId === emp.id ? (
                                <div className="flex gap-1.5 items-center">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={editPraemie}
                                    onChange={(e) => setEditPraemie(e.target.value)}
                                    className="w-24 px-2 py-1.5 border border-border rounded-lg text-sm font-semibold bg-card text-foreground outline-none focus:border-foreground/30"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleUpdatePraemie(emp);
                                      if (e.key === "Escape") setEditingPraemieId(null);
                                    }}
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleUpdatePraemie(emp)}
                                    className="p-1.5 bg-green-600 rounded-md flex items-center cursor-pointer border-none"
                                  >
                                    <Check size={12} color="white" />
                                  </button>
                                  <button
                                    onClick={() => setEditingPraemieId(null)}
                                    className="p-1.5 bg-muted border border-border rounded-md flex items-center cursor-pointer"
                                  >
                                    <X size={12} className="text-muted-foreground" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingPraemieId(emp.id);
                                    setEditPraemie(emp.praemie_betrag ? String(emp.praemie_betrag) : "");
                                  }}
                                  className={`text-xs px-2 py-1 rounded-md border transition-colors cursor-pointer ${emp.praemie_betrag ? "border-green-600 text-green-700 bg-green-50 hover:bg-green-100" : "border-border text-muted-foreground hover:bg-muted"}`}
                                  title="Klicke um Prämie anzupassen"
                                >
                                  {emp.praemie_betrag ? formatCurrency(emp.praemie_betrag) : "–"}
                                </button>
                              )}
                            </td>

                            {/* Datum */}
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                              {formatDate(emp.created_at)}
                            </td>

                            {/* Aktion */}
                            <td className="px-4 py-3">
                              {NEXT_STATUS[emp.status] && (
                                <button
                                  onClick={() => handleMoveStatus(emp)}
                                  className="text-xs px-2 py-1 rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors flex items-center gap-1 whitespace-nowrap cursor-pointer"
                                >
                                  <ArrowRight size={12} /> {NEXT_STATUS[emp.status]!.label}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
