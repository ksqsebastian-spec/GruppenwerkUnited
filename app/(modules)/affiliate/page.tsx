"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Search, ChevronDown, ChevronRight, ArrowRight, Check, X, Users } from "lucide-react";
import type { EmpfehlungWithHandwerker, EmpfehlungStatus, Handwerker } from "@/types/affiliate";
import { StatCard } from "./_components/ui/StatCard";
import { formatDate, formatCurrency } from "@/lib/modules/affiliate/utils";

const STATUS_DOT_COLORS: Record<EmpfehlungStatus, string> = {
  offen: "#ea580c",
  erledigt: "#16a34a",
  ausgezahlt: "#2563eb",
};

const STATUS_LABELS: Record<EmpfehlungStatus, string> = {
  offen: "Offen",
  erledigt: "Erledigt",
  ausgezahlt: "Ausgezahlt",
};

const NEXT_STATUS: Record<EmpfehlungStatus, { label: string; target: EmpfehlungStatus } | null> = {
  offen: { label: "Zur Auszahlung", target: "erledigt" },
  erledigt: { label: "Ausgezahlt", target: "ausgezahlt" },
  ausgezahlt: null,
};

interface KundeGroup {
  handwerker: Pick<Handwerker, "id" | "name" | "email" | "telefon" | "provision_prozent">;
  empfehlungen: EmpfehlungWithHandwerker[];
}

export default function AdminDashboardPage(): React.JSX.Element {
  const [empfehlungen, setEmpfehlungen] = useState<EmpfehlungWithHandwerker[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedKunden, setExpandedKunden] = useState<Set<string>>(new Set());

  // Inline-Bearbeitung
  const [editingBetragId, setEditingBetragId] = useState<string | null>(null);
  const [editBetrag, setEditBetrag] = useState("");
  const [editingProvisionId, setEditingProvisionId] = useState<string | null>(null);
  const [editProvision, setEditProvision] = useState("");

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await fetch("/api/affiliate/handwerker?view=empfehlungen&pageSize=200");
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

  // Empfehlungen nach Kunde (Handwerker) gruppieren
  const kundeGroups = useMemo((): KundeGroup[] => {
    const filtered = search
      ? empfehlungen.filter((e) => {
          const s = search.toLowerCase();
          return (
            e.kunde_name.toLowerCase().includes(s) ||
            e.empfehler_name.toLowerCase().includes(s) ||
            e.ref_code.toLowerCase().includes(s) ||
            (e.handwerker?.name ?? "").toLowerCase().includes(s)
          );
        })
      : empfehlungen;

    const map = new Map<string, KundeGroup>();
    for (const emp of filtered) {
      const key = emp.handwerker?.id ?? emp.handwerker_id;
      const existing = map.get(key);
      if (existing) {
        existing.empfehlungen.push(emp);
      } else {
        map.set(key, {
          handwerker: emp.handwerker ?? { id: key, name: emp.kunde_name, email: "", telefon: null, provision_prozent: 0 },
          empfehlungen: [emp],
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.handwerker.name.localeCompare(b.handwerker.name));
  }, [empfehlungen, search]);

  function toggleKunde(id: string): void {
    setExpandedKunden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function expandAll(): void {
    setExpandedKunden(new Set(kundeGroups.map((g) => g.handwerker.id)));
  }

  function collapseAll(): void {
    setExpandedKunden(new Set());
  }

  async function handleMoveStatus(emp: EmpfehlungWithHandwerker): Promise<void> {
    const next = NEXT_STATUS[emp.status];
    if (!next) return;

    if (next.target === "ausgezahlt") {
      if (!confirm(`"${emp.empfehler_name}" als ausgezahlt markieren?`)) return;
    }

    try {
      const res = await fetch("/api/affiliate/empfehlungen", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: emp.id, status: next.target }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.detail || data.error || "Fehler");
        return;
      }

      // Bei Auszahlung den zugehörigen Handwerker archivieren
      if (next.target === "ausgezahlt" && emp.handwerker?.id) {
        const archiveRes = await fetch("/api/affiliate/handwerker", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: emp.handwerker.id, active: false }),
        });
        if (!archiveRes.ok) {
          alert("Auszahlung erfolgreich, aber Kunde konnte nicht archiviert werden.");
        }
      }

      fetchData();
    } catch {
      alert("Netzwerkfehler");
    }
  }

  async function handleUpdateBetrag(emp: EmpfehlungWithHandwerker): Promise<void> {
    const value = parseFloat(editBetrag);
    if (isNaN(value) || value < 0) return;

    try {
      const res = await fetch("/api/affiliate/empfehlungen", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: emp.id, rechnungsbetrag: value }),
      });
      if (!res.ok) {
        alert("Fehler beim Aktualisieren");
        return;
      }
      setEditingBetragId(null);
      fetchData();
    } catch {
      alert("Netzwerkfehler");
    }
  }

  async function handleUpdateProvision(emp: EmpfehlungWithHandwerker): Promise<void> {
    const value = parseFloat(editProvision);
    if (isNaN(value) || value < 0) return;

    try {
      const res = await fetch("/api/affiliate/empfehlungen", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: emp.id, provision_betrag: value }),
      });
      if (!res.ok) {
        alert("Fehler beim Aktualisieren");
        return;
      }
      setEditingProvisionId(null);
      fetchData();
    } catch {
      alert("Netzwerkfehler");
    }
  }

  const stats = useMemo(() => {
    let offen = 0, erledigt = 0, provision = 0;
    for (const e of empfehlungen) {
      if (e.status === "offen") offen++;
      else if (e.status === "erledigt") erledigt++;
      provision += e.provision_betrag ?? 0;
    }
    return { total: empfehlungen.length, offen, erledigt, provision };
  }, [empfehlungen]);

  return (
    <div className="animate-fadeIn flex flex-col gap-8">
      <h1 className="text-lg font-semibold tracking-tight text-foreground">Dashboard</h1>

      {/* Statistik-Raster */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border rounded-xl overflow-hidden border border-border">
        <StatCard label="Gesamt" value={stats.total} />
        <StatCard label="Offen" value={stats.offen} />
        <StatCard label="Erledigt" value={stats.erledigt} />
        <StatCard label="Provision" value={formatCurrency(stats.provision)} />
      </div>

      {/* Suche + Expand/Collapse */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="flex-1 min-w-[220px] flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl">
          <Search size={16} className="text-muted-foreground shrink-0" />
          <input
            placeholder="Kunde oder Affiliate suchen..."
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

      {/* Gruppen-Karten */}
      {loading ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center text-sm text-muted-foreground">
          Wird geladen...
        </div>
      ) : kundeGroups.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center text-sm text-muted-foreground">
          Keine Empfehlungen gefunden
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {kundeGroups.map((group) => {
            const isExpanded = expandedKunden.has(group.handwerker.id);
            const affiliateCount = group.empfehlungen.length;
            const statusCounts = {
              offen: group.empfehlungen.filter((e) => e.status === "offen").length,
              erledigt: group.empfehlungen.filter((e) => e.status === "erledigt").length,
              ausgezahlt: group.empfehlungen.filter((e) => e.status === "ausgezahlt").length,
            };

            return (
              <div
                key={group.handwerker.id}
                className={`bg-card rounded-xl border transition-all overflow-hidden ${isExpanded ? "border-foreground/30" : "border-border"}`}
              >
                {/* Gruppen-Header */}
                <button
                  onClick={() => toggleKunde(group.handwerker.id)}
                  className={`w-full flex items-center gap-4 p-5 text-left transition-colors ${isExpanded ? "bg-muted/30" : "hover:bg-muted/30"}`}
                >
                  {/* Expand-Icon */}
                  <div className="shrink-0 text-muted-foreground">
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center shrink-0">
                    <Users size={18} className="text-background" />
                  </div>

                  {/* Kunde-Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground">
                      {group.handwerker.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {group.handwerker.email}
                      {group.handwerker.telefon && ` · ${group.handwerker.telefon}`}
                    </div>
                  </div>

                  {/* Provisions-Badge */}
                  <span className="px-3 py-1 rounded-lg text-xs font-semibold border border-border text-foreground bg-muted shrink-0">
                    {group.handwerker.provision_prozent}%
                  </span>

                  {/* Status-Punkte */}
                  <div className="flex gap-2 shrink-0">
                    {statusCounts.offen > 0 && (
                      <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: STATUS_DOT_COLORS.offen }}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_DOT_COLORS.offen }} />
                        {statusCounts.offen}
                      </span>
                    )}
                    {statusCounts.erledigt > 0 && (
                      <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: STATUS_DOT_COLORS.erledigt }}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_DOT_COLORS.erledigt }} />
                        {statusCounts.erledigt}
                      </span>
                    )}
                    {statusCounts.ausgezahlt > 0 && (
                      <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: STATUS_DOT_COLORS.ausgezahlt }}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_DOT_COLORS.ausgezahlt }} />
                        {statusCounts.ausgezahlt}
                      </span>
                    )}
                  </div>

                  {/* Anzahl Affiliates */}
                  <span className="text-xs text-muted-foreground shrink-0">
                    {affiliateCount} {affiliateCount === 1 ? "Affiliate" : "Affiliates"}
                  </span>
                </button>

                {/* Ausgeklappte Tabelle */}
                {isExpanded && (
                  <div className="border-t border-border overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-muted">
                          {["Affiliate", "Ref", "Status", "Betrag", "Provision", "Datum", "Aktion"].map((h) => (
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
                          <tr
                            key={emp.id}
                            className="border-b border-border hover:bg-muted/50 transition-colors"
                          >
                            {/* Affiliate Name + E-Mail */}
                            <td className="px-4 py-3 text-sm text-foreground font-medium">
                              {emp.empfehler_name}
                              <div className="text-xs text-muted-foreground font-normal">{emp.empfehler_email}</div>
                            </td>

                            {/* Ref-Code */}
                            <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground">
                              {emp.ref_code}
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3">
                              <span className="flex items-center gap-1.5">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: STATUS_DOT_COLORS[emp.status] }}
                                />
                                <span className="text-xs font-semibold" style={{ color: STATUS_DOT_COLORS[emp.status] }}>
                                  {STATUS_LABELS[emp.status]}
                                </span>
                              </span>
                            </td>

                            {/* Betrag (inline editierbar) */}
                            <td className="px-4 py-3">
                              {editingBetragId === emp.id ? (
                                <div className="flex gap-1.5 items-center">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={editBetrag}
                                    onChange={(e) => setEditBetrag(e.target.value)}
                                    className="w-24 px-2 py-1.5 border border-border rounded-lg text-sm font-semibold bg-card text-foreground outline-none focus:border-foreground/40"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleUpdateBetrag(emp);
                                      if (e.key === "Escape") setEditingBetragId(null);
                                    }}
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleUpdateBetrag(emp)}
                                    className="p-1.5 bg-[#16a34a] rounded-md flex items-center cursor-pointer border-0"
                                  >
                                    <Check size={12} color="white" />
                                  </button>
                                  <button
                                    onClick={() => setEditingBetragId(null)}
                                    className="p-1.5 bg-muted rounded-md flex items-center cursor-pointer border border-border"
                                  >
                                    <X size={12} className="text-muted-foreground" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingBetragId(emp.id);
                                    setEditBetrag(emp.rechnungsbetrag ? String(emp.rechnungsbetrag) : "");
                                  }}
                                  className="px-3 py-1 rounded-lg text-xs font-semibold border border-border hover:bg-muted transition-colors cursor-pointer"
                                  style={{
                                    color: emp.rechnungsbetrag ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                                  }}
                                  title="Klicke um Betrag einzutragen"
                                >
                                  {emp.rechnungsbetrag ? formatCurrency(emp.rechnungsbetrag) : "–"}
                                </button>
                              )}
                            </td>

                            {/* Provision (inline editierbar) */}
                            <td className="px-4 py-3">
                              {editingProvisionId === emp.id ? (
                                <div className="flex gap-1.5 items-center">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={editProvision}
                                    onChange={(e) => setEditProvision(e.target.value)}
                                    className="w-24 px-2 py-1.5 border border-border rounded-lg text-sm font-semibold bg-card text-foreground outline-none focus:border-foreground/40"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleUpdateProvision(emp);
                                      if (e.key === "Escape") setEditingProvisionId(null);
                                    }}
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleUpdateProvision(emp)}
                                    className="p-1.5 bg-[#16a34a] rounded-md flex items-center cursor-pointer border-0"
                                  >
                                    <Check size={12} color="white" />
                                  </button>
                                  <button
                                    onClick={() => setEditingProvisionId(null)}
                                    className="p-1.5 bg-muted rounded-md flex items-center cursor-pointer border border-border"
                                  >
                                    <X size={12} className="text-muted-foreground" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingProvisionId(emp.id);
                                    setEditProvision(emp.provision_betrag ? String(emp.provision_betrag) : "");
                                  }}
                                  className="px-3 py-1 rounded-lg text-xs font-semibold border border-border hover:bg-muted transition-colors cursor-pointer"
                                  style={{
                                    color: emp.provision_betrag ? "#16a34a" : "hsl(var(--muted-foreground))",
                                  }}
                                  title="Klicke um Provision anzupassen"
                                >
                                  {emp.provision_betrag ? formatCurrency(emp.provision_betrag) : "–"}
                                </button>
                              )}
                            </td>

                            {/* Datum */}
                            <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                              {formatDate(emp.created_at)}
                            </td>

                            {/* Aktion */}
                            <td className="px-4 py-3">
                              {(() => {
                                const next = NEXT_STATUS[emp.status];
                                if (!next) return null;
                                return (
                                  <button
                                    onClick={() => handleMoveStatus(emp)}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-foreground hover:bg-muted transition-colors whitespace-nowrap cursor-pointer"
                                  >
                                    <ArrowRight size={12} /> {next.label}
                                  </button>
                                );
                              })()}
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
